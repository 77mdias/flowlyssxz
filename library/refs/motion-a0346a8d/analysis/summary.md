# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 60.0 fps, 13.184s, áudio: não
- **Região ativa (ROI):** x=48 y=306 618×664 — 45% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 13.18s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 1 • tela em movimento 100% do tempo • duração mediana 13.133s
- **Movimento contínuo:** quase não há repouso → loop, motion reel, fundo vivo ou câmera sempre andando. Eventos foram separados pelos vales de velocidade; leia o ritmo pelo timeline.png.
- **Paleta:** tema escuro (lum. 35.3), acento — → `#010001` 66% `#272326` 9% `#4b484a` 8% `#737273` 7% `#ededeb` 4% `#a5a3a4` 4%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.00–13.13s | 13.13s | rotação | linear / none (alta, pico em 0.98) | 0.0 telas/s | 61% | — |

## Pistas de interpretação

- **E1** (0.00s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 4 em keyframes/
