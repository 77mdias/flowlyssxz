# Relógio em 3 cores — produto gira, universo de objetos explode — breakdown

- **id:** motion-77fb0284 · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** filme de produto 3D com cortes (ROI 710×994)
- **duração:** 12.1s · **formato:** 720×1280
- **resumo em uma frase:** Para cada cor do relógio: o produto entra girando e, num corte, vira uma nuvem de objetos do mesmo universo e da mesma cor (esporte laranja, viagem azul, pet rosa).

## 1. Conceito / metáfora
Cada variante é um estilo de vida: a cor troca o mundo inteiro, não só a pulseira.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.5s | relógio laranja entra girando e para de frente | rotação com power4.out | modelo girando com ease-out | certo |
| 1.6–2.7s (E1) | vira de lado e 'explode' em objetos de academia flutuando | burst | stagger de scale/posição com back.out | certo |
| 3.6–5.6s (E2) | objetos somem; relógio azul entra; fundo muda de bege para azul | troca de tema | transição de variáveis de cor | certo |
| 5.6–6.8s (E3) | explosão de objetos de viagem (overshoot) | burst back.out | idem | certo |
| 7.6–10.5s (E4–E5) | relógio rosa e objetos de pet | idem | idem | certo |

## 3. Sistema de motion extraído
- Ciclo fixo de ~4s por variante: entra (1s) → segura (1s) → explode (1s) → segura (1s).
- Overshoot (back.out) nas explosões; objetos seguem flutuando em idle.
- Fundo desfocado troca de cor junto.

## 4. Superfície visual
- Três temas: laranja/bege (`#ce8a61`, `#d8bdac`), azul (`#8188b2`, `#c5c2d8`), rosa (`#e2d9dd`).
- Objetos 3D estilizados, foscos, todos tingidos da cor do tema.
- Cenário de estúdio desfocado (prateleira com objetos).

## 5. Como reproduzir na web
**Stack:** R3F + drei (`Float`) + GSAP; tema por variáveis CSS.

1. Seletor de variante troca `data-theme` no `<html>`; cores em variáveis CSS com `transition` de 0.6s.
2. Explosão: `gsap.from(objs, {scale: 0, x: 0, y: 0, stagger: {each: .03, from: 'center'}, ease: 'back.out(1.6)'})`.
3. Idle: `<Float speed={1.5} rotationIntensity={.6}>` em cada objeto.
4. Sem 3D: PNGs recortados com o mesmo stagger funcionam.

## 6. Transferível vs. específico
- **Levar:** tema completo por variante; burst com overshoot; ciclo previsível.
- **Não levar:** o relógio e os objetos.
- **Bom para:** e-commerce com variantes, apps de consumo, planos de assinatura · **Ruim para:** marcas sóbrias

## 7. Custo
Complexidade 3/5 em 3D; 2/5 com PNGs.

## 8. Lições
- Trocar todas as cores do tema junto com o produto multiplica o impacto da variante.
- back.out é o easing da 'alegria': use só onde a marca permite.
