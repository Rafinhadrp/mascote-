/**
 * App de desktop do mascote <R/>.
 *
 * Abre uma janela transparente do tamanho da tela, sempre por cima de tudo, que deixa os
 * cliques passarem (menos em cima do mascote e dos bilhetes). O mascote roda dentro dela
 * com o mesmo mascote-pet.js do site. No Windows ele arrasta o mouse de verdade e se esconde
 * atrás dos botões e janelas dos outros programas.
 */
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen, shell } = require('electron');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

let janela = null;
let bandeja = null;
let movedor = null;
let consulta = null;
let ajustes = {};

const TAMANHOS = [['Mini', 48], ['Pequeno', 56], ['Médio', 72], ['Grande', 96]];

// ---------------------------------------------------------------- configuração

const arquivoAjustes = () => path.join(app.getPath('userData'), 'ajustes.json');

function lerJson(arquivo) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return {};
  }
}

// config.json (padrões que vêm com o app) + ajustes.json (o que você muda pelo menu)
function config() {
  return { ...lerJson(path.join(__dirname, 'config.json')), ...ajustes };
}

function salvarAjuste(chave, valor) {
  ajustes[chave] = valor;
  try {
    fs.mkdirSync(path.dirname(arquivoAjustes()), { recursive: true });
    fs.writeFileSync(arquivoAjustes(), JSON.stringify(ajustes, null, 2));
  } catch { /* sem permissão de escrita: vale só até fechar */ }
}

function log(...partes) {
  try {
    fs.appendFileSync(path.join(app.getPath('userData'), 'mascote-log.txt'), `[${new Date().toISOString()}] ${partes.join(' ')}\n`);
  } catch { /* ignora */ }
}

// ---------------------------------------------------------------- letras das músicas
// Ficam só no seu computador: %APPDATA%\mascote-pet\letras, um .txt por música
// (o nome do arquivo é o nome da música). Ele canta uma linha de cada vez, em legenda.

const pastaLetras = () => path.join(app.getPath('userData'), 'letras');

function prepararPastaLetras() {
  try {
    fs.mkdirSync(pastaLetras(), { recursive: true });
    const leia = path.join(pastaLetras(), 'LEIA-ME.txt');
    if (!fs.existsSync(leia)) {
      fs.writeFileSync(leia, [
        'Letras pro mascote cantar quando toca violão.',
        '',
        'Crie um arquivo .txt pra cada música, com o nome da música, por exemplo:',
        '  Malbec.txt',
        '  Te Assumi pro Brasil.txt',
        '',
        'Dentro, cole a letra: cada linha vira uma legendinha em cima dele.',
        'Uma linha em branco vira uma pausa com 🎶.',
        '',
        'Se o nome bater com uma música do config.json, ele mostra o artista também.',
        'Músicas que só existem aqui também entram no repertório.',
        'Não precisa reiniciar: ele lê a pasta toda vez que vai tocar.',
      ].join('\r\n'), 'utf8');
    }
  } catch (err) {
    log('letras:', err.message);
  }
}

// Lê as letras da pasta letras/ que vai junto no app e da pasta do seu computador
// (a do computador ganha se as duas tiverem a mesma música).
function lerLetras() {
  const letras = {};
  for (const pasta of [path.join(__dirname, 'letras'), pastaLetras()]) {
    try {
      for (const arquivo of fs.readdirSync(pasta)) {
        if (!arquivo.toLowerCase().endsWith('.txt') || arquivo === 'LEIA-ME.txt') continue;
        const texto = fs.readFileSync(path.join(pasta, arquivo), 'utf8').replace(/^\uFEFF/, '');
        letras[arquivo.slice(0, -4)] = texto.split(/\r?\n/).map((l) => l.trim());
      }
    } catch { /* pasta vazia ou sem acesso */ }
  }
  return letras;
}

// ---------------------------------------------------------------- Windows (PowerShell)
// Sem módulo nativo pra compilar: um PowerShell fica aberto e chama a API do Windows.

