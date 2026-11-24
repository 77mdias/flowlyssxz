# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 30.0 fps, 12.068s, áudio: sim
- **Região ativa (ROI):** x=8 y=284 710×994 — 77% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 12.07s @ 15.0 fps
- **Cenas (cortes):** 3 — cortes em 0.8s, 8.8s
- **Eventos de movimento:** 6 • tela em movimento 42% do tempo • duração mediana 0.8s
- **Paleta:** tema claro (lum. 191.6), acento #ce8a61 → `#e2d9dd` 33% `#c5c2d8` 27% `#d8bdac` 22% `#8188b2` 6% `#ce8a61` 5% `#44384a` 4%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.60–2.73s | 1.13s | rotação | power4.out (baixa, pico em 0.0) | 0.0 telas/s | 46% | — |
| E2 | 3.60–4.40s | 0.80s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.42) | 0.0 telas/s | 46% | — |
| E3 | 5.60–6.80s | 1.20s | zoom out (afasta) | back.out (overshoot) (média, pico em 0.0) | 0.02 telas/s | 57% | — |
| E4 | 7.60–8.40s | 0.80s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (baixa, pico em 0.33) | 0.02 telas/s | 54% | — |
| E5 | 9.67–10.47s | 0.80s | zoom out (afasta) | back.out (overshoot) (baixa, pico em 0.0) | 0.0 telas/s | 50% | — |
| E6 | 11.60–11.93s | 0.33s | zoom out (afasta) | sine.inOut (baixa, pico em 0.4) | 0.0 telas/s | 56% | — |

## Pistas de interpretação

- **E1** (1.60s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E2** (3.60s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E3** (5.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E4** (7.60s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E5** (9.67s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E6** (11.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 21 em keyframes/
