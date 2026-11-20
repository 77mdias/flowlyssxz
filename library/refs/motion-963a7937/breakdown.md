# Carteira 3D que abre e solta cartões e moedas — breakdown

- **id:** motion-963a7937 · **categoria:** motion · **fonte:** Pinterest; marca visível: monobank
- **tipo de vídeo:** animação 3D curta de produto/ícone (ROI 644×668)
- **duração:** 4.5s · **formato:** 720×1152
- **resumo em uma frase:** Uma carteira metálica balança, abre de uma vez, os cartões sobem em leque e moedas saltam; depois a câmera afasta.

> **Cobertura da análise:** folha 1 (0–3.2s) vista; o trecho final foi lido pelos números (afasta e fecha).

## 1. Conceito / metáfora
'Tudo o que você tem, num lugar só': o ícone do produto ganha vida.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.1s | carteira fechada balança de leve (antecipação) | wiggle | rotação ±3° em loop | certo |
| 1.1–1.9s (E1) | abre num estalo; câmera aproxima; cartões sobem escalonados; moedas pulam | power3.in + burst | abertura com ease-in forte e chegada com overshoot; stagger nos cartões | certo |
| 1.9–3.5s | cartões assentam; moedas continuam caindo; leve respiração | settle | springs | certo |
| 3.5–4.1s (E2) | câmera afasta | power1.out | scale 1.2 → 1 | provável |

## 3. Sistema de motion extraído
- Antecipação → ação rápida → assentamento: os princípios clássicos em 4s.
- Eventos curtos (0.6–0.8s).
- Moedas com gravidade (queda em arco).

## 4. Superfície visual
- Fundo azul-claro chapado `#99bfd7`; carteira prata com interior roxo/azul iridescente (`#2b3ca7`, `#8e79e5`); cartões escuros.
- Estilo 3D 'ícone': formas simples, bordas arredondadas, brilho forte.

## 5. Como reproduzir na web
**Stack:** Rive (ideal: state machine com hover/click) ou R3F com GLB animado; Lottie se for linear.

1. Rive: estados `idle` (wiggle) → `open` (gatilho hover/scroll in) → `settled`.
2. Em código: timeline GSAP — `rotation` wiggle em loop; no gatilho, tampa `rotationX: -110, ease: 'power3.in'`, cartões `y: -80, stagger: .07, ease: 'back.out(2)'`.
3. Moedas: `gsap.to(coin, {keyframes: {y: [0, -120, 40], ease: 'none'}, x: random})` ou Physics2D.

## 6. Transferível vs. específico
- **Levar:** ícone-herói animado com antecipação e settle; disparo por interação.
- **Não levar:** marca e cartões.
- **Bom para:** fintech, pagamentos, carteiras digitais, onboarding · **Ruim para:** luxo silencioso

## 7. Custo
Complexidade 2/5 em Rive · arquivo pequeno · ótimo no mobile.

## 8. Lições
- Antecipação (o balanço antes de abrir) é o que faz parecer 'vivo'.
- Um ícone 3D animado pode ser o hero inteiro de uma landing de app.
