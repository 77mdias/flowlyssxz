# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 24.0 fps, 5.209s, áudio: não
- **Região ativa (ROI):** x=26 y=208 644×912 — 64% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 5.21s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 2 • tela em movimento 70% do tempo • duração mediana 1.833s
- **Paleta:** tema claro (lum. 175.9), acento — → `#a89d93` 21% `#897f77` 20% `#c0b4ab` 19% `#f7f0ec` 17% `#dbd0c8` 16% `#4d3f36` 4%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.33–3.73s | 3.40s | zoom in (aproxima) | linear / none (baixa, pico em 0.35) | 0.02 telas/s | 61% | — |
| E2 | 4.87–5.13s | 0.27s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.75) | 0.0 telas/s | 57% | — |

## Pistas de interpretação

- **E1** (0.33s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E2** (4.87s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 7 em keyframes/
