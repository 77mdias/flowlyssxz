# Análise automática — source.mp4

- **Formato:** 720×540 (landscape), 60.0 fps, 15.384s, áudio: não
- **Região ativa (ROI):** x=0 y=124 720×414 — 77% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 15.38s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 6 • tela em movimento 56% do tempo • duração mediana 1.466s
- **Paleta:** tema claro (lum. 180.0), acento — → `#d6d2df` 51% `#c6c8db` 27% `#030306` 9% `#b191bf` 6% `#826991` 3% `#453f4d` 2%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.27–2.93s | 1.67s | zoom out (afasta) | power1.in (baixa, pico em 0.56) | 0.0 telas/s | 42% | — |
| E2 | 3.00–4.87s | 1.87s | zoom out (afasta) | sine.inOut (baixa, pico em 0.29) | 0.0 telas/s | 48% | — |
| E3 | 4.93–5.87s | 0.93s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.29) | 0.0 telas/s | 40% | — |
| E4 | 5.93–7.47s | 1.53s | zoom out (afasta) | back.out (overshoot) (baixa, pico em 0.13) | 0.17 telas/s | 49% | — |
| E5 | 7.53–8.93s | 1.40s | zoom out (afasta) | power1.in (baixa, pico em 0.52) | 0.0 telas/s | 42% | — |
| E6 | 9.20–10.40s | 1.20s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.72) | 0.2 telas/s | 50% | — |

## Pistas de interpretação

- **E1** (1.27s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E2** (3.00s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E3** (4.93s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E4** (5.93s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E5** (7.53s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E6** (9.20s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 19 em keyframes/
