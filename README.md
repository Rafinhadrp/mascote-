# 🐾 Mascote `<R/>` — pet de tela

O mascote da logo **&lt;rafinhadr/&gt;** morando no seu computador, no estilo do *Desktop Goose*.

## ⬇️ Como usar

1. Baixe o **`MascoteR.exe`** em **[Releases](https://github.com/Rafinhadrp/mascote-/releases/latest)**.
2. Dê dois cliques. Não precisa instalar nada.
   - Se aparecer "O Windows protegeu o computador": **Mais informações → Executar assim mesmo**
     (é porque o app não tem assinatura digital paga).
3. Pronto, ele está solto na sua tela. **Clique no iconezinho dele perto do relógio** pra:
   mandar ele roubar o mouse / se esconder / deixar bilhete, **mudar o tamanho** (pequeno, médio, grande),
   pausar as travessuras, **iniciar junto com o Windows** ou sair.

O `.exe` é gerado sozinho pelo GitHub (aba **Actions**) a cada mudança neste repositório.

## O que ele apronta

- **Rouba o seu mouse:** fica tramando (sobrancelha brava, esfregando as mãos), corre atrás do cursor, pega,
  gargalha *"HEHEHE roubei seu mouse!"* e sai correndo em zigue-zague arrastando o mouse de verdade,
  parando pra rir no caminho.
- **Se esconde com o mouse** atrás dos **botões do programa que você está usando**, dos **ícones da barra de
  tarefas**, das **janelas abertas** ou nas bordas da tela, só com a cabeça pra fora. Depois devolve rindo
  e dá uma piscadinha de língua de fora.
- **Pra se soltar:** sacode o mouse com força. Ele fica emburrado de braços cruzados (*"hmpf! 😤"*).
- Se esconde sozinho também, espiando pros lados. Chegou perto com o mouse? Leva um susto e foge.
- Passeia, programa no notebook, deixa bilhetes na tela, boceja e dorme quando você some.
- Clica nele: ele acena. Clica várias vezes: ele morre de rir (*"para! tenho cócegas"*). Dá pra pegar e arrastar.

| Cara | Quando |
|---|---|
| ![](sprites/tramando-128.gif) tramando | antes de roubar |
| ![](sprites/rindo-128.gif) rindo | quando pega o mouse / cócegas |
| ![](sprites/carregando-128.gif) carregando | fugindo com o mouse |
| ![](sprites/espiando-128.gif) espiando | escondido |
| ![](sprites/convencido-128.gif) convencido | depois que devolve / esconde o mouse |
| ![](sprites/emburrado-128.gif) emburrado | quando você escapa |
| ![](sprites/assustado-128.gif) assustado | quando é achado / arrastado |
| ![](sprites/bocejando-128.gif) bocejando | antes de dormir |

> **Funciona melhor no Windows.** No macOS ele roda, mas não rouba o mouse nem acha os botões dos outros
> apps. No Linux rouba o mouse se tiver o `xdotool`.

## ⚙️ Configurando

O que dá pra mudar pelo menu do ícone fica salvo sozinho. O resto está no **`config.json`** (precisa gerar o
`.exe` de novo depois de mudar):

| Opção | O que faz |
|---|---|
| `tamanho` | 64, 96 ou 128 px |
| `travessuras` | liga/desliga `roubarMouse`, `esconder`, `bilhetes` |
| `botoesDeOutrosApps` | `false` = não procura botões dos outros programas (só janelas e bordas) |
| `intervaloRoubo` | segundos entre um roubo e outro, ex.: `[25, 70]` |
| `sonoDepoisDe` | segundos sem mexer o mouse até ele dormir |
| `mensagens` | textos dos bilhetes |

Se algo der errado, tem um log em `%APPDATA%\mascote-pet\mascote-log.txt`.

## 🛠️ Rodando pelo código

Com o [Node.js LTS](https://nodejs.org) instalado: dois cliques no **`iniciar.bat`** (ou `npm install` e
`npm start`). Pra gerar o `.exe` na sua máquina: `npm run empacotar` (sai em `dist/MascoteR.exe`).

## 🌐 Também funciona em sites

O mesmo `mascote-pet.js` roda em qualquer página: copie ele e a pasta `sprites/` pro site e coloque antes do `</body>`:

```html
<script src="/mascote/mascote-pet.js" defer></script>
```

No site ele se esconde atrás dos botões e cards da página e esconde o mouse pra você ir buscar. O
`demo.html` mostra como fica. Opções: as mesmas do `config.json`, passadas em `MascotePet.iniciar({...})`.

## Arquivos

| Arquivo | O que é |
|---|---|
| `mascote-pet.js` | O mascote em si (comportamentos, animação, roubo de mouse) |
| `main.js` | App de desktop (Electron): janela transparente por cima de tudo, menu do ícone, e o PowerShell que move o mouse e acha os botões/janelas do Windows |
| `preload.js`, `desktop.html`, `desktop.js` | Ligam o mascote dentro da janela do app |
| `sprites/` | GIFs das caras e poses + ícone |
| `config.json` | Configuração padrão |
| `demo.html` | Teste da versão de site |
| `desenho/` | O mascote em pixel-art (GIF, SVG, PNG) e o script que gera tudo |
| `.github/workflows/windows.yml` | Gera o `MascoteR.exe` e publica em Releases |

## 🎨 O desenho

O mascote é pixel-art desenhado pixel por pixel em Python. Tudo fica em **`desenho/`**: GIFs, SVGs e PNGs de
todas as caras (bons pra emoji do Discord, avatar, site) e o `gerar_mascote.py` que gera tudo.

**Mudou o desenho?** Edite `desenho/gerar_mascote.py`, rode `pip install pillow` e
`python3 desenho/gerar_mascote.py`, e copie os `desenho/gif/*-128.gif` pra `sprites/`.
