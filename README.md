# flowdesign

Laboratório pessoal de **motion design para web**: uma skill de agente de IA que faz engenharia reversa de vídeos
de referência (scroll, parallax, 3D, WebGL, hover, transições) e aplica as técnicas em projetos reais adaptados ao nicho,
sem cara de template, além de uma biblioteca de referências que cresce com o tempo.

```
flowdesign/
├── skills/flowdesign/          ← a skill (instruções + scripts + base de conhecimento)
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── analyze_video.py    vídeo → folhas de contato, timeline, heatmap, eventos, easing, camadas, paleta
│   │   ├── frames.py           "lupa": frames exatos e tiras de um trecho
│   │   ├── library.py          ingest / analyze / tag / index / find
│   │   ├── record_page.mjs     grava o site que você construiu p/ comparar com a referência
│   │   ├── capture_site.mjs    baixa um site inteiro e monta a pasta que roda localmente
│   │   ├── site_design.mjs     mede um site por dentro: tokens, tipografia, componentes, animações, bibliotecas
│   │   ├── extract_design.py   mede cores, tipografia, layout e telas paradas de uma referência
│   │   ├── ds_build.py         tokens.json → tokens.css, tema Tailwind, motion.ts, preview.html
│   │   └── site_tokens.js      valores computados de uma página (usado pelo site_design.mjs)
│   ├── assets/site-player/     servidor local + Service Worker copiados para cada captura
│   └── references/             toolkit, vocabulário, guia de decodificação, adaptação, anti-cara-de-IA, receitas…
├── library/
│   ├── _inbox/<categoria>/     ← jogue vídeos aqui
│   ├── refs/<id>/              source.mp4 · meta.json · analysis/ · breakdown.md · design/ · design-system/
│   └── INDEX.md                índice gerado
├── captures/<site>/            sites capturados (fora do git)
├── design-systems/<marca>-design-system/   design system + branding de um site (DESIGN.md, tokens, preview)
├── .claude-plugin/             manifesto para instalar a skill como plugin do Claude Code
└── CLAUDE.md                   contexto do projeto para o agente
```

## Instalação

```bash
# dependências da análise (Fedora)
sudo dnf install ffmpeg            # RPM Fusion
pip install -r skills/flowdesign/scripts/requirements.txt

# ativar a skill neste repositório (Claude Code lê .claude/skills/)
mkdir -p .claude/skills && ln -s ../../skills/flowdesign .claude/skills/flowdesign

# ou em todos os seus projetos
ln -s "$PWD/skills/flowdesign" ~/.claude/skills/flowdesign
```

Depois de publicar no GitHub, dá para instalar como plugin em qualquer máquina:
`/plugin marketplace add <seu-usuario>/flowdesign` e `/plugin install flowdesign@flowdesign`.

## Fluxo do dia a dia

```bash
# 1. salvar referências
cp ~/Downloads/*.mp4 library/_inbox/scroll/      # a subpasta vira a categoria

# 2. ingerir + analisar
python3 skills/flowdesign/scripts/library.py ingest --analyze

# 3. pedir ao agente
"decodifica a referência scroll-1a2b3c4d"
"usa as referências de parallax da biblioteca para a landing de um ateliê de beleza"
"constrói a seção de serviços com aquele efeito de cortina do web-animation-8281bd42"
"me explica como funciona o ScrollTrigger com pin, com um exemplo mínimo"
```

Outros comandos:

```bash
python3 skills/flowdesign/scripts/library.py find parallax pin          # busca em metas e breakdowns
python3 skills/flowdesign/scripts/library.py add-url https://site.com --category web --title "..." --tags a,b
python3 skills/flowdesign/scripts/analyze_video.py VIDEO --out PASTA --start 2 --end 4 --fps 30
python3 skills/flowdesign/scripts/frames.py VIDEO --strip 2.0 2.8 --n 12 --out PASTA
```

## Trazer um site inteiro para rodar localmente

```bash
npm install && npx playwright install chromium        # uma vez (ou use o Chrome instalado: --channel chrome)
node skills/flowdesign/scripts/capture_site.mjs https://exemplo.com/pagina
cd captures/exemplo.com_pagina && ./abrir.sh          # Windows: abrir.bat
```

O capturador abre o site num Chromium, rola a página inteira, grava todas as respostas de rede (HTML, JS, CSS, imagens,
fontes, JSON, modelos 3D, vídeos) e monta uma pasta com servidor local e Service Worker que reproduz o site vivo,
com animações e WebGL. No fim ele confere a cópia em modo offline e lista o que faltou.
Opções e limites em `skills/flowdesign/references/site-capture.md`. Sites com WebGL pesado: use `--headed`.

