# Análise automática — source.mp4

- **Formato:** 700×880 (portrait), 25.0 fps, 26.774s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 26.77s @ 15.0 fps
- **Cenas (cortes):** 4 — cortes em 1.867s, 22.867s, 24.8s
- **Eventos de movimento:** 13 • tela em movimento 48% do tempo • duração mediana 0.867s
- **Paleta:** tema claro (lum. 176.4), acento #2796f6 → `#dad8da` 44% `#b4b2b5` 36% `#010001` 7% `#2796f6` 5% `#d88d55` 4% `#6d4c45` 2%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 1.40–1.80s | 0.40s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.67) | 0.0 telas/s | 23% | — |
| E2 | 1.87–3.53s | 1.67s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.out (ease-out leve) (média, pico em 0.24) | 0.04 telas/s | 82% | — |
| E3 | 3.60–5.13s | 1.53s | rotação | power3.in (baixa, pico em 0.96) | 0.04 telas/s | 65% | — |
| E4 | 7.00–7.73s | 0.73s | local (elemento animando numa parte da tela) | sine.inOut (média, pico em 0.55) | 0.0 telas/s | 14% | — |
| E5 | 9.20–10.13s | 0.93s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.29) | 0.0 telas/s | 16% | — |
| E6 | 12.07–12.73s | 0.67s | local (elemento animando numa parte da tela) | sine.inOut (alta, pico em 0.6) | 0.0 telas/s | 15% | — |
| E7 | 14.67–15.93s | 1.27s | local (elemento animando numa parte da tela) | sine.inOut (média, pico em 0.53) | 0.0 telas/s | 20% | — |
| E8 | 17.27–18.13s | 0.87s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.31) | 0.0 telas/s | 18% | — |
| E9 | 18.20–18.73s | 0.53s | zoom out (afasta) | power4.out (alta, pico em 0.0) | 0.02 telas/s | 72% | — |
| E10 | 18.80–19.53s | 0.73s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (baixa, pico em 0.09) | 0.03 telas/s | 78% | — |
| E11 | 19.60–21.33s | 1.73s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | linear / none (média, pico em 0.38) | 0.03 telas/s | 73% | — |
| E12 | 21.40–22.80s | 1.40s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.in (média, pico em 0.9) | 0.03 telas/s | 74% | — |
| E13 | 24.27–24.73s | 0.47s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.in (média, pico em 1.0) | 0.0 telas/s | 23% | — |

## Pistas de interpretação

- **E1** (1.40s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E2** (1.87s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E3** (3.60s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E4** (7.00s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E5** (9.20s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E6** (12.07s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E7** (14.67s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E8** (17.27s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E9** (18.20s): zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'
- **E10** (18.80s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E11** (19.60s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E12** (21.40s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E13** (24.27s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 40 em keyframes/
