# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 30.0 fps, 9.0s, áudio: sim
- **Região ativa (ROI):** x=44 y=402 590×474 — 30% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 9.00s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 3 • tela em movimento 32% do tempo • duração mediana 1.2s
- **Paleta:** tema médio (lum. 163.6), acento — → `#c4c2c3` 52% `#696463` 16% `#898482` 14% `#a8a3a2` 9% `#4f433d` 3% `#dcd6d1` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.53–2.00s | 1.47s | rotação | power1.in (baixa, pico em 0.45) | 0.0 telas/s | 34% | — |
| E2 | 3.53–4.73s | 1.20s | rotação | power1.out (ease-out leve) (baixa, pico em 0.22) | 0.0 telas/s | 24% | — |
| E3 | 8.73–8.93s | 0.20s | zoom in (aproxima) | power3.out (média, pico em 0.0) | 0.0 telas/s | 24% | — |

## Pistas de interpretação

- **E1** (0.53s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E2** (3.53s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E3** (8.73s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic); muito curto (<250ms) → micro-interação/feedback

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 10 em keyframes/
