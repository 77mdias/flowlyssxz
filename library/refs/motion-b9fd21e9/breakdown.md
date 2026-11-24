# Bikes em blueprint — troca de modelo, wireframe e HUD técnico — breakdown

- **id:** motion-b9fd21e9 · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** filme 3D curto com cortes
- **duração:** 4.6s · **formato:** 720×960
- **resumo em uma frase:** Uma bike sobre painel em gradiente vermelho vira cena de estúdio preto e branco, troca de modelo várias vezes na mesma pose, dissolve em wireframe/pontos com texto de código e volta ao painel vermelho.

## 1. Conceito / metáfora
Do catálogo ao projeto: o produto visto como dado de engenharia.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–0.8s (E1) | bike sobre painel vermelho-rosa em perspectiva; zoom rápido | power2.inOut | scale + painel com `perspective` | certo |
| 0.9–3.1s (E2–E3) | estúdio P&B com grade; a bike troca de modelo a cada ~0.3s (MTB, speed, urbana), às vezes em vermelho; fantasmas de wireframe à direita | model swap | troca de `visible` entre GLBs / crossfade de imagens na mesma pose | certo |
| 3.2–4.0s (E4) | close em wireframe e partículas; linhas de código e contadores | wireframe + points | material wireframe + overlay mono | certo |
| 4.0–4.5s (E5) | afasta e volta ao painel vermelho (loop) | zoom-out | reverso | certo |

## 3. Sistema de motion extraído
- Muito rápido: tudo em 4.6s, trocas a cada 0.2–0.4s.
- Área em movimento alta (65–80%): a câmera nunca para.
- Estrutura A–B–A (cor → técnico → cor).

## 4. Superfície visual
- Paleta: preto `#070507`, cinzas, vermelho `#a51218` e coral `#f86665` como acento.
- Linhas de construção finas (círculos, eixos), rótulos mono minúsculos, número de série no topo.
- Painel em gradiente como 'palco' do produto.

## 5. Como reproduzir na web
**Stack:** R3F (GLBs + material wireframe) + overlay SVG; ou imagens renderizadas + CSS.

1. Mesma câmera e pose para todos os modelos; troque com `gsap.set(models, {visible: false})` + `visible: true` no atual, em intervalo curto.
2. Wireframe: `material.wireframe = true` ou `EdgesGeometry` + `Points` nos vértices.
3. HUD: SVG com círculos/linhas (`stroke-dashoffset` desenhando) e texto mono digitando.
4. Painel: `div` com gradiente e `transform: perspective() rotateY()`.

## 6. Transferível vs. específico
- **Levar:** troca rápida de variantes na mesma pose; modo 'blueprint'; HUD de linhas finas.
- **Não levar:** as bikes.
- **Bom para:** produto técnico, configuradores, automotivo, esportes · **Ruim para:** marcas suaves

## 7. Custo
Complexidade 3/5 · vários GLBs pesam (carregar sob demanda).

## 8. Lições
- Manter a pose fixa e trocar só o objeto faz o olho comparar variantes.
- Linhas técnicas + fonte mono dão credibilidade de engenharia.
