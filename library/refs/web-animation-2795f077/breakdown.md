# Agência de automação com IA — esfera de partículas fixa + painéis deslizantes — breakdown

- **id:** web-animation-2795f077 · **categoria:** web-animation · **fonte:** Pinterest; marca visível no vídeo: Optimind
- **tipo de vídeo:** mockup de apresentação (site em janela, ROI 590×474)
- **duração:** 9.0s · **formato:** 720×1280
- **resumo em uma frase:** UI clara e técnica onde um objeto 3D de partículas fica fixo no fundo e as seções são painéis que sobem e descem por cima dele.

## 1. Conceito / metáfora
A 'rede neural' é o personagem: ela fica sempre ali, viva, enquanto o texto ao redor muda. O site inteiro é uma moldura em volta de um único objeto.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–0.5s | hero: painel claro no topo (título + 2 botões), esfera de partículas com brilho laranja aparecendo por baixo | — | canvas WebGL fixo atrás do DOM | certo |
| 0.5–2.0s (E1) | painel do hero sobe e sai; a esfera vai para o centro e cresce; novo texto entra à esquerda | scroll | section curtain sobre canvas fixo + câmera/escala da esfera em scrub | provável |
| 2.0–3.5s | esfera gira devagar, faíscas laranja pulsam; parágrafo pequeno aparece | tempo (idle) | rotação contínua + bloom; fade-up do parágrafo | certo |
| 3.5–4.7s (E2) | painel cinza sobe de baixo e cobre a esfera; título 'Discover our services' faz fade | scroll | seção seguinte com fundo opaco deslizando sobre o canvas | certo |
| 4.7–8.5s | três cards de serviço: ícones em relevo (círculo, triângulo, losango) emergem da superfície com luz quente varrendo | scroll + tempo | ícones 'embutidos' (sombra interna/externa animada, estilo relevo) com stagger | certo |
| 8.7s (E3) | volta ao hero (loop do vídeo) | — | — | certo |

## 3. Sistema de motion extraído
- Quase tudo em scrub (linear) com suavização de smooth scroll.
- Idle: rotação lenta e pulso de brilho, nunca para.
- Entradas de texto: fade curto (~0.4s), sem deslocamento grande.
- Um único herói (a esfera) no site inteiro.

## 4. Superfície visual
- Paleta: cinzas claros (`#c4c2c3`, `#a8a3a2`), texto quase preto, acento laranja só no brilho da esfera.
- Tipografia: grotesca em caixa alta, pequena, com tracking aberto; corpo minúsculo. Visual de 'software técnico'.
- Componentes: nav com indicador luminoso no item ativo, botão pílula preto + botão pílula outline, cards com borda de 1px, raio grande e ícone em relevo com brilho âmbar.
- Layout: grid de 12 colunas com muito vazio; texto ancorado à esquerda.

## 5. Como reproduzir na web
**Stack:** Lenis + GSAP ScrollTrigger + Three.js (Points + LineSegments + bloom).

1. Canvas `position: fixed; inset: 0` atrás do conteúdo (`recipes-3d.md` §1).
2. Esfera: pontos numa icosfera com ruído + linhas ligando vizinhos (plexus); alguns pontos com cor emissiva laranja e bloom.
3. Progresso do scroll controla posição/escala da esfera (`recipes-3d.md` §2).
4. Seções com fundo opaco deslizam por cima (`recipes-scroll.md` §9).
5. Cards com `ScrollTrigger.batch`; relevo do ícone com duas `drop-shadow` (clara em cima, escura embaixo) crescendo de 0 ao valor final + gradiente âmbar passando por `mask`.

## 6. Transferível vs. específico
- **Levar:** objeto 3D fixo como fio condutor; painéis opacos como cortinas; acento de cor só no 3D.
- **Não levar:** a esfera plexus em si (clichê de IA) — troque pelo objeto do nicho.
- **Bom para:** SaaS, IA, consultoria técnica, fintech · **Ruim para:** marcas quentes/artesanais

## 7. Custo
Complexidade 3/5 · Three.js ~150KB · no mobile reduzir nº de pontos e desligar bloom.

## 8. Lições
- Um objeto vivo e fixo dá unidade a um site inteiro com pouquíssima animação de DOM.
- UI neutra + um único ponto de cor forte no 3D direciona o olhar.
