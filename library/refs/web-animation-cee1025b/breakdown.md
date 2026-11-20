# Landing de produto minimalista — palavras gigantes cortadas + parallax de renders — breakdown

- **id:** web-animation-cee1025b · **categoria:** web-animation · **fonte:** Pinterest; produto visível: carregador 'mushroom' (conceito para Kickstarter)
- **tipo de vídeo:** mockup/gravação de site (ROI 606×342), em loop
- **duração:** 14.5s · **formato:** 720×540
- **resumo em uma frase:** Fundo branco, uma palavra preta gigante por seção (mushroom, concept, preorder) cortada pelas bordas, e renders do produto flutuando em velocidades diferentes.

## 1. Conceito / metáfora
A palavra é a arquitetura da página: cada seção é 'batizada' por um título do tamanho da tela.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.9s (E1) | 'mushroom' sobe e sai cortada pelo topo; os 5 carregadores empilhados sobem em velocidades diferentes; 'concept' entra por baixo | scroll | parallax de camadas (spread 2.0 medido) | certo |
| 3.2–4.8s (E2) | 'concept' sai com as letras fatiadas; entra o produto aberto (vista explodida) com specs | scroll | máscara por faixas nas letras + parallax (spread 1.2) | provável |
| 5.7–8.4s (E3) | faixa de fotos escuras com o celular sobre o carregador passa; 'preorder' entra com o preço caindo ($148 → $129) | scroll | região pinada (pin detectado) + **contador ligado ao scroll** | certo |
| 9.6–10.5s (E4) | tudo some; logotipo pequeno 'mushroom' se monta no centro | loop/intro | letras montando por máscara | certo |
| 12.1–13.4s (E5) | logotipo cresce até o tamanho gigante e os produtos entram por cima | intro | scale do título + entrada em stagger, ease expo.out | provável |

## 3. Sistema de motion extraído
- Scroll em scrub com parallax forte: título anda mais devagar que os renders.
- Transição de letras por fatias horizontais (efeito 'persiana').
- Intro: logo pequeno → gigante com expo.out.

## 4. Superfície visual
- Paleta: branco `#f6f4f6`, preto `#201f22`, e as cores do produto como único acento (terracota `#9c725a`, azul-acinzentado, verde-escuro).
- Tipografia: grotesca **bold em caixa baixa**, gigante (ocupa 100% da largura); corpo pequeno com entrelinha generosa.
- Componentes: botão retangular outline pequeno com seta, preço com cifrão sobrescrito, lista de specs em colunas, ilustrações em traço fino.
- Layout: coluna de texto estreita à esquerda, produto à direita, tudo sangrando as bordas.

## 5. Como reproduzir na web
**Stack:** Lenis + GSAP ScrollTrigger (sem WebGL: os produtos são imagens PNG/WebP renderizadas).

1. Título: `font-size: 24vw; line-height: .8; white-space: nowrap` dentro de seção com `overflow: clip`.
2. Parallax: `recipes-scroll.md` §5 com `data-speed` 0.6 no título e 1.2–1.6 nos renders.
3. Letras fatiadas: duplicar o texto em N faixas com `clip-path: inset()` e deslocar cada faixa com stagger.
4. Preço: tween de `{v:148}` até 129 com `snap: 1` e `scrub`.
5. Intro: `gsap.from(titulo, {scale: .12, duration: 1.4, ease: 'expo.out'})`.

## 6. Transferível vs. específico
- **Levar:** palavra-título gigante por seção; renders em parallax; preço/numero animado pelo scroll.
- **Não levar:** o produto e os nomes.
- **Bom para:** produto físico, hardware, pré-venda, portfólio de produto · **Ruim para:** serviços sem imagem forte

## 7. Custo
Complexidade 2/5 · leve · funciona bem no mobile com parallax reduzido.

## 8. Lições
- Dá para fazer um site memorável só com tipografia gigante + boas imagens recortadas.
- Número que muda com o scroll cria urgência sem pop-up.
