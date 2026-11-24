# Análise automática — source.mp4

- **Formato:** 720×1278 (portrait), 30.0 fps, 9.401s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 9.40s @ 15.0 fps
- **Cenas (cortes):** 9 — cortes em 1.467s, 1.667s, 1.867s, 2.067s, 2.333s, 2.4s, 4.667s, 6.933s
- **Eventos de movimento:** 7 • tela em movimento 38% do tempo • duração mediana 0.333s
- **Paleta:** tema escuro (lum. 64.9), acento #a42223 → `#18080a` 32% `#322c34` 30% `#4d5783` 15% `#e2ecdd` 8% `#a42223` 7% `#db7876` 6%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.07–0.27s | 0.20s | local (elemento animando numa parte da tela) | linear / none (baixa, pico em 0.0) | 0.0 telas/s | 14% | — |
| E2 | 0.40–0.73s | 0.33s | local (elemento animando numa parte da tela) | linear / none (alta, pico em 0.0) | 0.0 telas/s | 16% | — |
| E3 | 2.40–3.07s | 0.67s | zoom out (afasta) | power3.out (baixa, pico em 0.2) | 0.0 telas/s | 35% | — |
| E4 | 3.40–3.67s | 0.27s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.25) | 0.0 telas/s | 18% | — |
| E5 | 4.73–6.07s | 1.33s | zoom out (afasta) | power1.in (baixa, pico em 0.8) | 0.0 telas/s | 23% | — |
| E6 | 6.13–6.60s | 0.47s | zoom out (afasta) | power1.out (ease-out leve) (baixa, pico em 0.57) | 0.0 telas/s | 28% | — |
| E7 | 9.00–9.27s | 0.27s | zoom in (aproxima) | sine.inOut (média, pico em 0.5) | 0.0 telas/s | 48% | — |

## Pistas de interpretação

- **E1** (0.07s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale; muito curto (<250ms) → micro-interação/feedback
- **E2** (0.40s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E3** (2.40s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E4** (3.40s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E5** (4.73s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E6** (6.13s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E7** (9.00s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 30 em keyframes/
