# Análise automática — source.mp4

- **Formato:** 720×900 (portrait), 30.0 fps, 19.434s, áudio: não
- **Região ativa (ROI):** x=30 y=252 658×432 — 44% do quadro (provável mockup/moldura; análise feita só dentro dela, veja context.jpg)
- **Janela analisada:** 0.00s → 19.43s @ 15.0 fps
- **Cenas (cortes):** 2 — cortes em 0.933s
- **Eventos de movimento:** 14 • tela em movimento 56% do tempo • duração mediana 0.8s
- **Paleta:** tema escuro (lum. 26.7), acento — → `#130d12` 41% `#050205` 28% `#4d4649` 14% `#302328` 12% `#b5a7a4` 2% `#b10b13` 1%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.40–0.87s | 0.47s | zoom in (aproxima) | power1.out (ease-out leve) (média, pico em 0.14) | 0.0 telas/s | 65% | — |
| E2 | 3.27–3.60s | 0.33s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.8) | 0.0 telas/s | 54% | — |
| E3 | 3.67–4.07s | 0.40s | translação vertical global (scroll ou pan) | power1.out (ease-out leve) (alta, pico em 0.0) | 0.55 telas/s | 80% | parallax spread 1.09 |
| E4 | 4.13–5.07s | 0.93s | translação vertical global (scroll ou pan) | power4.out (média, pico em 0.14) | 0.4 telas/s | 57% | parallax pin spread 2.7 |
| E5 | 6.20–7.13s | 0.93s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (média, pico em 0.71) | 0.04 telas/s | 53% | — |
| E6 | 7.20–8.07s | 0.87s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (baixa, pico em 0.54) | 0.0 telas/s | 51% | — |
| E7 | 8.20–8.67s | 0.47s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (alta, pico em 0.71) | 0.0 telas/s | 50% | — |
| E8 | 8.93–9.73s | 0.80s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (alta, pico em 0.83) | 0.0 telas/s | 44% | — |
| E9 | 9.80–10.47s | 0.67s | zoom out (afasta) | power4.inOut (média, pico em 0.5) | 0.0 telas/s | 43% | — |
| E10 | 10.53–11.27s | 0.73s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (baixa, pico em 0.55) | 0.16 telas/s | 53% | — |
| E11 | 11.33–13.00s | 1.67s | rotação | power1.in (baixa, pico em 0.32) | 0.33 telas/s | 52% | parallax pin spread 6.35 |
| E12 | 13.33–14.40s | 1.07s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | sine.inOut (média, pico em 0.62) | 0.09 telas/s | 50% | — |
| E13 | 14.47–15.40s | 0.93s | translação vertical global (scroll ou pan) | sine.inOut (média, pico em 0.43) | 0.57 telas/s | 74% | parallax spread 1.45 |
| E14 | 15.67–16.47s | 0.80s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.out (ease-out leve) (média, pico em 0.17) | 0.04 telas/s | 48% | — |

## Pistas de interpretação

- **E1** (0.40s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'; passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)
- **E2** (3.27s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E3** (3.67s): rolagem com cauda de desaceleração → smooth scroll por lerp (Lenis, lerp≈0.08–0.12) ou inércia; regiões movendo em velocidades diferentes (spread 1.09) → PARALLAX; razões por célula indicam data-speed/yPercent
- **E4** (4.13s): rolagem com cauda de desaceleração → smooth scroll por lerp (Lenis, lerp≈0.08–0.12) ou inércia; regiões movendo em velocidades diferentes (spread 2.7) → PARALLAX; razões por célula indicam data-speed/yPercent; há região quase parada enquanto o resto rola → PIN/sticky (ScrollTrigger pin ou position: sticky)
- **E5** (6.20s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E6** (7.20s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E7** (8.20s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E8** (8.93s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E9** (9.80s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E10** (10.53s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E11** (11.33s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E12** (13.33s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E13** (14.47s): regiões movendo em velocidades diferentes (spread 1.45) → PARALLAX; razões por célula indicam data-speed/yPercent
- **E14** (15.67s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 38 em keyframes/
