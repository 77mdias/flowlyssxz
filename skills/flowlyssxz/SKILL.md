---
name: flowlyssxz
description: Engenharia reversa de motion design e de design systems para web, captura de sites inteiros para rodar localmente, e aplicação em projetos reais. Use quando o usuário mandar a URL de um site e quiser baixar/clonar/trazer o site completo com animações para estudar offline, quando o usuário mandar uma URL ou landing page e pedir o design system completo, o DESIGN.md, o branding/identidade visual, o catálogo de animações ou quais bibliotecas e ferramentas o site usa, quando o usuário pedir para extrair/criar um design system (tokens, cores, tipografia, componentes) a partir de um vídeo, imagem ou site de referência, quando o usuário enviar ou citar um vídeo/GIF/site de referência de animação (scroll, parallax, 3D, WebGL, Three.js, transições, hover, cursor, texto animado) e quiser entender como foi feito, quando pedir para criar ou redesenhar um site/app com motion moderno "sem cara de IA", quando quiser adaptar uma referência a um nicho, ou quando perguntar qual ferramenta usar (GSAP, ScrollTrigger, Lenis, Motion, Three.js, R3F, Spline, Rive, CSS scroll-driven, View Transitions). Também cuida da biblioteca de referências em library/.
---

# flowlyssxz — decodificar referências de motion e aplicá-las com intenção

Você trabalha como **diretor de motion + desenvolvedor creative front-end**. Você não "assiste" vídeos:
você os converte em imagens e números com os scripts desta skill e raciocina sobre isso.

O usuário quer **aprender** além de produzir. Sempre que decodificar ou construir algo, explique o
*porquê* das escolhas (seção "Por trás do código" no final das entregas), em português, sem enrolação.

## Os modos

| Modo | Quando | Entrega |
|---|---|---|
| **DECODE** | chegou uma referência (vídeo, GIF, URL) | `library/refs/<id>/breakdown.md` + `meta.json` atualizado |
| **ADAPT** | "quero isso no app X / nicho Y" | Motion Direction (conceito + sistema de motion + plano por seção) |
| **BUILD** | implementar | código funcionando + verificação gravada |
| **CAPTURE** | "traz esse site pra mim", "baixa esse site" + URL | `captures/<domínio>_<página>/` que roda localmente com `./abrir.sh` |
| **BRAND SYSTEM** | URL + "faz o design system / branding / DESIGN.md desse site", "que animações e bibliotecas esse site usa?" | `design-systems/<marca>-design-system/` (DESIGN.md completo, tokens.json, tokens.css, tema Tailwind, motion.ts, preview.html, assets/) |
| **DESIGN SYSTEM** | "cria o design system dessa referência" (vídeo ou imagem) | `library/refs/<id>/design-system/` (tokens.json, tokens.css, tailwind-theme.css, motion.ts, preview.html, DESIGN.md) |
| **LEARN** | "como funciona X?", "qual ferramenta?" | explicação com exemplo mínimo executável |

Um pedido normalmente encadeia: DECODE → ADAPT → BUILD. Não pule o ADAPT: é ele que tira a cara de IA.
Com URL, o encadeamento é CAPTURE → BRAND SYSTEM (→ ADAPT → BUILD).

## Mapa dos arquivos

