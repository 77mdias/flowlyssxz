# Baralho em hélice 3D com profundidade de campo — breakdown

- **id:** motion-3e55aa99 · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** loop 3D (1 corte)
- **duração:** 7.7s · **formato:** 720×540
- **resumo em uma frase:** Dezenas de cards ilustrados dispostos em leque/hélice giram como um baralho sendo aberto, com desfoque de profundidade e aberração cromática nas bordas.

## 1. Conceito / metáfora
Uma coleção vista como objeto físico: folhear cartas.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.9s (E1) | a pilha entra girando borrada e abre em leque | rotação + motion blur | grupo girando; cards instanciados ao longo de uma curva | certo |
| 1.9–3.3s | pausa: leque quase parado, leve respiração | idle | rotação mínima | certo |
| 3.3–3.9s (E2) | sai girando rápido para o lado | rotação acelerando | ease-in | certo |
| 3.9–5.4s (E3) | corte; entra de novo por outro ângulo, em espiral vertical | rotação | mesma cena, outra câmera | certo |
| 5.4–6.9s / 6.9–7.7s (E4) | pausa e saída em zoom-out | power2.in | — | provável |

## 3. Sistema de motion extraído
- Padrão entra rápido → segura → sai rápido (ease-out na entrada, ease-in na saída).
- Motion blur forte nos trechos rápidos.
- Câmera com lente longa e DOF raso: só o meio do leque fica nítido.

## 4. Superfície visual
- Fundo preto; cards com cores pastel (rosa, ciano, azul, creme).
- Borda fina clara nos cards, cantos arredondados; franjas RGB nas bordas do quadro.

## 5. Como reproduzir na web
**Stack:** React Three Fiber + drei + postprocessing (DepthOfField, ChromaticAberration).

1. `InstancedMesh` de planos; posição `i` ao longo de uma hélice (`angle = i * 0.25`, `y = i * 0.05`) com cada plano olhando para o eixo.
2. Rotação do grupo ligada ao scroll ou ao arraste, com inércia (`easing.damp`).
3. DOF focado no centro; aberração cromática leve.
4. Clique num card: ele sai da pilha e vai para a frente (shared element).

## 6. Transferível vs. específico
- **Levar:** coleção em hélice navegável; DOF para focar um item.
- **Não levar:** as ilustrações.
- **Bom para:** portfólio, galerias, coleções, catálogos, cards de jogo · **Ruim para:** conteúdo que precisa ser lido rápido

## 7. Custo
Complexidade 3/5 · texturas dos cards são o peso (use atlas/KTX2).

## 8. Lições
- DOF resolve o problema de 'muita coisa na tela': só um item fica nítido.
- Entra-rápido/segura/sai-rápido é um ritmo que serve para quase qualquer transição.
