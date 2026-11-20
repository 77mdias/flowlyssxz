# Análise automática — source.mp4

- **Formato:** 720×540 (landscape), 60.0 fps, 14.507s, áudio: sim
- **Região ativa (ROI):** x=54 y=96 606×342 — 53% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 14.51s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 5 • tela em movimento 56% do tempo • duração mediana 1.6s
- **Paleta:** tema claro (lum. 195.1), acento #9c725a → `#f6f4f6` 70% `#201f22` 10% `#bcbcbe` 5% `#010101` 5% `#52585d` 5% `#9c725a` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.07–1.87s | 1.80s | translação vertical global (scroll ou pan) | power1.out (ease-out leve) (baixa, pico em 0.37) | 0.6 telas/s | 59% | parallax spread 1.97 |
| E2 | 3.20–4.80s | 1.60s | translação vertical global (scroll ou pan) | power1.out (ease-out leve) (baixa, pico em 0.38) | 0.61 telas/s | 56% | parallax spread 1.2 |
| E3 | 5.67–8.40s | 2.73s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (média, pico em 0.34) | 0.54 telas/s | 56% | parallax pin spread 1.49 |
| E4 | 9.60–10.47s | 0.87s | zoom out (afasta) | sine.inOut (baixa, pico em 0.85) | 0.0 telas/s | 33% | — |
| E5 | 12.13–13.40s | 1.27s | zoom out (afasta) | expo.out (lerp/inércia) (baixa, pico em 0.16) | 0.06 telas/s | 50% | — |

## Pistas de interpretação

- **E1** (0.07s): regiões movendo em velocidades diferentes (spread 1.97) → PARALLAX; razões por célula indicam data-speed/yPercent
- **E2** (3.20s): regiões movendo em velocidades diferentes (spread 1.2) → PARALLAX; razões por célula indicam data-speed/yPercent
- **E3** (5.67s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E4** (9.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E5** (12.13s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 16 em keyframes/
