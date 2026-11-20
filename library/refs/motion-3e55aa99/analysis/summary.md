# Análise automática — source.mp4

- **Formato:** 720×540 (landscape), 30.0 fps, 7.734s, áudio: não
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 7.73s @ 15.0 fps
- **Cenas (cortes):** 2 — cortes em 3.933s
- **Eventos de movimento:** 4 • tela em movimento 60% do tempo • duração mediana 1.134s
- **Paleta:** tema escuro (lum. 58.0), acento #217297 → `#030203` 43% `#5a5160` 15% `#292935` 14% `#857b8c` 13% `#b7abb8` 10% `#217297` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.00–1.87s | 1.87s | rotação | linear / none (baixa, pico em 0.07) | 0.27 telas/s | 63% | parallax pin spread 1.72 |
| E2 | 3.33–3.87s | 0.53s | translação horizontal global (scroll lateral / slider / pan) | linear / none (baixa, pico em 0.25) | 0.36 telas/s | 69% | — |
| E3 | 3.93–5.40s | 1.47s | rotação | power1.out (ease-out leve) (baixa, pico em 0.0) | 0.51 telas/s | 63% | parallax pin spread 2.35 |
| E4 | 6.87–7.67s | 0.80s | zoom out (afasta) | power2.in (alta, pico em 1.0) | 0.63 telas/s | 64% | parallax pin spread 2.31 |

## Pistas de interpretação

- **E1** (0.00s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E2** (3.33s): movimento lateral coerente → seção de scroll horizontal pinada, slider/carrossel ou marquee
- **E3** (3.93s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E4** (6.87s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 14 em keyframes/
