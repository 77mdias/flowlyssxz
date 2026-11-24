# VPN dark — eclipse luminoso e seções em crossfade — breakdown

- **id:** web-animation-ab8f2399 · **categoria:** web-animation · **fonte:** Pinterest; marca visível: ArgusVPN
- **tipo de vídeo:** gravação de site real (tela cheia, sem moldura)
- **duração:** 20.0s · **formato:** 720×450
- **resumo em uma frase:** Site azul-marinho quase preto em que cada seção é uma 'cena' centrada num objeto luminoso (arco, orbe, eclipse, globo) e a troca de seção é um fade, não uma rolagem.

## 1. Conceito / metáfora
Luz no escuro = proteção. Cada benefício é um corpo celeste diferente.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.5s | intro: um arco de luz cresce até virar um anel enorme; as letras A R G U S surgem espaçadas | load | scale + glow (blur) no anel; letras com fade/blur e stagger | certo |
| 1.5–4.3s | hero completo: nav, subtítulo, botão pílula branco; um brilho percorre o anel | tempo | loop de luz girando (conic-gradient ou shader) | provável |
| 4.3–6.5s (E2) | hero some para cima; entra painel 'Fast. Reliable. Safe.' com celular e cronômetro contando | scroll | fade-through + contador | certo |
| 7–8.3s (E3) | painel sai; orbe de vidro 'Data Protection' com cometa dentro; mini-cards embaixo | scroll | crossfade de seções pinadas | certo |
| 10–13.5s (E4) | eclipse 'Completely anonymous' + fileira de 5 ícones | scroll | crossfade + glow radial | certo |
| 14–17s (E5) | globo de pontos com rótulos '50' e '40' ligados por linhas | scroll | Points em esfera + labels DOM | certo |
| 17.6–20s (E6) | CTA final: pergunta, botão, celular subindo sobre horizonte em grade | scroll | fade + translateY; grade em perspectiva CSS | certo |

## 3. Sistema de motion extraído
- Trocas de seção por opacidade (~0.4–0.6s), quase sem deslocamento: a tela 'respira'.
- Eventos curtos e locais (área 11–28%): o fundo fica parado, só o objeto central muda.
- Glows pulsam devagar em idle.

## 4. Superfície visual
- Paleta: `#000015` (fundo), `#070638`, `#141368`, azul elétrico `#201daf`, lilás `#6d5fb3`, texto `#d0c8e4`.
- Tipografia: sans geométrica leve; logotipo com letras muito espaçadas; títulos de seção pequenos e centrados.
- Componentes: nav fina com botão pílula branco, botão pílula branco principal, cards de vidro escuro com borda sutil, labels numéricos com linha e ponto.
- Efeitos: glow radial, lens flare, grade em perspectiva no rodapé.

## 5. Como reproduzir na web
**Stack:** GSAP (ScrollTrigger com pin, ou Observer para trocar de cena) + CSS para glows; Three.js só para o globo.

1. Seções empilhadas em `position: fixed`; uma timeline por transição faz `autoAlpha` 1→0 na atual e 0→1 na próxima (scrub ou snap).
2. Anel/eclipse: `border-radius: 50%` + `box-shadow` em camadas + `filter: blur()`; brilho giratório com `conic-gradient` animado.
3. Globo: `THREE.Points` com pontos em lat/long filtrados por máscara de continentes.
4. Contador: `recipes-scroll.md` (counter com `snap`).
5. Grade do rodapé: `transform: perspective(600px) rotateX(60deg)` num `background-image` de linhas.

## 6. Transferível vs. específico
- **Levar:** cena por benefício com um objeto central; crossfade em vez de scroll; glow feito em CSS.
- **Não levar:** a paleta azul-néon inteira (muito 'cripto').
- **Bom para:** segurança, SaaS, fintech, IA · **Ruim para:** marcas claras e acolhedoras

## 7. Custo
Complexidade 3/5 · leve se os glows forem CSS · cuidado com `blur` grande no mobile.

## 8. Lições
- Trocar seções por fade transforma o site numa apresentação, mas exige pouco texto por tela.
- Dá para fazer muito 'efeito espacial' só com gradiente radial e blur.
