# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 30.0 fps, 16.068s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 16.07s @ 15.0 fps
- **Cenas (cortes):** 9 — cortes em 1.067s, 4.467s, 5.8s, 9.467s, 10.8s, 11.2s, 11.4s, 14.133s
- **Eventos de movimento:** 9 • tela em movimento 65% do tempo • duração mediana 1.067s
- **Paleta:** tema escuro (lum. 36.2), acento #710718 → `#450108` 27% `#710718` 26% `#1c0003` 20% `#aa1026` 13% `#bb5567` 8% `#d7b6cb` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.07–2.27s | 1.20s | zoom in (aproxima) | power3.out (baixa, pico em 0.06) | 0.01 telas/s | 54% | — |
| E2 | 2.33–4.40s | 2.07s | rotação | linear / none (alta, pico em 0.29) | 0.01 telas/s | 47% | — |
| E3 | 4.87–5.73s | 0.87s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.38) | 0.0 telas/s | 31% | — |
| E4 | 5.93–7.00s | 1.07s | zoom in (aproxima) | linear / none (baixa, pico em 0.75) | 0.0 telas/s | 36% | — |
| E5 | 7.07–9.40s | 2.33s | zoom in (aproxima) | power1.in (média, pico em 0.63) | 0.0 telas/s | 43% | — |
| E6 | 9.47–10.73s | 1.27s | rotação | linear / none (baixa, pico em 0.21) | 0.0 telas/s | 61% | — |
| E7 | 10.80–11.13s | 0.33s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 1.0) | 0.0 telas/s | 50% | — |
| E8 | 11.40–12.33s | 0.93s | zoom out (afasta) | linear / none (baixa, pico em 0.21) | 0.03 telas/s | 53% | — |
| E9 | 12.40–12.80s | 0.40s | zoom out (afasta) | linear / none (baixa, pico em 0.0) | 0.0 telas/s | 37% | — |

## Pistas de interpretação

- **E1** (1.07s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E2** (2.33s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E3** (4.87s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E4** (5.93s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E5** (7.07s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E6** (9.47s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E7** (10.80s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E8** (11.40s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E9** (12.40s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 36 em keyframes/