As capturas contêm conteúdo de terceiros: servem para estudo e ficam fora do git (`captures/` está no `.gitignore`).

## Design system e branding completos a partir de uma URL

```bash
node skills/flowdesign/scripts/capture_site.mjs https://exemplo.com          # traz o site
node skills/flowdesign/scripts/site_design.mjs captures/exemplo.com_home     # mede → captures/…/design/
# o agente lê a medição e o código, escreve design-systems/<marca>-design-system/tokens.json e DESIGN.md, depois:
python3 skills/flowdesign/scripts/ds_build.py design-systems/<marca>-design-system/tokens.json
xdg-open design-systems/<marca>-design-system/preview.html
```

Pedido ao agente: "faz o design system completo de https://exemplo.com" ou "quero o branding e as animações desse site".

O `site_design.mjs` roda o site num Chromium com uma sonda instalada antes dos scripts dele. Ele espera a intro/loader
liberar a rolagem, rola a página inteira com a roda do mouse (Lenis, pins e reveals disparam de verdade), lê o que aparece
em cada trecho e registra:

- variáveis CSS do autor (claro e escuro) e `@font-face` agrupado, com os pesos realmente usados;
- a escala tipográfica real com o **valor escrito pelo autor** (`2vw`, `clamp(…)`), em desktop e mobile;
- breakpoints, grids, blocos da página e quanto da rolagem é pin;
- cada botão, link, campo e card com hover e foco medidos, e recortes de tela;
- `@keyframes`, transições, animações em execução, classes trocadas, IntersectionObservers, `element.animate()`;
- com GSAP global: o mapa de rolagem (ScrollTriggers em px), as timelines com cada tween na ordem, o ease real e a faixa
  de rolagem de cada um; com Lenis global: as opções passadas.

O agente transforma isso num `DESIGN.md` de 14 seções (marca, cor, tipografia, layout, forma, imagem, componentes, motion
com catálogo e código, stack, acessibilidade, como reconstruir e adaptar) e num `preview.html` com animações clicáveis.
Exemplo pronto: `design-systems/eight-shot-design-system/`. Guia: `skills/flowdesign/references/site-design.md`.

Em página com WebGL, a medição é lenta sem GPU (minutos); na sua máquina use `--headed`.

## Design system a partir de um vídeo de referência

```bash
python3 skills/flowdesign/scripts/extract_design.py library/refs/<id>/source.mp4     # mede → design/
# o agente olha as telas, decide e escreve design-system/tokens.json, depois:
python3 skills/flowdesign/scripts/ds_build.py library/refs/<id>/design-system/tokens.json
xdg-open library/refs/<id>/design-system/preview.html
```

Pedido ao agente: "cria o design system da referência <id>". Exemplo pronto em
`library/refs/web-animation-8281bd42/design-system/`.

De vídeo, o resultado é uma **reconstrução**: cores e tamanhos são medidos, mas a família tipográfica é substituída por uma
equivalente aberta e os estados que não aparecem (hover, mobile) são projetados. Com a URL do site, use o fluxo da seção anterior.
OCR é opcional (`sudo dnf install tesseract` + `pip install pytesseract`); sem ele a medição de texto usa só detecção por forma.

## Git

Vídeos crescem rápido. Antes do primeiro commit com muitos vídeos: `git lfs install` (o `.gitattributes` já marca mp4/mov/webm/glb para LFS).
As pastas `analysis/` são regeneráveis, mas ficam versionadas porque deixam o agente trabalhar sem reprocessar; se pesar, adicione `library/refs/*/analysis/keyframes/` ao `.gitignore`.

## Como o agente "vê" um vídeo

Ele não assiste. O `analyze_video.py` usa ffmpeg + OpenCV para:
- detectar a **região ativa** (site dentro de mockup/celular) e analisar só ela;
- medir **optical flow** frame a frame → translação, zoom, rotação, área em movimento;
- segmentar **eventos** de movimento e estimar **duração e easing** (comparando a curva de progresso com power/expo/sine/back);
- comparar a velocidade de regiões da tela → indícios de **parallax** e **pin**;
- detectar **cortes**, gerar **folhas de contato** com tempo, **timeline**, **heatmap**, **keyframes** e **paleta**.

O agente lê essas imagens e números, amplia trechos com `frames.py` e escreve o breakdown, sempre com grau de certeza,
porque a análise automática erra e a confirmação visual é obrigatória.
