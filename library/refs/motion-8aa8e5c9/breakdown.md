# Celular em leque de cores → giro completo (loop) — breakdown

- **id:** motion-8aa8e5c9 · **categoria:** motion · **fonte:** Pinterest; produto visível: iPhone
- **tipo de vídeo:** loop de produto 3D em fundo branco (ROI 634×526)
- **duração:** 8.0s · **formato:** 720×648
- **resumo em uma frase:** Cinco aparelhos empilhados em leque se fecham num só, que gira mostrando frente, lateral e traseira, e reabre o leque.

## 1. Conceito / metáfora
Variedade → unidade → variedade.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.1s | leque de 5 cores parado | — | cópias do modelo com `rotation.z` escalonada | certo |
| 1.1–4.0s (E1) | leque fecha; aparelho gira para a frente (tela) e sobe até close | rotação contínua sine.inOut ~2.9s | rotação do modelo ligada ao scroll (scrub) | certo |
| 4.0–5.4s | pausa de frente | hold | — | certo |
| 5.4–7.4s (E2) | gira para a traseira, afasta e o leque reabre | rotação + zoom-out | reverso | certo |

## 3. Sistema de motion extraído
- Dois movimentos longos (2–3s) com pausa no meio; easing inOut.
- Leque abre com stagger angular.

## 4. Superfície visual
- Fundo branco puro; produto em grafite; cores pastel só nas cópias (lilás, azul, verde, branco).
- Sombra de contato quase nula; fade do produto para o branco na base.

## 5. Como reproduzir na web
**Stack:** R3F com GLB, ou sequência de imagens (`recipes-scroll.md` §13).

1. Leque: `copies.map((c, i) => gsap.to(c.rotation, {z: i * 0.18, ease: 'power3.out'}))` com pivô numa extremidade.
2. Giro: `rotation.y` de 0 a `Math.PI * 2` em scrub numa seção pinada.
3. Pausas: labels na timeline com `snap`.

## 6. Transferível vs. específico
- **Levar:** leque para mostrar variantes; giro com paradas nos ângulos-chave.
- **Não levar:** o produto.
- **Bom para:** hardware, produto físico com cores · **Ruim para:** serviços

## 7. Custo
Complexidade 2/5 com sequência de imagens; 3/5 em 3D.

## 8. Lições
- Fundo branco + um objeto bem iluminado nunca envelhece.
- Pausar nos ângulos-chave dá tempo de leitura.
