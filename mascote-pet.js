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
  };
  const PES_Y = 24;              // linha da grade onde ficam os pés
  const MAO = { x: 11, y: -11 }; // ponta da mão direita no sprite "carregando", relativa aos pés

  const FALAS = {
    oi: ['oi! eu sou o <R/> 👋', 'cheguei! 👋'],
    tramar: ['hehe... 😈', 'que mouse bonito...', '*plano maligno*', 'hmmm 😏'],
    roubar: ['vem cá, mouse!', 'é agora!', 'hehehe'],
    pegou: ['HEHEHE roubei seu mouse!', 'HAHAHA é meu agora!', 'hihihi peguei!', 'roubadooo 😈'],
    correndo: ['hehehe', 'hihihi', 'ninguém me pega!', 'HAHAHA', 'tchau mouse 👋'],
    dica: ['(sacode o mouse pra se soltar)'],
    soltou: ['hmpf! 😤', 'não valeu!', 'eu só tava pegando emprestado...', 'aff 😒'],
    achou: ['achou! 😱', 'AAAH', 'como me achou?!'],
    escondido: ['procura aí 😜', 'cadê? cadê? 🤭', 'tá quente... tá frio...'],
    escondidoComMouse: ['shhh, ninguém vai achar a gente 🤫', 'esconderijo secreto 🤭'],
    devolveu: ['HAHAHA 🤣', 'toma, pode ficar 😜', 'hehehe foi mal'],
    resgatou: ['hmpf, achou 😤', 'tava fácil né', 'da próxima eu escondo melhor'],
    clique: ['oi!', 'hehe', '</>', 'para 😳', 'tô trabalhando!'],
    cocegas: ['para! tenho cócegas 🤣', 'HAHAHA para!', 'hihihi'],
    arrastado: ['me põe no chão!', 'eu ando sozinho, tá?', 'tô tonto 😵'],
    acordou: ['opa! oi 👋', 'eu não tava dormindo'],
    programar: ['git push --force 😈', 'funciona na minha máquina', 'só mais um commit', 'deploy na sexta?'],
    pensar: ['hmm...', '🤔', 'e se...'],
    desistir: ['ah, deixa...', 'rápido demais 😤'],
  };

  const PADRAO = {
    sprites: null,                // pasta (string) ou { nome: url }
    tamanho: 64,                  // px (múltiplo de 32 fica mais nítido: 64, 96, 128)
    falas: true,
    travessuras: { roubarMouse: true, esconder: true, bilhetes: true },
    intervaloRoubo: [25, 70],     // segundos entre um roubo de mouse e outro
    intervaloBilhete: [60, 180],  // segundos entre bilhetes
    sonoDepoisDe: 45,             // segundos sem mexer o mouse até ele dormir
    mensagens: [
      'Bebe água! 💧', 'Já fez commit hoje?', 'O bug tá na linha 42.', '</> rafinhadr passou por aqui',
      'Vai dormir, já tá tarde 😴', 'Sorria, você tá sendo observado 👀', 'Ctrl+S salva vidas.',
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
  border-radius:6px;padding:3px 8px;white-space:nowrap;opacity:0;transition:opacity .15s}
.mpet-fala.mpet-on{opacity:1}
.mpet-bilhete{position:absolute;left:0;top:0;width:190px;background:#161b22;color:#e6edf3;border:2px solid #58a6ff;border-radius:8px;
  padding:8px 10px 10px;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:auto;cursor:move;touch-action:none;user-select:none}
.mpet-bilhete b{display:flex;justify-content:space-between;color:#58a6ff;font-weight:700;margin-bottom:4px}
.mpet-bilhete button{all:unset;cursor:pointer;color:#8b949e;padding:0 2px}
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
    let ultimoEnviado = null;
    let arrasto = null;      // { dx, dy, inicio, moveu }
    let pausado = false;
    let clicavel = null;
    let timerFala = 0;
    let proximoRoubo = agora() + aleatorio(15, 30) * 1000;
    let proximoBilhete = agora() + aleatorio(20, 60) * 1000;
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
      falar(FALAS.oi, 3000);
      await esperar(t, 2500);
    }

    async function passear(t) {
      await andarAte(t, pontoAleatorio(), { limite: 12000 });
      sprite('parado');
      await esperar(t, aleatorio(800, 2500));
    }

    async function ficar(t) {
      const r = Math.random();
      sprite(r < 0.3 ? 'pensando' : r < 0.42 ? 'tramando' : r < 0.54 ? 'espiando' : 'parado');
      if (spriteAtual === 'pensando' && Math.random() < 0.5) falar(FALAS.pensar);
      if (spriteAtual === 'tramando') falar(FALAS.tramar);
      await esperar(t, aleatorio(2000, 5000));
    }

    async function programar(t) {
      sprite(Math.random() < 0.5 ? 'programando' : 'digitando');
      if (Math.random() < 0.5) falar(FALAS.programar, 3000);
      await esperar(t, aleatorio(6000, 12000));
    }

    async function curioso(t) {
      if (!cursor.dentro) return passear(t);
      await andarAte(t, () => ({ x: cursor.x + (cursor.x > pos.x ? -60 : 60), y: cursor.y + 40 }), { limite: 5000 });
      virado = cursor.x < pos.x;
      sprite(Math.random() < 0.5 ? 'tramando' : 'parado');
      if (Math.random() < 0.5) falar(spriteAtual === 'tramando' ? FALAS.tramar : '👀', 1600);
      await esperar(t, aleatorio(1500, 3500));
    }

    async function dormir(t) {
      sprite('bocejando');
      falar('*bocejo*', 1500);
      if (await esperar(t, 1500, () => agora() - cursor.mexeu > 300)) {
        sprite('dormindo');
        falar('zzz', 2000);
        await esperar(t, 1e9, () => agora() - cursor.mexeu > 300);
      }
      sprite('assustado');
      await esperar(t, 500);
      sprite('acenando');
      falar(FALAS.acordou);
      await esperar(t, 1500);
    }

    async function esconder(t) {
      const e = await escolherEsconderijo();
      esconderijo = e;
      try {
        await andarAte(t, () => pontoDeEspiar(e) || pos, { velocidade: 40, limite: 15000 });
        sprite('espiando');
        if (Math.random() < 0.3) falar('shhh 🤫', 1500);
        const ok = await esperar(t, aleatorio(5000, 11000), () => {
          if (!e.rect()) return false;
          const p = pontoDeEspiar(e);
          pos.x = p.x; pos.y = p.y;   // acompanha se a página rolar
          return !(cursor.dentro && distancia(cursor, cabeca()) < 22 * s);
        });
        if (!ok && e.rect()) {
          sprite('assustado');
          falar(FALAS.achou);
          await esperar(t, 700);
          e.saindo = true;
          await andarAte(t, pontoAleatorio(), { velocidade: 60, limite: 6000 });
        }
      } finally {
        e.saindo = true;
      }
    }

    async function roubarMouse(t) {
      if (!podeRoubar || !cursor.dentro) {
        falar('cadê o mouse? 🤔');
        return esperar(t, 1500);
      }
      // 1. trama
      virado = cursor.x < pos.x;
      sprite('tramando');
      falar(FALAS.tramar, 1500);
      await esperar(t, 1400);
      // 2. corre atrás do mouse
      falar(FALAS.roubar, 1800);
      const alvo = () => {
        const lado = cursor.x >= pos.x ? 1 : -1;
        return { x: cursor.x - lado * MAO.x * s, y: cursor.y - MAO.y * s };
      };
      const pegou = await andarAte(t, alvo, {
        velocidade: 60, chegou: () => distancia(cursor, maoPos()) < 7 * s, limite: 9000,
      });
      if (!pegou) {
        sprite('emburrado');
        falar(FALAS.desistir);
        return esperar(t, 1500);
      }

      // 3. pegou! gargalha e sai correndo em zigue-zague, parando pra rir
      pegarCursor();
      proximoRoubo = agora() + aleatorio(...o.intervaloRoubo) * 1000;
      const querEsconder = o.travessuras.esconder && Math.random() < 0.7;
      const pedido = querEsconder ? escolherEsconderijo() : null; // já vai perguntando onde se esconder
      let e = null;
      try {
        falar(desktop ? FALAS.pegou : [sortear(FALAS.pegou) + ' ' + FALAS.dica[0]], 2600);
        await segurandoPor(t, 1100, 'rindo');
        const voltas = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < voltas && !escapou; i++) {
          await andarAte(t, pontoAleatorio(), {
            velocidade: 52, nome: 'carregando', limite: 6000, chegou: () => escapou, cada: prenderCursor,
          });
          if (!escapou && Math.random() < 0.6) {
            falar(FALAS.correndo, 1300);
            await segurandoPor(t, 650, 'rindo');
          }
        }
        // 4. leva o mouse pro esconderijo
        if (pedido && !escapou) {
          esconderijo = e = await pedido;
          await andarAte(t, () => pontoDeEspiar(e) || pos, {
            velocidade: 48, nome: 'carregando', limite: 15000, chegou: () => escapou, cada: prenderCursor,
          });
        }
        if (escapou) {
          devolverCursor();
          sprite('emburrado');
          falar(FALAS.soltou);
          return await esperar(t, 1800);
        }

        if (desktop || !e) {
          if (e) { // desktop: fica escondido segurando o seu mouse mais um pouco
            falar(FALAS.escondidoComMouse, 2500);
            if (!(await segurandoPor(t, 2600, 'espiando'))) {
              devolverCursor();
              sprite('emburrado');
              falar(FALAS.soltou);
              return await esperar(t, 1800);
            }
          }
          devolverCursor();
          sprite('rindo');
          falar(FALAS.devolveu);
          await esperar(t, 1500);
          sprite('convencido');
          return await esperar(t, 1300);
        }

        // Site: larga o mouse atrás do esconderijo e espera você achar.
        const p = pontoDeLargar(e);
        segurando = false;
        largado = { x: p.x, y: p.y, esconderijo: e };
        sprite('convencido');
        falar(FALAS.escondido);
        await esperar(t, 15000, () => {
          if (!largado) return false;
          const q = pontoDeEspiar(e);
          if (q) { pos.x = q.x; pos.y = q.y; }
          if (spriteAtual === 'convencido' && Math.random() < 0.004) sprite('espiando');
        });
        if (largado) devolverCursor(); // passou do tempo: devolve sozinho
        sprite('emburrado');
        falar(FALAS.resgatou);
        await esperar(t, 1500);
      } finally {
        if (segurando || largado) devolverCursor();
        if (e) e.saindo = true;
      }
    }

    async function deixarBilhete(t) {
      proximoBilhete = agora() + aleatorio(...o.intervaloBilhete) * 1000;
      const nota = criar('div', 'mpet-bilhete mpet-clicavel', raiz);
      const topo = criar('b', null, nota);
      topo.textContent = '</> bilhete';
      const fechar = criar('button', null, topo);
      fechar.textContent = '×';
      fechar.title = 'Jogar fora';
      fechar.addEventListener('click', () => nota.remove());
      criar('div', null, nota).textContent = sortear(o.mensagens);
      arrastavel(nota);
      const colar = () => {
        const m = maoPos();
        nota.style.transform = `translate(${Math.round(m.x - 95)}px, ${Math.round(m.y - nota.offsetHeight + 6)}px)`;
      };
      colar();
      const notas = raiz.querySelectorAll('.mpet-bilhete');
      if (notas.length > 3) notas[0].remove();
      try {
        await andarAte(t, { x: aleatorio(110, larg() - 110), y: aleatorio(nota.offsetHeight + 20 * s, alt() - 4 * s) },
          { velocidade: 30, nome: 'carregando', limite: 10000, cada: colar });
      } catch (err) {
        nota.remove();
        throw err;
      }
      sprite('acenando');
      falar('pra você 📝');
      await esperar(t, 1600);
      await andarAte(t, pontoAleatorio(), { limite: 8000 });
    }

    // Quando o usuário pega o mascote com o mouse (ou só clica nele).
    const cliques = [];
    async function serCarregado(t) {
      while (arrasto) {
        if (arrasto.moveu) sprite('assustado');
        pos.x = cursor.x - arrasto.dx;
        pos.y = cursor.y - arrasto.dy;
        await quadro(t);
      }
      if (ultimoClique.moveu) {
        sprite('emburrado');
        falar(FALAS.arrastado);
        return esperar(t, 1600);
      }
      cliques.push(agora());
      while (cliques.length && agora() - cliques[0] > 2500) cliques.shift();
      if (cliques.length >= 3) {
        sprite('rindo');
        falar(FALAS.cocegas);
      } else {
        sprite(sortear(['feliz', 'acenando', 'convencido']));
        falar(FALAS.clique);
      }
      await esperar(t, 1400);
    }
    const ultimoClique = { moveu: false };

    const TRAVESSURAS = { roubar: roubarMouse, esconder, bilhete: deixarBilhete, dormir, programar, passear };

    function escolher() {
      const t = agora();
      if (t - cursor.mexeu > o.sonoDepoisDe * 1000) return dormir;
      const tr = o.travessuras;
      const opcoes = [
        [passear, 30], [ficar, 18], [programar, 9], [curioso, 9],
        [esconder, !pausado && tr.esconder ? 12 : 0],
        [roubarMouse, !pausado && tr.roubarMouse && podeRoubar && cursor.dentro && t >= proximoRoubo && t - cursor.mexeu < 15000 ? 25 : 0],
        [deixarBilhete, !pausado && tr.bilhetes && t >= proximoBilhete ? 10 : 0],
      ];
      let soma = opcoes.reduce((a, [, p]) => a + p, 0) * Math.random();
      for (const [fn, p] of opcoes) if ((soma -= p) < 0) return fn;
      return passear;
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

    function arrastavel(el) {
      let pega = null;
      el.addEventListener('pointerdown', (ev) => {
        if (ev.target.closest('button')) return;
        const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(el.style.transform) || [0, 0, 0];
        pega = { dx: ev.clientX - m[1], dy: ev.clientY - m[2] };
        el.setPointerCapture(ev.pointerId);
      });
      el.addEventListener('pointermove', (ev) => {
        if (pega) el.style.transform = `translate(${ev.clientX - pega.dx}px, ${ev.clientY - pega.dy}px)`;
      });
      el.addEventListener('pointerup', () => { pega = null; });
    }

    // ---- entrada do mouse
    function moveuCursor(x, y) {
      if (desktop && segurando && ultimoEnviado) {
        const d = Math.hypot(x - ultimoEnviado.x, y - ultimoEnviado.y);
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
