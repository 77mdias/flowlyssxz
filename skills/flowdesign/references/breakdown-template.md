# Template de breakdown

Copie para `library/refs/<id>/breakdown.md`. Seja específico: números, nomes de técnica, grau de certeza.

```md
# <Título curto descritivo> — breakdown

- **id:** <id> · **categoria:** <cat> · **fonte:** <url ou "Pinterest, sem fonte">
- **tipo de vídeo:** gravação real | mockup | conceito | reel | compilação
- **duração:** Xs · **formato:** WxH · **ROI:** sim/não
- **resumo em uma frase:** o que essa peça faz e por que funciona.

## 1. Conceito / metáfora
O que o motion encena. (Ex.: "o carro é montado peça por peça conforme você rola".)

## 2. Linha do tempo
| t | evento | gatilho | técnica | duração | easing | stagger/offset | certeza |
|---|---|---|---|---|---|---|---|
| 0.4s | hero sai, título se dissolve | scroll | clip + opacity scrub | — (scrub) | none | — | provável |

## 3. Sistema de motion extraído
- Durações: …  · Easings: …  · Distâncias: …  · Stagger: …
- Smooth scroll: sim (lerp ~0.1) / não
- Ritmo geral: (calmo, cinematográfico, nervoso…)

## 4. Camadas e profundidade
Parallax (razões aproximadas), pins, 2.5D vs. 3D real, o que fica fixo.

## 5. Superfície visual
- Paleta: (hex) · tema · acento
- Tipografia: classificação (ex.: serifa didone condensada + grotesca), escalas
- Layout/grid: …
- Textura/efeitos: grão, blur, sombras, etc.

## 6. Stack provável
Ex.: Lenis + GSAP ScrollTrigger + SplitText; WebGL? (sim/não, por quê). Alternativas equivalentes.

## 7. Receita de implementação
Passos e trechos de código-chave para cada efeito principal (curto, adaptável).

## 8. Transferível vs. específico
- **Levar:** técnicas e ritmos reaproveitáveis.
- **Não levar:** o que é identidade da marca original.
- **Bom para nichos:** … · **Ruim para:** …

## 9. Custo
Complexidade (1–5) · peso estimado · riscos mobile · acessibilidade (reduced motion, foco, leitura).

## 10. Lições
2–4 bullets do que essa referência ensina sobre motion design.
```
