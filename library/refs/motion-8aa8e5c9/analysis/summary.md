# Análise automática — source.mp4

- **Formato:** 720×648 (landscape), 30.0 fps, 8.0s, áudio: não
- **Região ativa (ROI):** x=42 y=92 634×526 — 71% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 8.00s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 2 • tela em movimento 62% do tempo • duração mediana 2.466s
- **Paleta:** tema claro (lum. 208.9), acento — → `#fefcfe` 60% `#a7aab3` 10% `#5b5b61` 9% `#cecdd5` 8% `#7a7c86` 7% `#2e2d32` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.07–4.00s | 2.93s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (média, pico em 0.55) | 0.0 telas/s | 39% | — |
| E2 | 5.40–7.40s | 2.00s | zoom out (afasta) | power1.out (ease-out leve) (baixa, pico em 0.2) | 0.0 telas/s | 38% | — |

## Pistas de interpretação

- **E1** (1.07s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E2** (5.40s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 7 em keyframes/
