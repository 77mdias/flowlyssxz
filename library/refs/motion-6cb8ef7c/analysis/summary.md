# Análise automática — source.mp4

- **Formato:** 612×1088 (portrait), 30.0 fps, 15.915s, áudio: sim
- **Região ativa:** quadro inteiro
- **Janela analisada:** 0.00s → 15.91s @ 15.0 fps
- **Cenas (cortes):** 1 — cortes em nenhum
- **Eventos de movimento:** 2 • tela em movimento 13% do tempo • duração mediana 1.067s
- **Paleta:** tema médio (lum. 160.9), acento — → `#b7b6b8` 58% `#a3a19e` 14% `#79766f` 8% `#494440` 7% `#d0cccd` 7% `#1c1713` 3%

> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário
> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).

## Eventos

| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |
|---|---|---|---|---|---|---|---|
| E1 | 10.20–11.20s | 1.00s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.out (ease-out leve) (baixa, pico em 0.0) | 0.07 telas/s | 77% | — |
| E2 | 11.27–12.40s | 1.13s | complexo / múltiplos movimentos (provável 3D, morph ou transição) | power1.in (baixa, pico em 1.0) | 0.02 telas/s | 77% | — |

## Pistas de interpretação

- **E1** (10.20s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto
- **E2** (11.27s): movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto

## Arquivos

- Folhas de contato: sheet_01.jpg, sheet_02.jpg
- Gráfico: timeline.png • Mapa de calor: heatmap.png
- Keyframes: 7 em keyframes/
