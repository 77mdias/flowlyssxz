# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 30.0 fps, 18.902s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 18.90s @ 15.0 fps
- **Cenas (cortes):** 7 — cortes em 4.8s, 5.133s, 5.333s, 8.733s, 14.667s, 18.733s
- **Eventos de movimento:** 6 • tela em movimento 52% do tempo • duração mediana 0.767s
- **Paleta:** tema escuro (lum. 95.4), acento #454b77 → `#181820` 32% `#bebecb` 20% `#9c9eae` 12% `#454b77` 12% `#2d3146` 12% `#757791` 10%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.80–1.27s | 0.47s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.29) | 0.0 telas/s | 40% | — |
| E2 | 2.67–3.73s | 1.07s | rotação | linear / none (baixa, pico em 0.25) | 0.0 telas/s | 35% | — |
| E3 | 4.33–4.73s | 0.40s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (média, pico em 0.5) | 0.0 telas/s | 41% | — |
| E4 | 8.73–14.07s | 5.33s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (alta, pico em 0.66) | 0.04 telas/s | 69% | — |
| E5 | 14.13–14.60s | 0.47s | zoom out (afasta) | power1.out (ease-out leve) (média, pico em 0.14) | 0.0 telas/s | 46% | — |
| E6 | 16.60–18.67s | 2.07s | zoom in (aproxima) | linear / none (média, pico em 0.32) | 0.04 telas/s | 42% | — |

## Pistas de interpretação

- **E1** (0.80s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E2** (2.67s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E3** (4.33s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E4** (8.73s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E5** (14.13s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E6** (16.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 25 em keyframes/
