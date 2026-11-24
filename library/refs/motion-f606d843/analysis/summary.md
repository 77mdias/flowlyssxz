# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 30.0 fps, 67.409s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 67.41s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 6 • tela em movimento 18% do tempo • duração mediana 1.734s
- **Paleta:** tema escuro (lum. 77.1), acento #467680 → `#0c141f` 44% `#293f49` 17% `#84a4aa` 12% `#467680` 11% `#b6cbd3` 11% `#925e62` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 22.60–26.73s | 4.13s | zoom out (afasta) | power2.out (média, pico em 0.0) | 0.03 telas/s | 63% | — |
| E2 | 32.47–35.60s | 3.13s | zoom in (aproxima) | linear / none (média, pico em 0.0) | 0.01 telas/s | 60% | — |
| E3 | 40.00–41.47s | 1.47s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (alta, pico em 0.41) | 0.02 telas/s | 56% | — |
| E4 | 44.00–45.47s | 1.47s | zoom in (aproxima) | power1.out (ease-out leve) (média, pico em 0.36) | 0.01 telas/s | 57% | — |
| E5 | 46.93–48.93s | 2.00s | zoom out (afasta) | linear / none (alta, pico em 0.7) | 0.01 telas/s | 46% | — |
| E6 | 62.33–62.53s | 0.20s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (baixa, pico em 0.0) | 0.02 telas/s | 77% | — |

## Pistas de interpretação

- **E1** (22.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic); longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E2** (32.47s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E3** (40.00s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E4** (44.00s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E5** (46.93s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E6** (62.33s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; muito curto (<250ms) → micro-interação/feedback

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 19 em keyframes/
