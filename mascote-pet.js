/*!
 * Mascote <R/> — pet de tela (estilo "Desktop Goose").
 *
 * Ele passeia pela tela, rouba o mouse, se esconde atrás de botões, deixa
 * bilhetes, programa e dorme quando você some. Funciona em qualquer site e
 * também dentro do app de desktop (Electron) desta pasta.
 *
 * Uso num site:
 *   <script src="mascote-pet/mascote-pet.js" defer></script>
 *
 * Atributos opcionais na tag: data-sprites="caminho/" (padrão: sprites/ ao lado
 * do script), data-tamanho="128", data-auto="false" (aí você chama
 * MascotePet.iniciar({...}) na mão).
 *
 * Escapar do roubo: sacudir o mouse, clicar no mascote ou apertar Esc.
 */
(function () {
  'use strict';
  if (window.MascotePet) return;

  // --------------------------------------------------------------- dados

  // Sprites em pixel-art de 32x32 (programando é 48x32). "centro" = x do meio do corpo na grade.
  const SPRITES = {
    parado: {}, andando: {}, carregando: {}, feliz: {}, acenando: {}, pensando: {},
    dormindo: {}, erro: {}, digitando: {}, programando: { largura: 48, centro: 11 },
    rindo: {}, tramando: {}, espiando: {}, assustado: {}, emburrado: {}, convencido: {}, bocejando: {},
    fininho: {}, desconfiado: {}, apaixonado: {}, chorando: {}, dancando: {}, estiloso: {}, tonto: {},
    violao: {}, chamando: {},
  };
  const PES_Y = 24;              // linha da grade onde ficam os pés
  const MAO = { x: 11, y: -11 }; // ponta da mão direita no sprite "carregando", relativa aos pés

  // Ele não repete uma frase até ter dito todas da mesma lista. {n} = quantos mouses já roubou hoje.
  const FALAS = {
    oi: ['oi! eu sou o <R/> 👋', 'cheguei! 👋', 'opa, bora trabalhar? 👋', 'voltei! sentiu saudade?', 'e aí, beleza? 😄'],
    bomDia: ['bom dia! ☀️', 'bom dia, já tomou café? ☕'],
    boaTarde: ['boa tarde! 🌤️', 'boa tarde, bora produzir!'],
    boaNoite: ['boa noite! 🌙', 'trabalhando a essa hora? 🌙'],
    tramar: ['hehe... 😈', 'que mouse bonito...', '*plano maligno*', 'hmmm 😏', 'tive uma ideia...', 'muahaha', 'ninguém desconfia de nada...'],
    desconfiado: ['hmm... 🤨', 'tô de olho em você', 'que cursor suspeito...', 'esse mouse aí...', 'interessante... 🧐', 'nada não... 👀'],
    curioso: ['👀', 'o que cê tá fazendo?', 'posso ver?', 'hmm, interessante', 'deixa eu ver isso aí'],
    quase: ['quase! 😤', 'escapou por pouco...', 'da próxima eu pego', 'mouse liso esse!'],
    pegou: ['HEHEHE roubei seu mouse!', 'HAHAHA é meu agora!', 'hihihi peguei!', 'roubadooo 😈', 'perdeu, playboy! 😎',
      'esse mouse agora tem dono!', 'vem pegar se for capaz!', 'achado não é roubado! 🤭', 'obrigado pelo mouse!'],
    contagem: ['já é o {n}º mouse que eu roubo hoje 😎', '{n} a 0 pra mim!', 'roubo número {n}! recorde?', '{n} roubos hoje e contando...'],
    percebeu: ['opa! 😳', 'ih, me viu!', 'xiii, flagrado!', 'eita! corre!'],
    largouCanto: ['pronto, tá aqui 🤭', 'deixei ali no cantinho', 'mudei seu mouse de lugar 😇', 'missão cumprida 🥷'],
    correndo: ['hehehe', 'hihihi', 'ninguém me pega!', 'HAHAHA', 'tchau mouse 👋', 'vruuum 💨', 'pega eu!', 'lalala 🎶'],
    dica: ['(sacode o mouse pra se soltar)'],
    soltou: ['hmpf! 😤', 'não valeu!', 'eu só tava pegando emprestado...', 'aff 😒', 'tá bom, fica com ele', 'injusto!', 'da próxima não escapa!'],
    choro: ['buáááá 😭', 'era meu mouse...', 'snif snif 😢', 'ninguém me deixa brincar 😭'],
    achou: ['achou! 😱', 'AAAH', 'como me achou?!', 'não tô aqui!', 'esconderijo ruim esse...'],
    escondido: ['procura aí 😜', 'cadê? cadê? 🤭', 'tá quente... tá frio...', 'tá esfriando...', 'dica: tá atrás de alguma coisa'],
    escondidoSozinho: ['shhh 🤫', 'ninguém me vê aqui', 'modo camuflagem', '👀'],
    escondidoComMouse: ['shhh, ninguém vai achar a gente 🤫', 'esconderijo secreto 🤭', 'quietinho, mouse...'],
    devolveu: ['HAHAHA 🤣', 'toma, pode ficar 😜', 'hehehe foi mal', 'brincadeirinha!', 'tá devolvido, viu?'],
    estiloso: ['😎', 'profissional', 'nem viu, né?', 'sou rápido demais', 'estilo é tudo 😎'],
    resgatou: ['hmpf, achou 😤', 'tava fácil, né', 'da próxima eu escondo melhor', 'sorte de principiante'],
    clique: ['oi!', 'hehe', '</>', 'para 😳', 'tô trabalhando!', 'pois não?', 'quer alguma coisa?', 'eu!', 'opa!'],
    cocegas: ['para! tenho cócegas 🤣', 'HAHAHA para!', 'hihihi', 'aí não! 🤣'],
    chega: ['CHEGA! 😤', 'vou me esconder de você!', 'que mão pesada!'],
    apaixonado: ['❤️', 'você é legal', 'gosto de você 🥺', 'awn 🥰', 'carinho bom'],
    carinho: ['carinho? 🥺', 'hihi 🥰', 'mais um pouquinho...'],
    arrastado: ['tô tonto 😵', 'me põe no chão!', 'eu ando sozinho, tá?', 'o mundo tá girando...', 'uoooou 😵‍💫'],
    sacudido: ['PARA DE ME SACUDIR!', 'aaaaah 😵‍💫', 'vou vomitar...'],
    girando: ['para de rodar! 😵', 'tô vendo estrelas ✨', 'rodou, rodou...'],
    acordou: ['opa! oi 👋', 'eu não tava dormindo', 'que susto!', 'só tava descansando o olho', 'hã? quê? oi!'],
    sono: ['*bocejo*', 'que sono...', 'vou só fechar o olho...'],
    dormindo: ['zzz', 'zzz... mouse... zzz', '💤', 'zzz... mais 5 minutinhos...'],
    programar: ['git push --force 😈', 'funciona na minha máquina', 'só mais um commit', 'deploy na sexta?', 'quem escreveu isso?? ah, fui eu',
      'console.log("aqui")', 'é feature, não bug', 'hoje vai!', 'esqueci o ponto e vírgula'],
    pensar: ['hmm...', '🤔', 'e se...', 'tô pensando...', 'será?'],
    dancar: ['🎵 tum tss tum tss', 'olha o passinho!', '🎶', 'dança comigo!', 'sextou? 🎉'],
    desistir: ['ah, deixa...', 'rápido demais 😤', 'cansei...', 'depois eu pego'],
    bilhete: ['tenho um recado!', 'chegou correspondência 📬', 'peraí, deixa eu achar...', 'assina aqui 📝'],
    bilheteEntregue: ['tá no cantinho 📬', 'não esquece de ler!', 'entregue ✅', 'recado dado!'],
    chamar: ['ei, ei!', 'EI! aqui!', 'psiu! 👋', 'olha pra cá!'],
    cantarolar: ['♪ la la laiá ♪', '🎶 hmm hmm hmm', '♪ pa ra ra ♪', '♪ uô uô uô ♪', '🎵 na na na', '♪ laiá laiá ♪',
      '🎶 tchu tchu ru', '♪ êêê ♪', '♪ ô ô ô ♪', '🎶 (solo de violão)'],
    aplausos: ['obrigado, obrigado 🙇', 'valeu, galera! 🎸', 'quem pediu essa? 😄', 'aplausos! 👏', 'bis? 🎶', 'essa foi pra você ❤️'],
    moonwalk: ['hee-hee! 🕺', 'moonwalk 😎', 'cê viu isso?!'],
    sextou: ['SEXTOU! 🎉', 'sextouuu 🎉🕺'],
    almoco: ['hora do almoço! 🍔', 'já almoçou? 🍽️'],
    hora: ['já são {h}h! estica as pernas 🧘', '{h}h! bebe uma água 💧', 'passou mais uma hora... {h}h ⏰'],
    ovo: ['🥚 você achou um easter egg!', '🥚 segredo desbloqueado!'],
  };

  const PADRAO = {
    sprites: null,                // pasta (string) ou { nome: url }
    tamanho: 56,                  // px
    falas: true,
    travessuras: { roubarMouse: true, esconder: true, bilhetes: true },
    intervaloRoubo: [120, 300],   // segundos entre um roubo de mouse e outro
    intervaloBilhete: [180, 420], // segundos entre bilhetes
    descanso: [45, 110],          // segundos de sossego depois de qualquer travessura grande
    sonoDepoisDe: 45,             // segundos sem mexer o mouse até ele dormir
    bilheteSomeDepois: 90,        // segundos até o bilhete sumir sozinho (0 = só no ×)
    mensagens: [
      'Bebe água! 💧', 'Já fez commit hoje?', 'O bug tá na linha 42.', '</> rafinhadr passou por aqui',
      'Vai dormir, já tá tarde 😴', 'Sorria, você tá sendo observado 👀', 'Ctrl+S salva vidas.',
      'Postura! Endireita essa coluna 🧘', 'Pisca o olho, descansa a vista 👀', 'Já salvou o arquivo?',
      'Você tá indo bem! 💪', 'Lembrete: você é incrível ✨', 'Hora de uma pausa pro café ☕',
      'Não esquece de responder aquela mensagem 📱', 'Fecha umas abas aí, vai 😅',
    ],
    musicas: [ // o que ele toca no violão (só o nome e o artista; ele cantarola a melodia)
      { musica: 'Te Assumi pro Brasil', artista: 'Matheus & Kauan' },
      { musica: 'Seu Astral', artista: 'Jorge & Mateus' },
      { musica: 'Malbec', artista: 'Henrique & Diego e Dennis DJ' },
      { musica: 'Vai Cair Água', artista: 'Zé Neto & Cristiano' },
      { musica: 'Dona', artista: 'Luan Santana e Léo Foguete' },
      { musica: 'Eu Era', artista: 'Marcos & Belutti' },
      { musica: 'Não Namora', artista: 'Zé Neto & Cristiano' },
      { musica: 'Postinho de Gasolina' },
      { musica: 'Entregador de Flor', artista: 'Diego & Victor Hugo' },
      { musica: 'Tem Que Sorrir', artista: 'Jorge & Mateus' },
      { musica: 'Barulho do Foguete', artista: 'Zé Neto & Cristiano' },
      { musica: 'Cadeira Cativa', artista: 'Zé Neto & Cristiano' },
      { musica: 'Me Encontra', artista: 'Charlie Brown Jr.' },
      { musica: 'Como Tudo Deve Ser', artista: 'Charlie Brown Jr.' },
    ],
    curiosidades: [
      'Você sabia que o Rafinha é o mais lindo do Brasil?', 'Você sabia que o Rafinha programa até dormindo?',
      'Você sabia que eu fui feito pixel por pixel?', 'Você sabia que o polvo tem três corações? 🐙',
      'Você sabia que o primeiro bug foi uma mariposa de verdade? 🦋', 'Você sabia que o mel nunca estraga? 🍯',
      'Você sabia que eu já roubei mais de mil mouses?', 'Você sabia que o Rafinha é o melhor programador do mundo?',
      'Você sabia que a Torre Eiffel cresce no verão? 🗼', 'Você sabia que flamingos dormem numa perna só? 🦩',
    ],
    desktop: null,                // ponte do app Electron (preload.js); null = modo site
  };

  const CURSOR_SVG = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="19" viewBox="0 0 11 16">' +
    '<path d="M.5.5v12.8l3.1-3 2.1 4.9 2.3-1-2.1-4.7H10z" fill="#fff" stroke="#000" stroke-linejoin="round"/></svg>');

  const CSS = `
.mpet-raiz{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;font:12px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace}
.mpet{position:absolute;left:0;top:0;width:0;height:0;will-change:transform}
.mpet-recorte{position:absolute}
.mpet-img{position:absolute;image-rendering:pixelated;pointer-events:none;user-select:none;-webkit-user-drag:none}
.mpet-toque{position:absolute;pointer-events:auto;cursor:grab;touch-action:none}
.mpet-cursor,.mpet-largado,.mpet-fantasma{position:absolute;left:0;top:0;width:13px;height:19px;pointer-events:none;display:none}
.mpet-fantasma{opacity:.35}
.mpet-fala{position:absolute;left:0;transform:translate(-50%,-100%);background:#0d1117;color:#e6edf3;border:2px solid #58a6ff;
  border-radius:5px;padding:2px 6px;width:max-content;max-width:200px;font-size:11px;text-align:center;opacity:0;transition:opacity .15s}
.mpet-fala.mpet-on{opacity:1}
.mpet-bilhete{position:absolute;left:0;top:0;width:220px;box-sizing:border-box;display:grid;grid-template-columns:24px 1fr auto;gap:8px;
  align-items:start;background:#1c2128;color:#e6edf3;border:1px solid #30363d;border-radius:8px;padding:8px 8px 8px 10px;
  box-shadow:0 8px 24px rgba(0,0,0,.4);pointer-events:auto;user-select:none;transform-origin:50% 100%;scale:0;
  transition:scale .25s,opacity .4s}
.mpet-bilhete.mpet-levando{scale:.6}
.mpet-bilhete.mpet-pousado{scale:1;transition:transform .35s ease,scale .25s,opacity .4s}
.mpet-bilhete.mpet-sumindo{opacity:0}
.mpet-bilhete img{width:24px;height:24px;image-rendering:pixelated;object-fit:cover;object-position:50% 70%}
.mpet-bilhete .mpet-t{color:#58a6ff;font-weight:700;font-size:11px;margin-bottom:1px}
.mpet-bilhete .mpet-m{font:12px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif}
.mpet-bilhete button{all:unset;cursor:pointer;color:#8b949e;padding:0 4px;font-size:15px;line-height:1}
.mpet-bilhete button:hover{color:#f85149}
html.mpet-sem-cursor,html.mpet-sem-cursor *{cursor:none!important}`;

  // --------------------------------------------------------------- utilidades

  const agora = () => performance.now();
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  class Cancelado extends Error {}

  function criar(tag, classe, pai) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (pai) pai.appendChild(el);
    return el;
  }

  // Recorte "tudo menos o retângulo r" para uma caixa (bx, by, w, h) em coordenadas da tela.
  function recorteSem(r, bx, by, w, h) {
    const x0 = r.left - bx, y0 = r.top - by, x1 = r.right - bx, y1 = r.bottom - by;
    if (x1 <= 0 || y1 <= 0 || x0 >= w || y0 >= h) return '';
    const cx = (v) => Math.round(limitar(v, -1, w + 1));
    const cy = (v) => Math.round(limitar(v, -1, h + 1));
    return `path(evenodd, "M0 0H${w}V${h}H0Z M${cx(x0)} ${cy(y0)}H${cx(x1)}V${cy(y1)}H${cx(x0)}Z")`;
  }

  // --------------------------------------------------------------- pet

  function iniciar(opcoes = {}) {
    const o = { ...PADRAO, ...opcoes, travessuras: { ...PADRAO.travessuras, ...(opcoes.travessuras || {}) } };
    const desktop = o.desktop;
    const s = o.tamanho / 32;
    const CAIXA = { esq: 40 * s, topo: 30 * s, w: 80 * s, h: 32 * s }; // área desenhável em volta dos pés

    const urlSprite = (nome) => (o.sprites && typeof o.sprites === 'object'
      ? o.sprites[nome]
      : `${o.sprites || 'sprites/'}${nome}-128.gif`);
    for (const nome in SPRITES) new Image().src = urlSprite(nome); // pré-carrega

    // ---- DOM
    const estilo = criar('style', null, document.head);
    estilo.textContent = CSS;
    const raiz = criar('div', 'mpet-raiz', document.body);
    const corpo = criar('div', 'mpet', raiz);
    const recorte = criar('div', 'mpet-recorte', corpo);
    Object.assign(recorte.style, { left: -CAIXA.esq + 'px', top: -CAIXA.topo + 'px', width: CAIXA.w + 'px', height: CAIXA.h + 'px' });
    const img = criar('img', 'mpet-img', recorte);
    img.alt = '';
    img.draggable = false;
    const toque = criar('div', 'mpet-toque mpet-clicavel', recorte);
    Object.assign(toque.style, { left: CAIXA.esq - 10 * s + 'px', top: CAIXA.topo - 15 * s + 'px', width: 20 * s + 'px', height: 15 * s + 'px' });
    toque.title = '<R/>';
    const cursorFalso = criar('img', 'mpet-cursor', recorte);
    cursorFalso.src = CURSOR_SVG;
    const fala = criar('div', 'mpet-fala', corpo);
    fala.style.top = -18 * s + 'px';
    const largadoEl = criar('img', 'mpet-largado', raiz);
    largadoEl.src = CURSOR_SVG;
    const fantasma = criar('img', 'mpet-fantasma', raiz);
    fantasma.src = CURSOR_SVG;

    // ---- estado
    const larg = () => window.innerWidth;
    const alt = () => window.innerHeight;
    const pos = { x: aleatorio(0.2, 0.8) * larg(), y: alt() - 4 * s };
    let virado = false;
    let spriteAtual = '';
    let esconderijo = null;  // { rect(), lado, saindo }
    let segurando = false;   // true = está com o mouse na mão
    let largado = null;      // { x, y, esconderijo } — mouse escondido esperando resgate (site)
    let esforco = 0;         // quanto a pessoa sacudiu o mouse pra se soltar
    let escapou = false;
    let percebido = 0;       // quanto você mexeu o mouse enquanto ele levava de fininho
    let ultimoEnviado = null;
    let arrasto = null;      // { dx, dy, inicio, moveu }
    let pausado = false;
    let clicavel = null;
    let timerFala = 0;
    let proximoRoubo = agora() + aleatorio(40, 90) * 1000;
    let proximoBilhete = agora() + aleatorio(60, 150) * 1000;
    // depois de cada travessura grande ele sossega um tempo, e cada uma tem seu próprio intervalo
    let sossegoAte = agora() + 25000;
    const proxima = { violao: agora() + 60000, anunciar: agora() + 90000, esconder: agora() + 40000 };
    const cursor = { x: -1e4, y: -1e4, dentro: !!desktop, mexeu: agora() };
    const podeRoubar = desktop ? !!desktop.podeMoverCursor : matchMedia('(pointer: fine)').matches;

    // ---- tarefas (cada comportamento é uma função async que pode ser interrompida)
    let esperando = [];
    let tarefa = { viva: true };
    let reacao = null;
    const quadro = (t) => new Promise((ok, falha) => esperando.push((dt) => (t.viva ? ok(dt) : falha(new Cancelado()))));
    async function esperar(t, ms, cada) {
      for (let passou = 0; passou < ms;) {
        passou += (await quadro(t)) * 1000;
        if (cada && cada() === false) return false;
      }
      return true;
    }
    function reagir(acao) {
      reacao = acao;
      tarefa.viva = false;
    }

    function sprite(nome) {
      if (nome === spriteAtual) return;
      spriteAtual = nome;
      const info = SPRITES[nome];
      const w = (info.largura || 32) * s;
      const c = (info.centro || 16) * s;
      img.src = urlSprite(nome);
      Object.assign(img.style, {
        width: w + 'px', height: 32 * s + 'px', left: CAIXA.esq - c + 'px', top: CAIXA.topo - PES_Y * s + 'px',
        transformOrigin: `${c}px 0`,
      });
    }

    function falar(lista, ms = 2400) {
      if (!o.falas) return;
      fala.textContent = Array.isArray(lista) ? sortear(lista) : lista;
      fala.classList.add('mpet-on');
      clearTimeout(timerFala);
      timerFala = setTimeout(() => fala.classList.remove('mpet-on'), ms);
    }

    // Pega a próxima frase de uma lista sem repetir até usar todas.
    const sacos = new Map();
    function sacoDe(chave, lista) {
      let saco = sacos.get(chave);
      if (!saco || !saco.length) {
        const ultima = saco?.ultima;
        saco = [...lista].sort(() => Math.random() - 0.5);
        if (saco.length > 1 && saco[0] === ultima) saco.push(saco.shift());
        sacos.set(chave, saco);
      }
      const f = saco.shift();
      saco.ultima = f;
      return f;
    }
    const frase = (chave) => sacoDe(chave, FALAS[chave])
      .replace('{n}', String(roubosHoje().n))
      .replace('{h}', String(new Date().getHours()));

    // Quantos mouses ele roubou hoje (fica salvo no navegador / no app).
    function roubosHoje() {
      const dia = new Date().toDateString();
      try {
        const r = JSON.parse(localStorage.getItem('mpet-roubos') || '{}');
        return r.dia === dia ? r : { dia, n: 0 };
      } catch { return { dia, n: 0 }; }
    }
    function contarRoubo() {
      const r = roubosHoje();
      r.n += 1;
      try { localStorage.setItem('mpet-roubos', JSON.stringify(r)); } catch { /* sem armazenamento: tudo bem */ }
      return r.n;
    }

    const maoPos = () => ({ x: pos.x + (virado ? -MAO.x : MAO.x) * s, y: pos.y + MAO.y * s });
    const cabeca = () => ({ x: pos.x, y: pos.y - 8 * s });
    const pontoAleatorio = () => ({ x: aleatorio(10 * s, larg() - 10 * s), y: aleatorio(16 * s, alt() - 2 * s) });

    // Anda até o alvo (ponto ou função que devolve ponto). Devolve false se estourar o tempo.
    async function andarAte(t, alvo, { velocidade = 18, nome = 'andando', chegou, limite = 20000, cada } = {}) {
      const inicio = agora();
      for (;;) {
        const a = typeof alvo === 'function' ? alvo() : alvo;
        const dx = a.x - pos.x, dy = a.y - pos.y;
        const d = Math.hypot(dx, dy);
        if (d < 2 || (chegou && chegou())) return true;
        if (agora() - inicio > limite) return false;
        sprite(nome);
        const dt = await quadro(t);
        if (cada) cada();
        const passo = Math.min(d, velocidade * Math.max(3, s) * dt); // pequeno não fica lerdo
        if (d > 0) {
          pos.x += (dx / d) * passo;
          pos.y += (dy / d) * passo;
        }
        if (Math.abs(dx) > 1) virado = dx < 0;
      }
    }

    // ---- esconderijos: no site, botões/links/cards da página; no desktop, botões e janelas de
    //      verdade do Windows (o app pergunta pro sistema onde estão), a barra de tarefas e as bordas
    const fixo = (l, tp, r, b) => () => ({ left: l, top: tp, right: r, bottom: b });

    function ladosPara(r, W) {
      const lados = [];
      if (r.top >= 13 * s) lados.push('cima');
      if (r.bottom - r.top >= 12 * s && r.left > 8 * s) lados.push('esquerda');
      if (r.bottom - r.top >= 12 * s && r.right < W - 8 * s) lados.push('direita');
      return lados;
    }

    async function escolherEsconderijo() {
      const W = larg(), H = alt();
      const botoes = [], janelas = [];
      if (!desktop) {
        const els = document.querySelectorAll('button, a, input[type=button], input[type=submit], [role=button], img, .btn, .card');
        for (const el of els) {
          if (raiz.contains(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 20 || r.width > 700 || r.height > 500) continue;
          if (r.left < 4 * s || r.right > W - 4 * s || r.bottom > H) continue;
          const st = getComputedStyle(el);
          if (st.visibility === 'hidden' || st.opacity === '0') continue;
          const lados = ladosPara(r, W);
          if (lados.length) botoes.push({ rect: () => (el.isConnected ? el.getBoundingClientRect() : null), lado: sortear(lados) });
        }
      } else if (desktop.esconderijos) {
        let d = null;
        try { d = await desktop.esconderijos(); } catch { /* sem resposta do sistema: usa as bordas */ }
        for (const [l, tp, r, b] of d?.botoes || []) {
          if (r - l < 16 || b - tp < 12 || r - l > 600 || b - tp > 400 || l < 0 || r > W || b > H) continue;
          const lados = ladosPara({ left: l, top: tp, right: r, bottom: b }, W);
          if (lados.length) botoes.push({ rect: fixo(l, tp, r, b), lado: sortear(lados) });
        }
        // janelas vêm da mais da frente pra mais de trás; só vale espiar onde nenhuma outra cobre
        const naFrente = [];
        for (const [l, tp, r, b] of (d?.janelas || []).slice(0, 6)) {
          const rr = { left: l, top: tp, right: r, bottom: b };
          const coberto = (p) => naFrente.some((a) => p.x >= a.left && p.x <= a.right && p.y >= a.top && p.y <= a.bottom);
          const lados = ladosPara(rr, W).filter((lado) => {
            const p = pontoDeEspiar({ rect: () => rr, lado, xRel: 0.5 });
            return !coberto({ x: p.x, y: p.y - 8 * s }) && !coberto({ x: p.x, y: p.y });
          });
          naFrente.push(rr);
          if (lados.length) janelas.push({ rect: () => rr, lado: sortear(lados) });
        }
      }
      const sorteio = Math.random();
      if (botoes.length && sorteio < (desktop ? 0.55 : 0.85)) return sortear(botoes);
      if (janelas.length && sorteio < 0.85) return sortear(janelas);
      const area = desktop?.area; // tela sem a barra de tarefas
      if (area && area.bottom < H - 8 && Math.random() < 0.6) {
        return { rect: fixo(-1e5, area.bottom, 1e5, 1e5), lado: 'barra', x: aleatorio(12 * s, W - 12 * s) };
      }
      const lado = sortear(['baixo', 'baixo', 'borda-esquerda', 'borda-direita']);
      const R = {
        baixo: () => ({ left: -1e5, right: 1e5, top: alt(), bottom: 1e5 }),
        'borda-esquerda': () => ({ left: -1e5, right: 0, top: -1e5, bottom: 1e5 }),
        'borda-direita': () => ({ left: larg(), right: 1e5, top: -1e5, bottom: 1e5 }),
      }[lado];
      return { rect: R, lado, y: aleatorio(20 * s, H - 4 * s), x: aleatorio(12 * s, W - 12 * s) };
    }

    // Onde ficar de pé para espiar (só a cabeça/olho aparecendo).
    function pontoDeEspiar(e) {
      const r = e.rect();
      if (!r) return null;
      e.xRel ??= Math.random();
      switch (e.lado) {
        case 'cima': {
          const min = r.left + 6 * s, max = r.right - 6 * s;
          return { x: min < max ? min + (max - min) * e.xRel : (r.left + r.right) / 2, y: r.top + 6 * s };
        }
        case 'esquerda': return { x: r.left + 1 * s, y: r.bottom - 1 * s };
        case 'direita': return { x: r.right - 1 * s, y: r.bottom - 1 * s };
        case 'barra': return { x: e.x, y: r.top + 6 * s };
        case 'baixo': return { x: e.x, y: alt() + 6 * s };
        case 'borda-esquerda': return { x: -1 * s, y: e.y };
        default: return { x: larg() + 1 * s, y: e.y };
      }
    }

    // Onde largar o mouse escondido: quase todo atrás, só a pontinha aparecendo.
    function pontoDeLargar(e) {
      const r = e.rect(), m = maoPos();
      switch (e.lado) {
        case 'cima': return { x: limitar(m.x, r.left + 4, r.right - 14), y: r.top - 6 };
        case 'esquerda': return { x: r.left - 5, y: limitar(m.y, r.top + 2, r.bottom - 10) };
        case 'direita': return { x: r.right - 7, y: limitar(m.y, r.top + 2, r.bottom - 10) };
        case 'barra': return { x: m.x, y: r.top - 6 };
        case 'baixo': return { x: m.x, y: alt() - 6 };
        case 'borda-esquerda': return { x: -6, y: m.y };
        default: return { x: larg() - 5, y: m.y };
      }
    }

    // ---- o mouse (no site o cursor de verdade some e um falso fica na mão dele;
    //      no desktop o cursor de verdade é arrastado mesmo)
    function pegarCursor() {
      segurando = true;
      esforco = 0;
      escapou = false;
      if (!desktop) document.documentElement.classList.add('mpet-sem-cursor');
    }
    function devolverCursor() {
      segurando = false;
      largado = null;
      ultimoEnviado = null;
      document.documentElement.classList.remove('mpet-sem-cursor');
    }
    const cursorPreso = () => !desktop && (segurando || !!largado);
    // No desktop, manda o mouse de verdade pra mão dele (chamado a cada quadro enquanto segura).
    function prenderCursor() {
      if (!desktop || !segurando) return;
      ultimoEnviado = maoPos();
      desktop.moverCursor(ultimoEnviado.x, ultimoEnviado.y);
    }
    // Para e faz uma cara sem largar o mouse. Devolve false se você escapou no meio.
    async function segurandoPor(t, ms, nome) {
      sprite(nome);
      return esperar(t, ms, () => { prenderCursor(); return !escapou; });
    }

    // ---- comportamentos
    async function saudar(t) {
      sprite('acenando');
      const h = new Date().getHours();
      falar(frase(Math.random() < 0.5 ? 'oi' : h < 12 ? 'bomDia' : h < 18 ? 'boaTarde' : 'boaNoite'), 3000);
      await esperar(t, 2500);
    }

    async function passear(t) {
      await andarAte(t, pontoAleatorio(), { limite: 12000 });
      sprite('parado');
      await esperar(t, aleatorio(1500, 4000));
    }

    // Parado fazendo alguma cara.
    async function ficar(t) {
      const [nome, fala] = sortear([
        ['pensando', 'pensar'], ['pensando', null], ['tramando', 'tramar'], ['espiando', null], ['parado', null],
        ['parado', null], ['dancando', 'dancar'], ['desconfiado', 'desconfiado'], ['estiloso', 'estiloso'],
      ]);
      sprite(nome);
      if (fala && Math.random() < 0.5) falar(frase(fala));
      await esperar(t, aleatorio(3000, 8000));
    }

    async function programar(t) {
      sprite(Math.random() < 0.5 ? 'programando' : 'digitando');
      if (Math.random() < 0.6) falar(frase('programar'), 3000);
      await esperar(t, aleatorio(6000, 12000));
    }

    async function curioso(t) {
      if (!cursor.dentro) return passear(t);
      await andarAte(t, () => ({ x: cursor.x + (cursor.x > pos.x ? -60 : 60), y: cursor.y + 40 }), { limite: 5000 });
      virado = cursor.x < pos.x;
      sprite(sortear(['tramando', 'desconfiado', 'parado']));
      if (Math.random() < 0.6) falar(frase(spriteAtual === 'parado' ? 'curioso' : spriteAtual === 'tramando' ? 'tramar' : 'desconfiado'), 1800);
      await esperar(t, aleatorio(1500, 3500));
    }

    async function dormir(t) {
      sprite('bocejando');
      falar(frase('sono'), 1500);
      if (await esperar(t, 1500, () => agora() - cursor.mexeu > 300)) {
        sprite('dormindo');
        falar(frase('dormindo'), 2500);
        await esperar(t, 1e9, () => agora() - cursor.mexeu > 300);
      }
      sprite('assustado');
      await esperar(t, 500);
      sprite('acenando');
      falar(frase('acordou'));
      await esperar(t, 1500);
    }

    async function esconder(t) {
      const e = await escolherEsconderijo();
      esconderijo = e;
      try {
        await andarAte(t, () => pontoDeEspiar(e) || pos, { velocidade: 40, limite: 15000 });
        sprite('espiando');
        if (Math.random() < 0.4) falar(frase('escondidoSozinho'), 1800);
        const ok = await esperar(t, aleatorio(5000, 11000), () => {
          if (!e.rect()) return false;
          const p = pontoDeEspiar(e);
          pos.x = p.x; pos.y = p.y;   // acompanha se a página rolar
          return !(cursor.dentro && distancia(cursor, cabeca()) < 22 * s);
        });
        if (!ok && e.rect()) {
          sprite('assustado');
          falar(frase('achou'));
          await esperar(t, 700);
          e.saindo = true;
          await andarAte(t, pontoAleatorio(), { velocidade: 60, limite: 6000 });
        }
      } finally {
        e.saindo = true;
      }
    }

    // Faz cara de coitado quando você escapa: emburrado ou chorando.
    async function perdeu(t) {
      const chorar = Math.random() < 0.4;
      sprite(chorar ? 'chorando' : 'emburrado');
      falar(frase(chorar ? 'choro' : 'soltou'));
      await esperar(t, 1900);
    }

    async function roubarMouse(t) {
      if (!podeRoubar || !cursor.dentro) {
        falar('cadê o mouse? 🤔');
        return esperar(t, 1500);
      }
      // 1. olha desconfiado pro mouse
      virado = cursor.x < pos.x;
      sprite('desconfiado');
      await esperar(t, 1100);

      // 2. vai chegando de fininho. Se você mexe o mouse rápido, ele congela e disfarça.
      const lado = () => (cursor.x >= pos.x ? 1 : -1);
      const pertinho = () => ({ x: cursor.x - lado() * (MAO.x * s + 50), y: cursor.y - MAO.y * s });
      const inicio = agora();
      let antes = { x: cursor.x, y: cursor.y };
      let disfarce = 0;
      for (;;) {
        const alvo = pertinho();
        const d = distancia(pos, alvo);
        if (d < 4) break;
        if (agora() - inicio > 30000) {
          sprite('emburrado');
          falar(frase('desistir'));
          return esperar(t, 1500);
        }
        const dt = await quadro(t);
        const mexeu = distancia(cursor, antes) > 260 * dt; // mouse andando rápido = você está "olhando"
        antes = { x: cursor.x, y: cursor.y };
        if (mexeu && d < 320) {
          if (disfarce <= 0) sprite(sortear(['parado', 'espiando'])); // congela e finge que não é nada
          disfarce = 700;
          continue;
        }
        if (disfarce > 0) { disfarce -= dt * 1000; continue; }
        const longe = d > 280;
        sprite(longe ? 'andando' : 'fininho');
        const passo = Math.min(d, (longe ? 32 : 12) * Math.max(3, s) * dt);
        pos.x += ((alvo.x - pos.x) / d) * passo;
        pos.y += ((alvo.y - pos.y) / d) * passo;
        if (Math.abs(alvo.x - pos.x) > 1) virado = alvo.x < pos.x;
      }

      // 3. o bote!
      const pegou = await andarAte(t, () => ({ x: cursor.x - lado() * MAO.x * s, y: cursor.y - MAO.y * s }), {
        velocidade: 130, chegou: () => distancia(cursor, maoPos()) < 8 * s, limite: 1400,
      });
      if (!pegou) {
        sprite('emburrado');
        falar(frase('quase'));
        return esperar(t, 1600);
      }

      // 4. pegou! gargalha e sai correndo em zigue-zague, parando pra rir
      pegarCursor();
      const n = contarRoubo();
      proximoRoubo = agora() + aleatorio(...o.intervaloRoubo) * 1000;
      const querEsconder = o.travessuras.esconder && Math.random() < 0.6;
      const pedido = querEsconder ? escolherEsconderijo() : null; // já vai perguntando onde se esconder
      let e = null;
      try {
        if (Math.random() < 0.4 && (await levarDeFininho(t))) return;
        if (escapou) return await perdeu(t);
        const grito = n > 1 && Math.random() < 0.35 ? frase('contagem') : frase('pegou');
        falar(desktop ? grito : `${grito} ${FALAS.dica[0]}`, 2600);
        await segurandoPor(t, 1100, 'rindo');
        const voltas = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < voltas && !escapou; i++) {
          await andarAte(t, pontoAleatorio(), {
            velocidade: 55, nome: 'carregando', limite: 6000, chegou: () => escapou, cada: prenderCursor,
          });
          if (!escapou && Math.random() < 0.6) {
            falar(frase('correndo'), 1300);
            await segurandoPor(t, 650, 'rindo');
          }
        }
        // 5. leva o mouse pro esconderijo
        if (pedido && !escapou) {
          esconderijo = e = await pedido;
          await andarAte(t, () => pontoDeEspiar(e) || pos, {
            velocidade: 50, nome: 'carregando', limite: 15000, chegou: () => escapou, cada: prenderCursor,
          });
        }
        if (escapou) {
          devolverCursor();
          return await perdeu(t);
        }

        if (desktop || !e) {
          if (e) { // desktop: fica escondido segurando o seu mouse mais um pouco
            falar(frase('escondidoComMouse'), 2500);
            if (!(await segurandoPor(t, 2600, 'espiando'))) {
              devolverCursor();
              return await perdeu(t);
            }
          }
          devolverCursor();
          sprite('rindo');
          falar(frase('devolveu'));
          await esperar(t, 1500);
          const pose = Math.random() < 0.5 ? 'estiloso' : 'convencido';
          sprite(pose);
          if (pose === 'estiloso') falar(frase('estiloso'), 1800);
          return await esperar(t, 1600);
        }

        // Site: larga o mouse atrás do esconderijo e espera você achar.
        const p = pontoDeLargar(e);
        segurando = false;
        largado = { x: p.x, y: p.y, esconderijo: e };
        sprite('convencido');
        falar(frase('escondido'));
        await esperar(t, 15000, () => {
          if (!largado) return false;
          const q = pontoDeEspiar(e);
          if (q) { pos.x = q.x; pos.y = q.y; }
          if (spriteAtual === 'convencido' && Math.random() < 0.004) sprite('espiando');
        });
        if (largado) devolverCursor(); // passou do tempo: devolve sozinho
        sprite('emburrado');
        falar(frase('resgatou'));
        await esperar(t, 1500);
      } finally {
        if (segurando || largado) devolverCursor();
        if (e) e.saindo = true;
      }
    }

    // Variante do roubo: pega sem alarde e leva de fininho pra um canto. Se você mexer o mouse
    // no meio do caminho, ele percebe que foi pego e sai correndo (devolve false).
    async function levarDeFininho(t) {
      await segurandoPor(t, 350, 'fininho'); // ajeita o mouse na mão antes de contar se você mexeu
      percebido = 0;
      const W = larg(), H = alt();
      const destino = sortear([
        { x: 14 * s, y: 24 * s }, { x: W - 14 * s, y: 24 * s }, { x: 14 * s, y: H - 4 * s }, { x: W - 14 * s, y: H - 4 * s },
        pontoAleatorio(),
      ]);
      const flagrado = () => percebido > 40 || escapou;
      await andarAte(t, destino, { velocidade: 14, nome: 'fininho', limite: 25000, chegou: flagrado, cada: prenderCursor });
      if (flagrado()) {
        if (!escapou) {
          falar(frase('percebeu'), 1200);
          await segurandoPor(t, 450, 'assustado');
        }
        return false;
      }
      // deixa o mouse no canto e vai embora de fininho
      if (desktop) devolverCursor();
      else {
        const m = maoPos();
        segurando = false;
        largado = { x: m.x, y: m.y, esconderijo: { rect: () => ({ left: -2, top: -2, right: -1, bottom: -1 }) } };
      }
      sprite('convencido');
      falar(frase('largouCanto'));
      await esperar(t, 1300);
      await andarAte(t, pontoAleatorio(), { velocidade: 14, nome: 'fininho', limite: 5000 });
      if (largado) { // site: espera você ir buscar (o mouse fantasma mostra onde está o seu)
        sprite('espiando');
        await esperar(t, 15000, () => !!largado);
        if (largado) devolverCursor();
      }
      sprite('rindo');
      falar(frase('devolveu'));
      await esperar(t, 1400);
      return true;
    }

    // Vai pra um canto da tela, fica pulando e chamando, e conta uma curiosidade.
    async function anunciar(t) {
      const W = larg(), a = desktop?.area;
      const baixo = (a ? a.bottom : alt()) - 4 * s;
      const canto = sortear([{ x: 16 * s, y: 40 * s }, { x: W - 16 * s, y: 40 * s }, { x: 16 * s, y: baixo }, { x: W - 16 * s, y: baixo }]);
      await andarAte(t, canto, { velocidade: 42, limite: 15000 });
      virado = canto.x > W / 2;
      sprite('chamando');
      falar(frase('chamar'), 1600);
      await esperar(t, 1600);
      falar(sacoDe('curiosidades', o.curiosidades), 5500);
      await esperar(t, 5500);
      sprite(sortear(['convencido', 'feliz', 'estiloso']));
      await esperar(t, 1300);
    }

    // Senta na beirada da barra de tarefas (no site: no pé da tela) e toca um violãozinho.
    async function tocarViolao(t) {
      const a = desktop?.area;
      const beirada = a ? a.bottom : alt();
      const x = aleatorio(30 * s, larg() - 30 * s);
      esconderijo = null; // sentado na barra ele fica na frente, nada de recorte de esconderijo
      await andarAte(t, { x, y: beirada - 2 * s }, { velocidade: 40, limite: 15000 });
      try {
        pos.y = beirada + 3 * s; // no sprite, a beirada fica 3 px acima da linha dos pés
        virado = false;
        esconderijo = null;
        sprite('violao');
        const show = await montarShow();
        for (let i = 0; i < show.length; i++) {
          const { musica, trecho } = show[i];
          const nome = musica.artista ? `${musica.musica} — ${musica.artista}` : musica.musica;
          falar(i === 0 ? `🎸 tocando: ${nome}` : `🎶 emendando com ${nome}...`, 4000);
          await esperar(t, 4500); // introdução no violão antes de começar a cantar
          if (trecho) await cantar(t, trecho);
          else await cantarolar(t, aleatorio(14000, 22000));
          if (i < show.length - 1) {
            falar('🎶', 3000);
            await esperar(t, 3000);
          }
        }
        falar(frase('aplausos'), 2800);
        await esperar(t, 2800);
      } finally {
        if (!arrasto) pos.y = beirada - 2 * s;
      }
    }

    // Canta tipo karaokê: as palavras vão aparecendo uma a uma, no ritmo de sertanejo.
    // Frase comprida é quebrada em pedaços curtos; linha em branco vira um pedaço só no violão.
    function pedacosDaFrase(linha, max = 26) {
      const palavras = linha.split(/\s+/).filter(Boolean);
      const partes = Math.max(1, Math.ceil(linha.length / max));
      const alvo = linha.length / partes; // pedaços de tamanho parecido, sem palavra sobrando sozinha
      const pedacos = [];
      let atual = '';
      for (const palavra of palavras) {
        if (atual && pedacos.length < partes - 1 && (atual + ' ' + palavra).length > alvo + 4) {
          pedacos.push(atual);
          atual = palavra;
        } else atual = atual ? `${atual} ${palavra}` : palavra;
      }
      if (atual) pedacos.push(atual);
      return pedacos;
    }

    async function cantar(t, linhas) {
      for (const linha of linhas) {
        if (!linha) {
          falar('🎶', 3200);
          await esperar(t, 3200);
          continue;
        }
        for (const pedaco of pedacosDaFrase(linha)) {
          const palavras = pedaco.split(' ');
          for (let i = 1; i <= palavras.length; i++) {
            falar(`♪ ${palavras.slice(0, i).join(' ')}`, 5000);
            // palavra comprida demora mais; a última da frase é "esticada"
            const ultima = i === palavras.length;
            await esperar(t, limitar(280 + palavras[i - 1].length * 75, 380, 950) + (ultima ? 500 : 0));
          }
          falar(`♪ ${pedaco} ♪`, 1500);
          await esperar(t, 900);
        }
      }
    }

    async function cantarolar(t, ms) {
      const fim = agora() + ms;
      while (agora() < fim) {
        falar(frase('cantarolar'), 3000);
        await esperar(t, aleatorio(3500, 5000));
      }
    }

    // Monta o show: às vezes a música inteira, às vezes só um trecho, às vezes um medley
    // emendando pedaços de 2 ou 3 músicas.
    async function montarShow() {
      const sorteio = Math.random();
      const rep = await repertorio();
      if (!rep.length) return [{ musica: { musica: 'um sonzinho' }, trecho: null }];
      const proxima = () => {
        const titulo = sacoDe('musicas', rep.map((m) => m.musica.musica));
        return rep.find((m) => m.musica.musica === titulo);
      };
      const estrofes = (letra) => { // separa a letra nos blocos entre linhas em branco
        const blocos = [[]];
        for (const l of letra) {
          if (l) blocos[blocos.length - 1].push(l);
          else if (blocos[blocos.length - 1].length) blocos.push([]);
        }
        return blocos.filter((b) => b.length);
      };
      const pedaco = (letra, quantas) => { // algumas estrofes seguidas, a partir de uma qualquer
        const b = estrofes(letra);
        const ini = Math.floor(Math.random() * Math.max(1, b.length - quantas + 1));
        return b.slice(ini, ini + quantas).flatMap((e, i) => (i ? ['', ...e] : e));
      };
      const metade = (letra) => { // a primeira ou a segunda metade das estrofes
        const b = estrofes(letra);
        const meio = Math.ceil(b.length / 2);
        const parte = b.length > 1 && Math.random() < 0.5 ? b.slice(meio) : b.slice(0, meio);
        return parte.flatMap((e, i) => (i ? ['', ...e] : e));
      };
      if (sorteio < 0.08 && rep.length > 1) { // raro: medley de 2 músicas, uma estrofe de cada
        const a = proxima();
        const b = proxima();
        return [a, b].map((m) => ({ musica: m.musica, trecho: m.letra ? pedaco(m.letra, 1) : null }));
      }
      const m = proxima();
      if (!m.letra) return [{ musica: m.musica, trecho: null }];
      if (sorteio < 0.2) return [{ musica: m.musica, trecho: m.letra.slice(0, 60) }]; // de vez em quando, inteira
      if (sorteio < 0.65) return [{ musica: m.musica, trecho: metade(m.letra) }];      // metade
      return [{ musica: m.musica, trecho: pedaco(m.letra, 1) }];                     // só um trecho
    }

    // Repertório: músicas do config + letras que você colocou na pasta.
    const normalizar = (txt) => String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    async function repertorio() {
      let letras = {};
      try { letras = (desktop?.letras && (await desktop.letras())) || {}; } catch { /* sem letras */ }
      const lista = (o.musicas || []).map((m) => (typeof m === 'string' ? { musica: m } : m));
      const casa = (arq, m) => normalizar(arq).startsWith(normalizar(m.musica));
      for (const arq of Object.keys(letras)) { // músicas que só existem na pasta de letras
        if (!lista.some((m) => casa(arq, m))) lista.push({ musica: arq });
      }
      return lista.map((musica) => {
        const bruta = Array.isArray(musica.letra) ? musica.letra : letras[Object.keys(letras).find((arq) => casa(arq, musica))];
        // tira linhas em branco repetidas
        const letra = bruta && bruta.filter((l, i, a) => l || (i > 0 && a[i - 1]));
        return { musica, letra: letra && letra.some(Boolean) ? letra : null };
      });
    }

    async function dancar(t) {
      sprite('dancando');
      falar(frase('dancar'), 2000);
      await esperar(t, aleatorio(4000, 7000));
    }

    // Easter egg raro: moonwalk (anda pra um lado olhando pro outro).
    async function moonwalk(t) {
      sprite('estiloso');
      falar(frase('moonwalk'), 2000);
      await esperar(t, 900);
      const destinoX = limitar(pos.x + (pos.x > larg() / 2 ? -1 : 1) * aleatorio(150, 320), 10 * s, larg() - 10 * s);
      while (Math.abs(destinoX - pos.x) > 2) {
        const dt = await quadro(t);
        const dir = Math.sign(destinoX - pos.x);
        pos.x += dir * Math.min(Math.abs(destinoX - pos.x), 26 * Math.max(3, s) * dt);
        virado = dir > 0; // olhando pro lado contrário
        sprite('andando');
      }
      sprite('estiloso');
      await esperar(t, 1400);
    }

    // De hora em hora ele avisa (ao meio-dia lembra do almoço); na sexta, comemora uma vez.
    async function avisarHora(t) {
      const h = new Date().getHours();
      sprite('chamando');
      falar(frase(h === 12 ? 'almoco' : 'hora'), 3200);
      await esperar(t, 2400);
      sprite('acenando');
      await esperar(t, 900);
    }

    async function sextou(t) {
      sprite('dancando');
      falar(frase('sextou'), 3000);
      await esperar(t, 5000);
    }

    // ---- easter eggs que dependem do seu mouse
    async function girouTonto(t) {
      sprite('tonto');
      falar(frase('girando'), 2200);
      await esperar(t, 2400);
    }

    async function carinho(t) {
      sprite('apaixonado');
      falar(frase('carinho'), 2000);
      await esperar(t, 2200);
    }

    async function chega(t) {
      sprite('emburrado');
      falar(frase('chega'), 1600);
      await esperar(t, 1400);
      await esconder(t);
    }

    // ---- bilhetes: ele tira um bilhete do bolso onde estiver e leva até o canto de baixo,
    //      onde ficam as notificações do Windows. Ficam empilhados até você fechar no ×.
    const BILHETE_W = 280;
    const pousados = [];

    function cantoDosBilhetes() {
      const a = desktop?.area;
      return { direita: (a ? a.right : larg()) - 16, baixo: (a ? a.bottom : alt()) - 16 };
    }

    function arrumarBilhetes() {
      const c = cantoDosBilhetes();
      let baixo = c.baixo;
      for (const nota of pousados) {
        baixo -= nota.offsetHeight;
        nota.style.transform = `translate(${c.direita - BILHETE_W}px, ${baixo}px)`;
        baixo -= 10;
      }
    }

    function criarBilhete(texto) {
      const nota = criar('div', 'mpet-bilhete mpet-clicavel', raiz);
      const foto = criar('img', null, nota);
      foto.src = urlSprite('feliz');
      foto.alt = '';
      const corpoNota = criar('div', null, nota);
      criar('div', 'mpet-t', corpoNota).textContent = 'Mascote <R/>';
      criar('div', 'mpet-m', corpoNota).textContent = texto;
      const fechar = criar('button', null, nota);
      fechar.textContent = '×';
      fechar.title = 'Fechar';
      nota.fechar = () => {
        const i = pousados.indexOf(nota);
        if (i >= 0) pousados.splice(i, 1);
        nota.classList.add('mpet-sumindo');
        setTimeout(() => { nota.remove(); arrumarBilhetes(); }, 400);
      };
      fechar.addEventListener('click', nota.fechar);
      return nota;
    }

    async function deixarBilhete(t) {
      proximoBilhete = agora() + aleatorio(...o.intervaloBilhete) * 1000;
      sprite('pensando');
      falar(frase('bilhete'), 1800);
      await esperar(t, 900);

      // aparece na mão dele, pequenininho
      const nota = criarBilhete(sacoDe('mensagens', o.mensagens));
      const colar = () => {
        const m = maoPos();
        nota.style.transform = `translate(${Math.round(m.x - BILHETE_W / 2)}px, ${Math.round(m.y - nota.offsetHeight + 4)}px)`;
      };
      colar();
      requestAnimationFrame(() => nota.classList.add('mpet-levando'));
      sprite('feliz');
      try {
        await esperar(t, 500, colar);
        // leva até o canto, parando do lado de onde o bilhete vai ficar
        const destino = () => {
          const c = cantoDosBilhetes();
          return { x: c.direita - BILHETE_W - 8 * s, y: c.baixo };
        };
        await andarAte(t, destino, { velocidade: 40, nome: 'carregando', limite: 25000, cada: colar });
      } catch (err) {
        nota.remove();
        throw err;
      }
      nota.classList.remove('mpet-levando');
      nota.classList.add('mpet-pousado');
      pousados.unshift(nota);
      while (pousados.length > 3) pousados[pousados.length - 1].fechar();
      arrumarBilhetes();
      if (o.bilheteSomeDepois > 0) setTimeout(() => nota.isConnected && nota.fechar(), o.bilheteSomeDepois * 1000);
      virado = true;
      sprite('acenando');
      falar(frase('bilheteEntregue'));
      await esperar(t, 1600);
      await andarAte(t, pontoAleatorio(), { limite: 8000 });
    }

    // Quando o usuário pega o mascote com o mouse (ou só clica nele).
    const cliques = [];
    async function serCarregado(t) {
      let viradas = 0;
      let ultimoX = cursor.x;
      let sentido = 0;
      while (arrasto) {
        if (arrasto.moveu) sprite('assustado');
        const dx = cursor.x - ultimoX; // conta as vezes que você muda de direção sacudindo ele
        if (Math.abs(dx) > 3) {
          if (sentido && Math.sign(dx) !== sentido) viradas += 1;
          sentido = Math.sign(dx);
        }
        ultimoX = cursor.x;
        pos.x = cursor.x - arrasto.dx;
        pos.y = cursor.y - arrasto.dy;
        await quadro(t);
      }
      if (ultimoClique.moveu) {
        sprite('tonto');
        falar(frase(viradas >= 6 ? 'sacudido' : 'arrastado'));
        return esperar(t, viradas >= 6 ? 2600 : 1900);
      }
      cliques.push(agora());
      while (cliques.length && agora() - cliques[0] > 6000) cliques.shift();
      if (cliques.length >= 8) { // clicou demais: fica bravo e vai se esconder
        cliques.length = 0;
        return chega(t);
      }
      if (cliques.filter((c) => agora() - c < 2500).length >= 3) {
        sprite('rindo');
        falar(frase('cocegas'));
      } else if (Math.random() < 0.3) {
        sprite('apaixonado');
        falar(frase('apaixonado'));
      } else {
        sprite(sortear(['feliz', 'acenando', 'convencido']));
        falar(frase('clique'));
      }
      await esperar(t, 1500);
    }
    const ultimoClique = { moveu: false };

    const TRAVESSURAS = {
      roubar: roubarMouse, esconder, bilhete: deixarBilhete, dormir, programar, passear,
      curiosidade: anunciar, violao: tocarViolao, dancar, moonwalk,
    };
    let ultimaHora = new Date().getHours();
    let comemorouSexta = false;

    function escolher() {
      const t = agora();
      if (t - cursor.mexeu > o.sonoDepoisDe * 1000) return dormir;
      const d = new Date();
      if (d.getHours() !== ultimaHora && d.getMinutes() < 5) {
        ultimaHora = d.getHours();
        return avisarHora;
      }
      if (d.getDay() === 5 && !comemorouSexta) {
        comemorouSexta = true;
        return sextou;
      }
      const tr = o.travessuras;
      const livre = !pausado && t >= sossegoAte; // travessura grande só depois do sossego
      const opcoes = [
        [passear, 30], [ficar, 22], [programar, 10], [curioso, 6], [dancar, 2], [moonwalk, 0.5],
        [esconder, livre && tr.esconder && t >= proxima.esconder ? 8 : 0],
        [anunciar, livre && tr.curiosidades !== false && t >= proxima.anunciar ? 6 : 0],
        [tocarViolao, livre && tr.violao !== false && t >= proxima.violao ? 7 : 0],
        [roubarMouse, livre && tr.roubarMouse && podeRoubar && cursor.dentro && t >= proximoRoubo && t - cursor.mexeu < 15000 ? 12 : 0],
        [deixarBilhete, livre && tr.bilhetes && t >= proximoBilhete ? 6 : 0],
      ];
      let soma = opcoes.reduce((a, [, p]) => a + p, 0) * Math.random();
      for (const [fn, p] of opcoes) if ((soma -= p) < 0) return fn;
      return passear;
    }

    // Easter eggs do mouse: rodar o mouse em volta dele deixa ele tonto; deixar o mouse
    // parado em cima dele é carinho. Checado a cada quadro.
    const giro = { angulo: null, total: 0 };
    let carinhoDesde = 0;
    let ultimoCarinho = 0;
    function easterEggsDoMouse() {
      if (arrasto || segurando || largado || reacao) return;
      const c = cabeca();
      const d = distancia(cursor, c);
      if (d > 12 * s && d < 70 * s / 2 + 60) {
        const a = Math.atan2(cursor.y - c.y, cursor.x - c.x);
        if (giro.angulo !== null) {
          let delta = a - giro.angulo;
          if (delta > Math.PI) delta -= 2 * Math.PI;
          if (delta < -Math.PI) delta += 2 * Math.PI;
          giro.total += delta;
        }
        giro.angulo = a;
        if (Math.abs(giro.total) > 4 * Math.PI) { // duas voltas completas
          giro.total = 0;
          reagir(girouTonto);
        }
      } else {
        giro.angulo = null;
        giro.total *= 0.9;
      }
      const r = toque.getBoundingClientRect();
      const emCima = cursor.x >= r.left && cursor.x <= r.right && cursor.y >= r.top && cursor.y <= r.bottom;
      if (!emCima || agora() - cursor.mexeu > 4000) carinhoDesde = 0;
      else if (!carinhoDesde) carinhoDesde = agora();
      else if (agora() - carinhoDesde > 2500 && agora() - ultimoCarinho > 30000) {
        ultimoCarinho = agora();
        carinhoDesde = 0;
        reagir(carinho);
      }
    }

    // Depois de uma travessura grande: sossego geral e um intervalo maior até repetir a mesma.
    function descansarDepois(acao) {
      const grandes = new Map([
        [roubarMouse, null], [deixarBilhete, null], [tocarViolao, 'violao'], [anunciar, 'anunciar'], [esconder, 'esconder'], [chega, 'esconder'],
      ]);
      if (!grandes.has(acao)) return;
      sossegoAte = agora() + aleatorio(...o.descanso) * 1000;
      const intervalos = { violao: [240, 480], anunciar: [180, 360], esconder: [90, 200] };
      const chave = grandes.get(acao);
      if (chave) proxima[chave] = agora() + aleatorio(...intervalos[chave]) * 1000;
      if (acao === roubarMouse) proximoRoubo = Math.max(proximoRoubo, agora() + aleatorio(...o.intervaloRoubo) * 1000);
    }

    async function cerebro() {
      for (;;) {
        const t = (tarefa = { viva: true });
        const acao = reacao || escolher();
        reacao = null;
        try {
          await acao(t);
        } catch (err) {
          if (!(err instanceof Cancelado)) console.error('[mascote]', err);
        } finally {
          descansarDepois(acao);
        }
        try { await quadro({ viva: true }); } catch { /* nunca */ }
      }
    }

    // ---- arrastar (mascote e bilhetes)
    toque.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      cursor.x = ev.clientX; cursor.y = ev.clientY;
      if (segurando) escapou = true; // clicou nele enquanto era roubado: ele solta
      toque.setPointerCapture(ev.pointerId);
      arrasto = { dx: ev.clientX - pos.x, dy: ev.clientY - pos.y, x: ev.clientX, y: ev.clientY, moveu: false };
      if (esconderijo) esconderijo = null;
      if (!segurando) reagir(serCarregado);
    });
    toque.addEventListener('pointermove', (ev) => {
      if (arrasto && Math.hypot(ev.clientX - arrasto.x, ev.clientY - arrasto.y) > 5) arrasto.moveu = true;
    });
    const soltar = () => {
      if (!arrasto) return;
      ultimoClique.moveu = arrasto.moveu;
      arrasto = null;
    };
    toque.addEventListener('pointerup', soltar);
    toque.addEventListener('pointercancel', soltar);


    // ---- entrada do mouse
    function moveuCursor(x, y) {
      if (desktop && segurando && ultimoEnviado) {
        const d = Math.hypot(x - ultimoEnviado.x, y - ultimoEnviado.y);
        if (d > 10) percebido += d;
        if (d > 25) esforco += d;
        if (esforco > 900) escapou = true;
      }
      if (Math.hypot(x - cursor.x, y - cursor.y) > 1) cursor.mexeu = agora();
      cursor.x = x; cursor.y = y; cursor.dentro = true;
    }

    const ouvintes = [];
    const ouvir = (alvo, ev, fn, op) => { alvo.addEventListener(ev, fn, op); ouvintes.push([alvo, ev, fn, op]); };

    let desligarDesktop = null;
    if (desktop) {
      desligarDesktop = desktop.aoMoverCursor(moveuCursor);
    } else {
      ouvir(window, 'pointermove', (ev) => {
        if (segurando) {
          percebido += Math.abs(ev.movementX || 0) + Math.abs(ev.movementY || 0);
          esforco += Math.abs(ev.movementX || 0) + Math.abs(ev.movementY || 0);
          if (esforco > 3000) escapou = true;
        }
        moveuCursor(ev.clientX, ev.clientY);
      }, { passive: true });
      ouvir(document, 'mouseout', (ev) => { if (!ev.relatedTarget) cursor.dentro = false; });
      ouvir(window, 'blur', () => { cursor.dentro = false; });
      // Enquanto o mouse está roubado, nenhum clique chega no site (menos no próprio mascote).
      const bloquear = (ev) => {
        if (!cursorPreso() || (ev.target.closest && ev.target.closest('.mpet-toque'))) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
      };
      for (const ev of ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'auxclick', 'contextmenu']) {
        ouvir(window, ev, bloquear, true);
      }
      ouvir(window, 'keydown', (ev) => {
        if (ev.key === 'Escape' && cursorPreso()) {
          escapou = true;
          if (largado) devolverCursor();
        }
      }, true);
    }

    // ---- laço de desenho
    let anterior = agora();
    let rodando = true;
    function desenhar(tempo) {
      if (!rodando) return;
      const dt = Math.min(0.05, (tempo - anterior) / 1000);
      anterior = tempo;
      const fila = esperando;
      esperando = [];
      for (const f of fila) f(dt);
      easterEggsDoMouse();

      if (!arrasto) {
        pos.x = limitar(pos.x, -12 * s, larg() + 12 * s);
        pos.y = limitar(pos.y, 4 * s, alt() + 12 * s);
      }
      corpo.style.transform = `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0)`;
      img.style.transform = virado ? 'scaleX(-1)' : '';
      if (fala.classList.contains('mpet-on')) { // balão sempre dentro da tela
        const meio = fala.offsetWidth / 2 + 4;
        fala.style.left = Math.round(limitar(pos.x, meio, Math.max(meio, larg() - meio)) - pos.x) + 'px';
        fala.style.top = Math.round(Math.max(pos.y - 18 * s, fala.offsetHeight + 4) - pos.y) + 'px';
      }

      // atrás do esconderijo: some a parte que encosta nele
      const r = esconderijo && esconderijo.rect();
      const clip = r ? recorteSem(r, pos.x - CAIXA.esq, pos.y - CAIXA.topo, CAIXA.w, CAIXA.h) : '';
      if (esconderijo && (!r || (esconderijo.saindo && !clip))) esconderijo = null;
      recorte.style.clipPath = clip;

      // mouse na mão
      cursorFalso.style.display = segurando && !desktop ? 'block' : 'none';
      if (segurando && !desktop) {
        const m = maoPos();
        cursorFalso.style.transform = `translate(${Math.round(m.x - pos.x + CAIXA.esq - 2)}px, ${Math.round(m.y - pos.y + CAIXA.topo - 2)}px)`;
      }

      // mouse largado atrás de alguma coisa + "fantasma" mostrando onde está o seu mouse de verdade
      largadoEl.style.display = fantasma.style.display = largado ? 'block' : 'none';
      if (largado) {
        largadoEl.style.transform = `translate(${largado.x}px, ${largado.y}px)`;
        const rl = largado.esconderijo.rect();
        largadoEl.style.clipPath = rl ? recorteSem(rl, largado.x, largado.y, 13, 19) : '';
        fantasma.style.transform = `translate(${cursor.x}px, ${cursor.y}px)`;
        if (distancia(cursor, largado) < 16) devolverCursor();
      }

      // desktop: a janela deixa o clique passar, menos em cima do mascote/bilhetes
      if (desktop) {
        const el = document.elementFromPoint(cursor.x, cursor.y);
        const quer = !!arrasto || !!(el && el.closest('.mpet-clicavel'));
        if (quer !== clicavel) desktop.clicavel((clicavel = quer));
      }
      requestAnimationFrame(desenhar);
    }

    sprite('parado');
    if (o.saudar !== false) reacao = saudar;
    requestAnimationFrame(desenhar);
    cerebro();

    return {
      travessura(nome) {
        const fn = TRAVESSURAS[nome];
        if (!fn) throw new Error(`Travessura desconhecida: ${nome} (use ${Object.keys(TRAVESSURAS).join(', ')})`);
        if (nome === 'bilhete') proximoBilhete = 0;
        reagir(fn);
      },
      falar: (texto, ms) => falar(String(texto), ms),
      pausar(sim = true) { pausado = sim; if (sim && (segurando || largado)) { escapou = true; devolverCursor(); } },
      get pausado() { return pausado; },
      parar() {
        rodando = false;
        tarefa.viva = false;
        devolverCursor();
        for (const [a, ev, fn, op] of ouvintes) a.removeEventListener(ev, fn, op);
        if (typeof desligarDesktop === 'function') desligarDesktop();
        raiz.remove();
        estilo.remove();
        window.MascotePet.atual = null;
      },
    };
  }

  window.MascotePet = {
    iniciar(opcoes) {
      if (window.MascotePet.atual) window.MascotePet.atual.parar();
      return (window.MascotePet.atual = iniciar(opcoes));
    },
    atual: null,
  };

  // Liga sozinho quando incluído com <script src="mascote-pet.js">.
  const tag = document.currentScript;
  if (tag && tag.src && tag.dataset.auto !== 'false') {
    const opcoes = {
      sprites: tag.dataset.sprites || new URL('sprites/', tag.src).href,
      ...(tag.dataset.tamanho ? { tamanho: Number(tag.dataset.tamanho) } : {}),
    };
    const ligar = () => window.MascotePet.iniciar(opcoes);
    if (document.body) ligar();
    else document.addEventListener('DOMContentLoaded', ligar);
  }
})();
