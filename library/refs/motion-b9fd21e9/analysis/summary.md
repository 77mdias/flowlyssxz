# Análise automática — source.mp4

- **Formato:** 720×960 (portrait), 25.0 fps, 4.64s, áudio: não
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 4.64s @ 15.0 fps
- **Cenas (cortes):** 3 — cortes em 0.867s, 3.133s
- **Eventos de movimento:** 5 • tela em movimento 45% do tempo • duração mediana 0.4s
- **Paleta:** tema escuro (lum. 54.7), acento #a51218 → `#070507` 47% `#322c2f` 19% `#716a6c` 13% `#c0b0ad` 9% `#f86665` 7% `#a51218` 2%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.60–0.80s | 0.20s | zoom in (aproxima) | power2.inOut (baixa, pico em 0.67) | 0.0 telas/s | 78% | — |
| E2 | 0.87–1.33s | 0.47s | rotação | sine.inOut (média, pico em 0.29) | 0.12 telas/s | 75% | — |
| E3 | 2.67–3.07s | 0.40s | zoom in (aproxima) | power2.out (baixa, pico em 0.0) | 0.06 telas/s | 74% | — |
| E4 | 3.20–3.53s | 0.33s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (alta, pico em 0.8) | 0.03 telas/s | 66% | — |
| E5 | 3.87–4.53s | 0.67s | zoom out (afasta) | linear / none (média, pico em 0.4) | 0.13 telas/s | 82% | — |

## Pistas de interpretação

- **E1** (0.60s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; muito curto (<250ms) → micro-interação/feedback
- **E2** (0.87s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E3** (2.67s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E4** (3.20s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E5** (3.87s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 18 em keyframes/