function powershell(script, nome) {
  const ps = spawn('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
    { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  ps.on('error', (err) => log(nome, 'não abriu:', err.message));
  ps.stdin.on('error', () => {});
  ps.stderr.on('data', (d) => log(nome, String(d).trim()));
  return ps;
}

const SCRIPT_MOUSE = `
Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
public static class Mouse {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
}
'@
[void][Mouse]::SetProcessDPIAware()
while ($true) {
  $linha = [Console]::In.ReadLine()
  if ($linha -eq $null) { break }
  $p = $linha.Split(' ')
  [void][Mouse]::SetCursorPos([int]$p[0], [int]$p[1])
}`;

// Lista as janelas abertas (da mais da frente pra mais de trás) e os botões da janela em uso
// e da barra de tarefas (via UI Automation). Responde uma linha de JSON por pedido.
const SCRIPT_CONSULTA = `
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, WindowsBase
$refs = @([System.Windows.Automation.AutomationElement].Assembly.Location, [System.Windows.Automation.ControlType].Assembly.Location, [System.Windows.Rect].Assembly.Location)
Add-Type -ReferencedAssemblies $refs -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Windows.Automation;

public static class Pet {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindow(string c, string t);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out int v, int s);
  [DllImport("dwmapi.dll", EntryPoint = "DwmGetWindowAttribute")] static extern int DwmGetRect(IntPtr h, int a, out RECT v, int s);

  static void Add(StringBuilder sb, double l, double t, double r, double b) {
    if (sb.Length > 1) sb.Append(',');
    sb.Append('[').Append((int)l).Append(',').Append((int)t).Append(',').Append((int)r).Append(',').Append((int)b).Append(']');
  }

  public static string Janelas(uint meu) {
    StringBuilder sb = new StringBuilder("[");
    EnumWindows(delegate (IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h) || IsIconic(h) || GetWindowTextLength(h) == 0) return true;
      uint pid;
      GetWindowThreadProcessId(h, out pid);
      if (pid == meu) return true;
      int oculta;
      if (DwmGetWindowAttribute(h, 14, out oculta, 4) == 0 && oculta != 0) return true;
      RECT r;
      if (DwmGetRect(h, 9, out r, 16) != 0) GetWindowRect(h, out r);
      if (r.R - r.L < 120 || r.B - r.T < 80) return true;
      Add(sb, r.L, r.T, r.R, r.B);
      return true;
    }, IntPtr.Zero);
    return sb.Append(']').ToString();
  }

  public static string Botoes(uint meu, int max) {
    StringBuilder sb = new StringBuilder("[");
    Condition cond = new OrCondition(
      new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button),
      new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.SplitButton),
      new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Hyperlink));
    IntPtr[] alvos = new IntPtr[] { GetForegroundWindow(), FindWindow("Shell_TrayWnd", null) };
    int n = 0;
    foreach (IntPtr h in alvos) {
      if (h == IntPtr.Zero) continue;
      uint pid;
      GetWindowThreadProcessId(h, out pid);
      if (pid == meu) continue;
      try {
        AutomationElementCollection lista = AutomationElement.FromHandle(h).FindAll(TreeScope.Descendants, cond);
        foreach (AutomationElement el in lista) {
          if (n >= max) break;
          try {
            if (el.Current.IsOffscreen) continue;
            System.Windows.Rect r = el.Current.BoundingRectangle;
            if (r.IsEmpty || r.Width < 16 || r.Height < 12) continue;
            Add(sb, r.Left, r.Top, r.Right, r.Bottom);
            n++;
          } catch { }
        }
      } catch { }
    }
    return sb.Append(']').ToString();
  }
}
'@
[void][Pet]::SetProcessDPIAware()
while ($true) {
  $linha = [Console]::In.ReadLine()
  if ($linha -eq $null) { break }
  $p = $linha.Split(' ')
  $j = '[]'; $b = '[]'
  try { $j = [Pet]::Janelas([uint32]$p[0]) } catch { }
  if ($p[1] -eq '1') { try { $b = [Pet]::Botoes([uint32]$p[0], 150) } catch { } }
  [Console]::Out.WriteLine('{"janelas":' + $j + ',"botoes":' + $b + '}')
  [Console]::Out.Flush()
}`;

function criarMovedor() {
  if (process.platform === 'win32') {
    const ps = powershell(SCRIPT_MOUSE, 'mouse');
    ps.stdout.resume();
    return {
      mover: (x, y) => ps.stdin.writable && ps.stdin.write(`${x} ${y}\n`),
      fechar: () => ps.kill(),
    };
  }
  if (process.platform === 'linux' && spawnSync('which', ['xdotool']).status === 0) {
    let ocupado = false;
    return {
      mover: (x, y) => {
        if (ocupado) return;
        ocupado = true;
        spawn('xdotool', ['mousemove', String(x), String(y)]).on('exit', () => { ocupado = false; }).on('error', () => { ocupado = false; });
      },
      fechar: () => {},
    };
  }
  return null;
}

function criarConsulta() {
  if (process.platform !== 'win32') return null;
  const ps = powershell(SCRIPT_CONSULTA, 'consulta');
  const esperando = [];
  readline.createInterface({ input: ps.stdout }).on('line', (linha) => {
    const ok = esperando.shift();
    if (!ok) return;
    try { ok(JSON.parse(linha)); } catch { ok(null); }
  });
  let ultimo = null;
  let ocupado = false;
  return {
    // Devolve { janelas, botoes } em pixels físicos; se o PowerShell estiver ocupado, devolve a última resposta.
    async pedir(comBotoes) {
      if (ocupado) return ultimo;
      ocupado = true;
      const resposta = new Promise((ok) => {
        esperando.push(ok);
        ps.stdin.write(`${process.pid} ${comBotoes ? 1 : 0}\n`);
      });
      const limite = new Promise((ok) => setTimeout(() => ok(undefined), 4000));
      const r = await Promise.race([resposta, limite]);
      if (r === undefined) resposta.then((v) => { ultimo = v || ultimo; ocupado = false; });
      else { ultimo = r || ultimo; ocupado = false; }
      return r || ultimo;
    },
    fechar: () => ps.kill(),
  };
}

// ---------------------------------------------------------------- janela

function relativo(b, r) {
  return { x: r.x - b.x, y: r.y - b.y };
}

function criarJanela() {
  const { bounds } = screen.getPrimaryDisplay();
  janela = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  janela.setAlwaysOnTop(true, 'screen-saver');
  janela.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  janela.setIgnoreMouseEvents(true, { forward: true });
  janela.loadFile('desktop.html');

  screen.on('display-metrics-changed', () => janela?.setBounds(screen.getPrimaryDisplay().bounds));

  // Manda a posição do mouse (relativa à janela) ~60x por segundo.
  let ultimo = '';
  setInterval(() => {
    if (!janela || janela.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    const chave = `${p.x},${p.y}`;
    if (chave === ultimo) return;
    ultimo = chave;
    janela.webContents.send('cursor', relativo(janela.getBounds(), p));
  }, 16);
}

function enviarConfig() {
  janela?.webContents.send('config', config());
}

function criarBandeja() {
  bandeja = new Tray(nativeImage.createFromPath(path.join(__dirname, 'sprites', 'icone.png')));
  bandeja.setToolTip('Mascote <R/>');
  bandeja.on('click', () => bandeja.popUpContextMenu());
  const comando = (nome) => () => janela?.webContents.send('comando', nome);
  const inicioAutomatico = () => app.getLoginItemSettings({ path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath }).openAtLogin;
  const montar = () => Menu.buildFromTemplate([
    { label: 'Roubar o mouse agora', click: comando('roubar'), enabled: !!movedor },
    { label: 'Se esconder', click: comando('esconder') },
    { label: 'Deixar um bilhete', click: comando('bilhete') },
    { label: 'Contar uma curiosidade', click: comando('curiosidade') },
    { label: 'Tocar violão', click: comando('violao') },
    { label: 'Abrir pasta das letras', click: () => { prepararPastaLetras(); shell.openPath(pastaLetras()); } },
    { label: 'Dançar', click: comando('dancar') },
    { label: 'Programar', click: comando('programar') },
    { label: 'Dormir', click: comando('dormir') },
    { type: 'separator' },
    {
      label: 'Tamanho',
      submenu: TAMANHOS.map(([nome, px]) => ({
        label: nome, type: 'radio', checked: (config().tamanho || 56) === px,
        click: () => { salvarAjuste('tamanho', px); enviarConfig(); },
      })),
    },
    {
      label: 'Pausar travessuras', type: 'checkbox', checked: !!ajustes.pausado,
      click: (item) => { salvarAjuste('pausado', item.checked); enviarConfig(); },
    },
    {
      label: 'Iniciar junto com o Windows', type: 'checkbox', checked: inicioAutomatico(), visible: process.platform !== 'linux',
      click: (item) => app.setLoginItemSettings({
        openAtLogin: item.checked,
        path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,
      }),
    },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ]);
  bandeja.setContextMenu(montar());
  bandeja.on('right-click', () => bandeja.setContextMenu(montar()));
}

// ---------------------------------------------------------------- comunicação com a janela

ipcMain.handle('info', () => {
  const d = screen.getPrimaryDisplay();
  const area = relativo(d.bounds, d.workArea);
  return {
    config: config(),
    podeMoverCursor: !!movedor,
    area: { left: area.x, top: area.y, right: area.x + d.workArea.width, bottom: area.y + d.workArea.height },
  };
});

ipcMain.handle('letras', () => lerLetras());

ipcMain.handle('esconderijos', async () => {
  if (!consulta || !janela) return null;
  const r = await consulta.pedir(config().botoesDeOutrosApps !== false);
  if (!r) return null;
  const b = janela.getBounds();
  const converter = (lista) => (lista || []).map(([l, t, rr, bb]) => {
    const dip = screen.screenToDipRect(null, { x: l, y: t, width: rr - l, height: bb - t });
    return [dip.x - b.x, dip.y - b.y, dip.x - b.x + dip.width, dip.y - b.y + dip.height];
  });
  return { janelas: converter(r.janelas), botoes: converter(r.botoes) };
});

ipcMain.on('mover-cursor', (_ev, x, y) => {
  if (!movedor || !janela) return;
  const b = janela.getBounds();
  let p = { x: Math.round(b.x + x), y: Math.round(b.y + y) };
  // o Electron trabalha em pixels "lógicos"; o sistema quer pixels reais (zoom do Windows, telas 4K...)
  if (process.platform === 'win32') p = screen.dipToScreenPoint(p);
  else {
    const escala = screen.getPrimaryDisplay().scaleFactor;
    p = { x: Math.round(p.x * escala), y: Math.round(p.y * escala) };
  }
  movedor.mover(p.x, p.y);
});

ipcMain.on('clicavel', (_ev, sim) => {
  if (!janela) return;
  if (sim) janela.setIgnoreMouseEvents(false);
  else janela.setIgnoreMouseEvents(true, { forward: true });
});

// ---------------------------------------------------------------- início

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    ajustes = lerJson(arquivoAjustes());
    prepararPastaLetras();
    movedor = criarMovedor();
    consulta = criarConsulta();
    criarJanela();
    criarBandeja();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => {
    movedor?.fechar();
    consulta?.fechar();
  });
}
