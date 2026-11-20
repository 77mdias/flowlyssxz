# Ilustrações vetoriais com glow e cortes em flash (casa, olho, espada, coroas) — breakdown

- **id:** motion-b9780bff · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** animação 2D/2.5D com cortes rápidos (9 cenas)
- **duração:** 9.4s · **formato:** 720×1278
- **resumo em uma frase:** Vinhetas ilustradas em gradiente e brilho: uma estrela de quatro pontas percorre a cena e funciona como transição entre casa noturna, casa em chamas, olho que sangra, espada e coroas.

## 1. Conceito / metáfora
Conto sombrio em símbolos; a estrela é o narrador que liga as cenas.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.4s | casa verde-água num horizonte; a estrela voa em arco deixando rastro | motion path | SVG + MotionPath, rastro com blur | certo |
| 1.4–2.3s | flashes alternando a casa calma e a casa em chamas (vermelho) | strobe de 3–4 cortes | troca de classe com `steps()` | certo |
| 2.3–3.1s (E3) | a estrela cresce até cobrir a tela e vira o brilho de um olho | zoom-through | scale enorme + troca de cena atrás | certo |
| 3.1–4.6s | olho rosa com lágrima vermelha; a estrela orbita a pupila | órbita | rotação em torno de um ponto | certo |
| 4.7–6.6s (E5–E6) | espada com faixa de luz descendo; mãos seguram o cabo; chão racha | zoom-out + light sweep | máscara de gradiente deslizando | certo |
| 7–9.3s | coroas vermelhas 3D girando sobre verde-escuro; a última cresce (E7) | 3D simples | SVG/CSS 3D ou sprites | provável |

## 3. Sistema de motion extraído
- Cortes muito rápidos (até 5 em 1s) intercalados com planos de ~2s.
- Animação 'em passos' (parece 12fps) nos elementos ilustrados.
- Easing: saídas com ease-in, chegadas com power3.out.

## 4. Superfície visual
- Paletas por cena: azul-noite + verde-água; vermelho + creme; preto + rosa-néon; roxo + laranja; verde-escuro + coral.
- Formas chapadas com gradiente interno e **glow** forte; grão leve.
- Estrela de quatro pontas como elemento recorrente.

## 5. Como reproduzir na web
**Stack:** SVG + GSAP (MotionPath, MorphSVG) ou Rive; glow com `filter: blur` em cópia do elemento.

1. Glow: duplicar a forma, `filter: blur(20px)`, `mix-blend-mode: screen`.
2. Estrela-transição: `gsap.to(star, {scale: 40, duration: .5, ease: 'power2.in', onComplete: trocarCena})`.
3. Strobe: `gsap.set` alternando cenas com `repeat: 3, repeatDelay: .08`.
4. Look 12fps: `ease: 'steps(6)'` nos tweens de personagem.
5. Light sweep: `linear-gradient` como `mask-image` com `mask-position` animado.

## 6. Transferível vs. específico
- **Levar:** um símbolo que vira transição entre cenas; glow vetorial; ritmo com flashes.
- **Não levar:** a iconografia sombria fora de contexto.
- **Bom para:** jogos, editorial, eventos, storytelling de marca · **Ruim para:** B2B, saúde, finanças

## 7. Custo
Complexidade 3/5 · leve · flashes exigem versão sem estrobo para reduced motion.

## 8. Lições
- Um elemento recorrente (a estrela) costura cenas totalmente diferentes.
- Estética 2D com glow é barata de rodar e tem muita personalidade.
