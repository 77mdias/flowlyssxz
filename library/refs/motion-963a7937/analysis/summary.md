# Análise automática — source.mp4

- **Formato:** 720×1152 (portrait), 60.0 fps, 4.467s, áudio: sim
- **Região ativa (ROI):** x=44 y=114 644×668 — 52% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 4.47s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 2 • tela em movimento 33% do tempo • duração mediana 0.734s
- **Paleta:** tema médio (lum. 156.8), acento #2b3ca7 → `#99bfd7` 64% `#232039` 12% `#e1d4e9` 7% `#868190` 6% `#2b3ca7` 4% `#8e79e5` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.07–1.93s | 0.87s | zoom in (aproxima) | power3.in (baixa, pico em 0.62) | 0.0 telas/s | 47% | — |
| E2 | 3.47–4.07s | 0.60s | zoom out (afasta) | power1.out (ease-out leve) (baixa, pico em 0.33) | 0.0 telas/s | 35% | — |

## Pistas de interpretação

- **E1** (1.07s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E2** (3.47s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 7 em keyframes/