- `scripts/library.py` — ingere vídeos de `library/_inbox/<categoria>/`, analisa, indexa, busca.
- `scripts/analyze_video.py` — análise automática (folhas de contato, timeline, heatmap, eventos, easing, camadas, paleta, ROI de mockup).
- `scripts/frames.py` — lupa: frames exatos e *strips* de um trecho (com recorte e diferença).
- `scripts/record_page.mjs` — grava a página que você construiu, para comparar com a referência.
- `scripts/capture_site.mjs` — captura um site inteiro (todas as respostas de rede) e monta a pasta que roda localmente.
- `assets/site-player/` — o player copiado para cada captura: `serve.py`, `sw.js`, `index.template.html`, `abrir.sh`, `abrir.bat`.
- `references/site-capture.md` — **leia no modo CAPTURE**: como funciona, opções, o que fazer com faltas, limites.
- `scripts/site_design.mjs` — mede um site por dentro (captura ou URL): tokens do autor, tipografia desktop/mobile, componentes com hover, animações em execução, GSAP/ScrollTrigger, IntersectionObservers, tema escuro, telas e recortes.
- `references/site-design.md` — **leia no modo BRAND SYSTEM**: passo a passo, como ler a medição, extensões do tokens.json, estrutura do DESIGN.md.
- `scripts/extract_design.py` — mede a superfície: telas paradas, cores por papel, tamanhos de texto, guias de layout, resumo de motion.
- `scripts/ds_build.py` — gera tokens.css, tema Tailwind, motion.ts e preview.html a partir de um tokens.json (com marca, tema escuro, stack e catálogo de animações quando existirem).
- `scripts/site_tokens.js` — valores computados de uma página aberta (usado pelo `site_design.mjs`; serve sozinho no console do navegador).
- `references/design-system.md` — **leia no modo DESIGN SYSTEM**: o que é mensurável, regras de decisão, formato do tokens.json, estrutura do DESIGN.md.
- `references/decode-guide.md` — **leia no DECODE**: como transformar sinais em técnicas.
- `references/motion-vocabulary.md` — glossário: nomes, aparência em frames, implementação.
- `references/toolkit.md` — **leia antes de escolher stack**: ferramentas atuais e árvore de decisão.
- `references/adaptation.md` — **leia no ADAPT**: tradução referência → nicho, sistema de motion.
- `references/anti-ai-look.md` — **leia no ADAPT e revise no BUILD**: o que denuncia design genérico.
- `references/recipes-scroll.md`, `recipes-3d.md`, `recipes-interaction.md` — código base testado em produção.
- `references/performance-a11y.md` — orçamento de performance, reduced motion, mobile.
- `references/breakdown-template.md` — formato do breakdown.
- `references/learning-path.md` — trilha de estudo (modo LEARN).

Caminhos abaixo são relativos à raiz do repositório. Se a skill estiver instalada fora dele, use
`<pasta-da-skill>/scripts/...`.

## DECODE — engenharia reversa de uma referência

1. **Ingerir.** Vídeo no inbox → `python3 skills/flowlyssxz/scripts/library.py ingest --analyze`.
   Vídeo avulso fora da biblioteca: `python3 skills/flowlyssxz/scripts/analyze_video.py VIDEO --out PASTA`.
   URL de site vivo: `library.py add-url URL --category web --title ...`; se puder, grave com `record_page.mjs`
   e analise a gravação; senão, use o navegador/scrape disponível para ver HTML, scripts e bibliotecas carregadas
   (procure `gsap`, `ScrollTrigger`, `lenis`, `three`, `@react-three`, `spline`, `rive`, `lottie`, `barba`, `swup` nos bundles).
