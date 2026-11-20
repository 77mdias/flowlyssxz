# Análise automática — source.mp4

- **Formato:** 576×1024 (portrait), 30.0 fps, 22.084s, áudio: sim
- **Região ativa (ROI):** x=0 y=328 568×694 — 67% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 22.08s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 5 • tela em movimento 46% do tempo • duração mediana 1.333s
- **Paleta:** tema médio (lum. 119.4), acento — → `#20201f` 29% `#e9e7e8` 29% `#3d3c37` 16% `#636058` 10% `#8d887c` 7% `#bcb7ae` 6%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.47–4.20s | 3.73s | rotação | power1.in (baixa, pico em 0.82) | 0.0 telas/s | 28% | — |
| E2 | 4.67–5.07s | 0.40s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.0) | 0.0 telas/s | 21% | — |
| E3 | 8.87–10.20s | 1.33s | zoom in (aproxima) | power3.inOut (baixa, pico em 0.55) | 0.0 telas/s | 28% | — |
| E4 | 12.33–13.40s | 1.07s | zoom in (aproxima) | power1.out (ease-out leve) (baixa, pico em 0.31) | 0.0 telas/s | 24% | — |
| E5 | 15.40–19.07s | 3.67s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.out (ease-out leve) (média, pico em 0.15) | 0.02 telas/s | 40% | — |

## Pistas de interpretação

- **E1** (0.47s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E2** (4.67s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E3** (8.87s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E4** (12.33s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E5** (15.40s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 16 em keyframes/
