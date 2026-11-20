# Análise automática — source.mp4

- **Formato:** 720×900 (portrait), 30.0 fps, 13.534s, áudio: não
- **Região ativa (ROI):** x=0 y=234 716×666 — 74% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 13.53s @ 15.0 fps
- **Cenas (cortes):** 3 — cortes em 5.0s, 8.533s
- **Eventos de movimento:** 5 • tela em movimento 44% do tempo • duração mediana 0.8s
- **Paleta:** tema escuro (lum. 21.7), acento — → `#020102` 59% `#171415` 18% `#322e2e` 11% `#524d4c` 6% `#837b79` 3% `#ded8d7` 0%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 2.60–3.20s | 0.60s | zoom in (aproxima) | linear / none (média, pico em 0.67) | 0.01 telas/s | 69% | — |
| E2 | 3.60–4.53s | 0.93s | zoom in (aproxima) | power1.out (ease-out leve) (baixa, pico em 0.36) | 0.02 telas/s | 73% | — |
| E3 | 4.60–4.93s | 0.33s | zoom in (aproxima) | power1.in (alta, pico em 1.0) | 0.0 telas/s | 69% | — |
| E4 | 5.13–8.47s | 3.33s | zoom in (aproxima) | linear / none (alta, pico em 0.06) | 0.01 telas/s | 56% | — |
| E5 | 8.73–9.53s | 0.80s | zoom in (aproxima) | power1.out (ease-out leve) (baixa, pico em 0.33) | 0.01 telas/s | 45% | — |

## Pistas de interpretação

- **E1** (2.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E2** (3.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E3** (4.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E4** (5.13s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E5** (8.73s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 18 em keyframes/