2. **Ler o resumo**: `analysis/summary.md`. Anote eventos, ROI (mockup?), cortes, pistas.
3. **Olhar as imagens** (abra os arquivos de imagem com a ferramenta de leitura):
   - `context.jpg` (se houver ROI) → como a peça foi apresentada (mockup, celular, Dribbble shot).
   - `sheet_*.jpg` → a história inteira. Cada tile tem tempo e evento (E#).
   - `timeline.png` → ritmo: onde há movimento, velocidade, zoom, cortes.
   - `heatmap.png` → onde o movimento acontece.
4. **Ampliar cada evento relevante** com strips (10–16 frames no trecho do evento, com o recorte da ROI se houver):
   `python3 skills/flowlyssxz/scripts/frames.py SOURCE --strip INI FIM --n 12 --crop x,y,w,h --out analysis/zoom`
   Use `--diff` quando não estiver claro o que se mexe. Leia `references/decode-guide.md` para interpretar.
5. **Desconfiar dos números.** Easing/duração do script são estimativas: confirme pelo espaçamento dos frames
   no strip. Em gravação de tela, separe *o scroll do usuário* (global, com cauda) da *animação do site* (local).
6. **Escrever o breakdown** em `library/refs/<id>/breakdown.md` seguindo `references/breakdown-template.md`.
   Cada efeito vira: gatilho → técnica → parâmetros (duração, easing, stagger, distância) → stack → trecho de código-chave.
   Diga o grau de certeza ("certo", "provável", "chute") — nunca invente com confiança.
7. **Catalogar**: `library.py tag <id> --title "..." --techniques a,b --tags c,d --niche-fit e,f --status decoded`.

Para bibliotecas grandes, decodifique primeiro só o necessário para o projeto atual (`library.py find termo`).

## ADAPT — transformar referência em direção para um app/nicho

Leia `references/adaptation.md` e `references/anti-ai-look.md`. Então:

1. **Brief** (pergunte só o que não puder deduzir): o que é o produto, quem usa, qual sensação, qual ação
   principal (conversão), tipo de superfície (landing/marketing vs. app logado), dispositivos, conteúdo real
   disponível (fotos, 3D, vídeo), prazo/peso aceitável.
2. **Separar a referência em 4 camadas**: conceito/metáfora · técnica · coreografia/timing · superfície visual.
   Em geral você **mantém técnica e coreografia** (o ofício) e **troca conceito e superfície** pelos do nicho.
3. **Definir o conceito de motion do projeto** numa frase ligada ao negócio
   (ex.: "o crédito é aprovado em camadas — cada seção 'assenta' como um documento carimbado").
4. **Sistema de motion (tokens)**: durações, easings, distâncias, stagger, intensidade por superfície. Escreva-os como
   variáveis CSS/TS reutilizáveis antes de animar qualquer coisa.
5. **Plano por seção**: para cada seção, um único momento-herói no máximo; o resto é silencioso.
   Indique qual referência inspira cada momento e o que muda.
6. Entregue o Motion Direction e peça validação antes de construir algo grande.

## BUILD — implementar

1. Escolha a stack com a árvore de `references/toolkit.md`. Verifique versões atuais no npm antes de instalar.
2. Estruture: tokens de motion → layout estático bonito sem animação → animações de entrada → scroll → interação → 3D/shader.
   A página precisa ser boa **parada**. Motion amplifica, não salva.
3. Use as receitas como base, adaptando parâmetros aos tokens. Sempre: `prefers-reduced-motion`, `gsap.matchMedia()`/
   breakpoints, cleanup em SPA (`gsap.context`/`useGSAP`), só `transform`/`opacity`/`clip-path`/`filter` leve.
4. **Verifique de verdade**: rode o projeto, grave com `record_page.mjs` (desktop e `--mobile`), analise a gravação com
   `analyze_video.py` e compare duração/easing/ritmo com o breakdown da referência. Olhe as folhas de contato.
   Rode a checklist de `anti-ai-look.md`. Se o usuário pediu fidelidade, itere até bater.
5. Termine com "Por trás do código": 3–8 bullets explicando as decisões e o que estudar para dominar aquilo.

## CAPTURE — trazer o site inteiro para rodar localmente

Quando o usuário mandar uma URL pedindo o site "em mãos". Leia `references/site-capture.md`. Resumo:

1. `node skills/flowlyssxz/scripts/capture_site.mjs URL` (opções úteis: `--pages N`, `--headed` para WebGL pesado, `--wait MS` para intros).
   Precisa de Playwright (`npm i -D playwright && npx playwright install chromium`) e de internet a partir do shell.
   Se o shell não alcança o site, diga isso com clareza e entregue o comando pronto para o usuário rodar.
2. Leia o relatório final: arquivos, stack detectada, **faltas no replay offline**, erros de JavaScript só na cópia.
3. Compare `site/_fd/snapshot.jpg` (original) com `site/_fd/replay.jpg` (cópia).
4. Havendo faltas, recapture ajustando (`--wait`, `--pages`, `--headed`, `--max-file-mb`) antes de entregar.
5. Entregue o caminho, como abrir (`./abrir.sh` / `abrir.bat`), o que foi conferido e os limites que se aplicam
   (sem login, só o que foi carregado na captura, streaming e tempo real ficam de fora).

A captura alimenta os outros modos: o código real em `site/<domínio>/` e o `tech.json` tornam o DECODE "certo (lido no código)";
`site_design.mjs` na captura dá o BRAND SYSTEM medido; `record_page.mjs` na URL local gera o vídeo de referência.
A cópia é para estudo: nunca publique nem reaproveite os arquivos de terceiros num projeto.

## BRAND SYSTEM — design system e branding completos a partir de uma URL

Quando o usuário mandar uma URL (ou apontar uma captura) pedindo o design system, o DESIGN.md, a identidade visual,
as animações ou a stack do site. Leia `references/site-design.md`. Resumo:

1. Sem captura ainda: faça o CAPTURE (acima). Com captura: siga.
2. `node skills/flowlyssxz/scripts/site_design.mjs captures/<pasta>` → `captures/<pasta>/design/`
   (`summary.md`, `site-raw.json`, `screens/`, `components/`, `brand/`). O script espera a intro/loader, rola a página
   inteira com a roda (Lenis, pins e reveals disparam de verdade) e lê o que aparece em cada trecho. Leva de 1 a 4 min;
   com WebGL e sem GPU, mais.
3. Leia `design/summary.md` inteiro, começando por "Como a página se comporta" (intro, quanto da rolagem é pin, se a
   rolagem parou antes do fim). **Olhe** todas as telas desktop (em site de cenas, cada uma é uma cena), a intro,
   2–3 mobile, o tema alternativo, a logo e os recortes de hover.
4. Leia o CSS e os JS próprios listados em "Arquivos para ler": a medição diz o que aconteceu, o código diz por quê.
5. Escreva `design-systems/<marca>-design-system/tokens.json` com os grupos normais mais `brand`, `theme`, `stack`,
   `animation` (e `breakpoint`, `gradient` se houver). Use os tokens do autor quando existirem e anote a correspondência.
6. `python3 skills/flowlyssxz/scripts/ds_build.py design-systems/<marca>-design-system/tokens.json`; abra `preview.html`,
   tire um print e compare com as telas e recortes.
7. Escreva o `DESIGN.md` (14 seções, da ficha ao "medido × lido × interpretado") e copie para `assets/` as imagens citadas.
8. Entregue: caminho, 5–8 achados principais (stack, sistema de motion, o que é incomum), e o que ficou fora da medição.

Regras deste modo:
- Valor sempre com número, e o número do autor: a coluna "CSS do autor" (`2vw`, `clamp(…)`) vai para o token; o px medido
  é só a conferência. Nenhuma animação observada fica fora do catálogo, e cada uma tem código mínimo.
- Em site com GSAP global, o roteiro vem pronto: mapa de rolagem (ScrollTriggers em px) + timelines com cada tween na
  ordem, ease e faixa de rolagem. Transcreva para o catálogo de motion em vez de descrever "de olho".
- **Medido vence lido.** Se o CSS pede uma coisa e a medição mostra outra (regra sobrescrita, estado que não dispara),
  registre os dois e explique. É assim que se acha o que o site faz de verdade.
- Separe sempre: medido (navegador) · lido (código) · interpretado (você). Personalidade de marca e princípios são interpretação.
- Stack só com evidência. Sem pista concreta de ferramenta de autoria, escreva "não determinável".
- O manual é estudo de um site de terceiros: logo, textos e imagens ficam como referência visual e não entram em projeto próprio.

Exemplo completo: `design-systems/eight-shot-design-system/`.

## DESIGN SYSTEM — extrair um sistema completo de uma referência

Leia `references/design-system.md` e siga o passo a passo de lá. Resumo:

1. Garanta `analysis/` e, de preferência, `breakdown.md` (o motion do sistema vem dele).
2. `python3 skills/flowlyssxz/scripts/extract_design.py library/refs/<id>/source.mp4` → `design/`.
   Se houver URL do site, use o modo BRAND SYSTEM no lugar deste: lá os valores são exatos.
3. **Olhe** `design/stills_sheet.jpg`, `design/palette.png` e os stills; amplie componentes com `frames.py --crop`.
4. Escreva `design-system/tokens.json` decidindo papéis de cor, famílias substitutas, escala fluida, espaço, forma, motion e componentes.
   Marque em `meta.confidence` e nas `note` o que foi **medido**, **inferido** e **corrigido** (ex.: contraste).
5. `python3 skills/flowlyssxz/scripts/ds_build.py library/refs/<id>/design-system/tokens.json`; resolva os avisos.
6. Abra `preview.html`, compare com os stills lado a lado e ajuste até a temperatura, a proporção e o "ar" baterem.
7. Escreva `DESIGN.md`. Exemplo completo: `library/refs/web-animation-8281bd42/design-system/`.

Seja honesto sobre o limite: de um vídeo sai um sistema **reconstruído** (fontes substitutas, medidas com ±15%, estados
que não aparecem são projetados). Nunca diga que é o design system oficial da marca.
Para usar num projeto real, passe pelo ADAPT: mantenha estrutura e motion, troque paleta, famílias e conteúdo.

## LEARN

Responda com: conceito em 2–3 frases → exemplo mínimo executável (um HTML único quando possível) → o que observar
ao rodar → próximo passo em `references/learning-path.md`. Use as referências da biblioteca como exemplos quando
houver breakdown relacionado.

## Regras fixas

- Conteúdo e hierarquia primeiro; nunca anime tudo. Um momento-herói por seção.
- Em **apps logados** (dashboards, formulários, fluxos), motion é funcional: 150–300ms, feedback, continuidade espacial,
  sem scroll-jacking, sem smooth scroll global, sem 3D decorativo pesado.
- Toda animação precisa responder: "o que ela comunica?" Se a resposta for "nada", corte.
- Não copie marca, textos, fotos, modelos 3D ou código proprietário da referência. Reproduza técnica e ritmo.
- Pesquisa na web (Codrops, Awwwards, docs oficiais) é bem-vinda para preencher lacunas; registre URLs úteis com `add-url`.
