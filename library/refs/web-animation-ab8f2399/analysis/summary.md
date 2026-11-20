# Análise automática — source.mp4

- **Formato:** 720×450 (landscape), 30.0 fps, 20.034s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 20.03s @ 15.0 fps
- **Cenas (cortes):** 2 — cortes em 0.067s
- **Eventos de movimento:** 6 • tela em movimento 25% do tempo • duração mediana 0.433s
- **Paleta:** tema escuro (lum. 12.4), acento #201daf → `#000015` 71% `#070638` 14% `#141368` 7% `#201daf` 3% `#6d5fb3` 2% `#d0c8e4` 1%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 0.13–0.47s | 0.33s | local (elemento animando numa parte da tela) | linear / none (alta, pico em 0.6) | 0.0 telas/s | 11% | — |
| E2 | 4.27–6.47s | 2.20s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.out (ease-out leve) (alta, pico em 0.12) | 0.0 telas/s | 28% | — |
| E3 | 7.00–8.27s | 1.27s | rotação | power2.inOut (baixa, pico em 0.37) | 0.0 telas/s | 27% | — |
| E4 | 10.00–10.27s | 0.27s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.25) | 0.0 telas/s | 17% | — |
| E5 | 13.87–14.27s | 0.40s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.5) | 0.0 telas/s | 18% | — |
| E6 | 17.60–18.07s | 0.47s | local (elemento animando numa parte da tela) | linear / none (média, pico em 0.57) | 0.0 telas/s | 11% | — |

## Pistas de interpretação

- **E1** (0.13s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E2** (4.27s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto; longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)
- **E3** (7.00s): rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS
- **E4** (10.00s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E5** (13.87s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale
- **E6** (17.60s): animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 20 em keyframes/
