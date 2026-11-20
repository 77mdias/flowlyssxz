# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 24.0 fps, 8.042s, áudio: sim
- **Região ativa (ROI):** x=0 y=172 720×938 — 73% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 8.04s @ 15.0 fps
- **Cenas (cortes):** 7 — cortes em 1.6s, 1.667s, 1.733s, 3.4s, 3.467s, 5.067s
- **Eventos de movimento:** 6 • tela em movimento 37% do tempo • duração mediana 0.467s
- **Paleta:** tema escuro (lum. 66.5), acento #b8856f → `#141216` 41% `#312e33` 31% `#635151` 7% `#f1ebeb` 7% `#cebaab` 6% `#b8856f` 5%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.47–0.93s | 0.47s | zoom in (aproxima) | sine.inOut (média, pico em 0.57) | 0.0 telas/s | 31% | — |
| E2 | 1.33–1.53s | 0.20s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 1.0) | 0.0 telas/s | 39% | — |
| E3 | 1.73–2.27s | 0.53s | zoom in (aproxima) | power1.out (ease-out leve) (baixa, pico em 0.25) | 0.0 telas/s | 41% | — |
| E4 | 3.13–3.33s | 0.20s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.in (alta, pico em 1.0) | 0.0 telas/s | 51% | — |
| E5 | 3.47–3.93s | 0.47s | zoom in (aproxima) | linear / none (média, pico em 0.0) | 0.12 telas/s | 52% | — |
| E6 | 5.80–6.93s | 1.13s | zoom out (afasta) | sine.inOut (média, pico em 0.53) | 0.06 telas/s | 57% | — |

## Pistas de interpretação

- **E1** (0.47s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E2** (1.33s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; muito curto (<250ms) → micro-interação/feedback
- **E3** (1.73s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E4** (3.13s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; muito curto (<250ms) → micro-interação/feedback
- **E5** (3.47s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E6** (5.80s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 25 em keyframes/
