# Análise automática — source.mp4

- **Formato:** 720×1280 (portrait), 30.0 fps, 26.768s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 26.77s @ 15.0 fps
- **Cenas (cortes):** 14 — cortes em 2.6s, 4.4s, 6.333s, 8.067s, 10.533s, 12.0s, 13.0s, 14.533s, 16.467s, 18.333s, 21.467s, 21.533s, 25.0s
- **Eventos de movimento:** 17 • tela em movimento 54% do tempo • duração mediana 0.667s
- **Paleta:** tema claro (lum. 190.0), acento #2d1f55 → `#e8dfef` 34% `#d4c7e5` 31% `#b5a7d6` 15% `#9280be` 10% `#635092` 5% `#2d1f55` 2%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.40–1.87s | 0.47s | zoom in (aproxima) | power1.out (ease-out leve) (baixa, pico em 0.14) | 0.0 telas/s | 35% | — |
| E2 | 2.60–2.93s | 0.33s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.0) | 0.0 telas/s | 41% | — |
| E3 | 3.73–4.33s | 0.60s | zoom in (aproxima) | power1.in (média, pico em 1.0) | 0.0 telas/s | 49% | — |
| E4 | 4.40–4.80s | 0.40s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.0) | 0.0 telas/s | 59% | — |
| E5 | 4.87–6.27s | 1.40s | rotação | linear / none (alta, pico em 0.86) | 0.05 telas/s | 61% | — |
| E6 | 8.07–8.67s | 0.60s | zoom in (aproxima) | sine.inOut (média, pico em 0.56) | 0.0 telas/s | 45% | — |
| E7 | 10.13–10.47s | 0.33s | zoom in (aproxima) | linear / none (média, pico em 0.6) | 0.0 telas/s | 33% | — |
| E8 | 10.53–11.93s | 1.40s | rotação | power1.in (baixa, pico em 0.38) | 0.03 telas/s | 65% | — |
| E9 | 12.00–12.93s | 0.93s | rotação | power1.in (baixa, pico em 0.71) | 0.13 telas/s | 72% | — |
| E10 | 13.00–13.47s | 0.47s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.43) | 0.0 telas/s | 25% | — |
| E11 | 14.13–14.47s | 0.33s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 1.0) | 0.0 telas/s | 26% | — |
| E12 | 14.53–15.87s | 1.33s | zoom out (afasta) | power1.inOut (média, pico em 0.4) | 0.02 telas/s | 48% | — |
| E13 | 16.47–17.13s | 0.67s | translação vertical global (scroll ou pan) | power1.out (ease-out leve) (média, pico em 0.1) | 0.38 telas/s | 91% | parallax spread 0.84 |
| E14 | 17.20–18.27s | 1.07s | translação horizontal global (scroll lateral / slider / pan) | power1.in (média, pico em 0.88) | 0.43 telas/s | 89% | parallax pin spread 2.73 |
| E15 | 18.53–20.27s | 1.73s | zoom in (aproxima) | linear / none (média, pico em 0.04) | 0.01 telas/s | 60% | — |
| E16 | 20.33–21.40s | 1.07s | zoom out (afasta) | power3.inOut (baixa, pico em 0.5) | 0.02 telas/s | 56% | — |
| E17 | 21.53–22.87s | 1.33s | zoom out (afasta) | sine.inOut (média, pico em 0.25) | 0.0 telas/s | 45% | — |

## Pistas de interpretação

- **E1** (1.40s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E2** (2.60s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E3** (3.73s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E4** (4.40s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E5** (4.87s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E6** (8.07s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E7** (10.13s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E8** (10.53s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E9** (12.00s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E10** (13.00s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E11** (14.13s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E12** (14.53s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E13** (16.47s): rolagem com cauda de desaceleração → smooth scroll por lerp (Lenis, lerp≈0.08–0.12) ou inércia; regiões movendo em velocidades diferentes (spread 0.84) → PARALLAX; razões por célula indicam data-speed/yPercent
- **E14** (17.20s): movimento lateral coerente → seção de scroll horizontal pinada, slider/carrossel ou marquee
- **E15** (18.53s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E16** (20.33s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E17** (21.53s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 50 em keyframes/
