# Vocabulário de motion para web

Use estes nomes nos breakdowns: um vocabulário comum torna referências comparáveis e buscáveis (`library.py find`).

## Fundamentos

- **Easing** — a curva de velocidade. `out` desacelera ao chegar (entradas), `in` acelera ao sair (saídas), `inOut` para movimentos de A→B dentro da tela (transições, câmera). Potência: power1 (suave) → power4/expo (dramático). Linear (`none`) só para scrub, loops e marquees.
- **Duração** — maior distância/área ⇒ mais tempo. Mobile: ~20–30% mais curto.
- **Stagger** — atraso entre elementos irmãos. Cria leitura sequencial e ritmo.
- **Overlap / offset** — começar a próxima animação antes da anterior terminar (`"<0.2"`, `"-=0.4"` na timeline GSAP). É o que faz parecer "coreografado" e não "uma coisa depois da outra".
- **Spring** — física (rigidez, amortecimento, massa). Sensação tátil, interrompível. Ideal para UI de produto (Motion).
- **Lerp** (interpolação linear amortecida) — `atual += (alvo - atual) * 0.1` por frame. Base do smooth scroll, cursor que segue, mouse parallax.
- **Scrub** — progresso da animação = progresso do scroll. `scrub: true` (colado) ou `scrub: 1` (com 1s de atraso suave).
- **Toggle** — scroll apenas dispara; a animação roda no próprio tempo.
- **Pin** — fixar um elemento enquanto o scroll avança uma "distância de animação".

## Princípios (Disney adaptados à UI)

Antecipação (pequeno recuo antes de ir) · Follow-through/overlap (partes chegam em tempos diferentes) · Arcos (trajetórias curvas parecem naturais) · Encenação (um foco por vez) · Ação secundária (detalhe que reforça a principal, ex.: sombra) · Timing (peso percebido) · Exagero (com moderação) · Squash & stretch (sutil em botões/cursores).

## Entradas e reveals

| Nome | Descrição |
|---|---|
| fade-up | opacity 0→1 + y 20–40px. Genérico: use com parcimônia |
| line reveal (masked) | linhas de texto sobem de dentro de uma máscara |
| char stagger | letras entram uma a uma (y, opacity, rotate) |
| scroll text fill | letras/palavras acendem conforme o scroll (opacity/cor scrub) |
| clip reveal | `clip-path: inset(100% 0 0 0) → inset(0)`; variações circle(), polygon() |
| curtain / wipe | painel sólido cobre e descobre |
| scale settle | imagem entra grande (1.2–1.4) e assenta em 1 |
| blur-in | desfoque → nitidez |
| draw-on | traço de SVG se desenhando |
| counter | número contando até o valor |

## Padrões de scroll

| Nome | Descrição |
|---|---|
| smooth scroll | rolagem amortecida (Lenis) |
| parallax de camadas | camadas em velocidades diferentes |
| parallax interno | imagem desliza dentro do próprio quadro |
| pinned storytelling | seção fixa enquanto o conteúdo dela muda (passos, frames, 3D) |
| horizontal section | rolagem vertical move uma faixa horizontal |
| sticky stack | cards/seções empilham uns sobre os outros |
| section curtain | seção atual sobe e revela a próxima fixa por baixo (ou o contrário) |
| zoom-through | escala até "entrar" numa imagem/elemento e virar a próxima seção |
| image sequence | sequência de frames desenhada em canvas pelo scroll |
| 3D camera path | câmera percorre uma curva no espaço 3D conforme o scroll |
| velocity effects | skew/stretch/blur proporcionais à velocidade do scroll |
| progress UI | barra/indicador de progresso, contadores de seção |
| snap | encaixe em seções (use com cuidado) |

## Ponteiro e interação

custom cursor (lerp) · cursor com estados (vira "ver", "arrastar") · magnetic button · hover underline/fill · image reveal following cursor · image trail · tilt 3D · spotlight/gradient follow · mouse parallax (cena gira com o ponteiro) · drag com inércia · hover distortion (shader) · press feedback (scale 0.97).

## 3D / WebGL

câmera dolly/orbit/truck · objeto hero girando · morph targets · partículas instanciadas · materiais de vidro (transmission), iridescência, metal com HDRI · pós: bloom, DOF, chromatic aberration, grain · DOM↔WebGL sync (imagens do HTML viram planos WebGL com shader) · fluid/trail no cursor · noise displacement.

## Transições

page transition (overlay, wipe, fade-through) · shared element (FLIP / View Transitions / layoutId) · cross-fade · WebGL dissolve/displacement · route-aware direction (vai e volta com sentidos opostos).

## Tempo como hierarquia

- **Herói** (1 por seção): o maior, mais longo e mais expressivo.
- **Suporte**: textos e elementos ao redor, mais curtos, com stagger.
- **Ambiente**: loops lentos e sutis (gradientes, grão, flutuação) — nunca disputam atenção.
