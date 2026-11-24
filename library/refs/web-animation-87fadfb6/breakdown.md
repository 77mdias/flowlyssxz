# Estúdio criativo — água-viva 3D com tipografia em anel — breakdown

- **id:** web-animation-87fadfb6 · **categoria:** web-animation · **fonte:** Pinterest; marca visível: Noomo Labs
- **tipo de vídeo:** gravação de site real (ROI 720×414)
- **duração:** 15.4s · **formato:** 720×540
- **resumo em uma frase:** Uma água-viva 3D fica no centro enquanto palavras gigantes condensadas giram em volta dela em perspectiva, passando por trás e pela frente conforme o scroll.

## 1. Conceito / metáfora
O texto orbita o personagem: tipografia tratada como objeto 3D, não como camada plana.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.3s | hero: 'NOOMO LABS' gigante atrás da água-viva, legenda pequena embaixo | — | Text 3D atrás do modelo (profundidade real) | certo |
| 1.3–2.9s (E1) | o título sai pela esquerda girando; 'DESIGN TO' entra pela direita inclinado | scroll | texto num anel/cilindro em volta do modelo; scroll gira o anel | provável |
| 3.0–9s (E2–E5) | sequência DESIGN TO → DELIGHT → INSPIRE → AND ENGAGE, sempre entrando em perspectiva e ficando de frente no centro | scroll | mesmo anel, uma palavra a cada ~1/5 de volta | certo |
| 9.2–10.4s (E6) | 'AND ENGAGE' desce e sai; água-viva aproxima | scroll | translateY do texto + dolly da câmera | certo |
| 10.5–15s | parágrafos pequenos em caixa alta alternam esquerda/direita com fade; água-viva pulsa e se move | scroll + tempo | fade por opacidade; animação do modelo (bones/shader) | certo |

## 3. Sistema de motion extraído
- Scrub contínuo: a rotação do texto acompanha o scroll com inércia.
- O modelo tem vida própria (pulso dos tentáculos) independente do scroll.
- Pequenos detritos pretos flutuando dão escala e profundidade.

## 4. Superfície visual
- Paleta: lilás muito claro `#d6d2df`/`#c6c8db`, preto `#030306`, rosa/roxo no modelo (`#b191bf`, `#826991`).
- Tipografia: grotesca **condensada bold** em caixa alta, enorme (≈ 25% da altura da tela); textos de apoio na mesma fonte, minúsculos.
- UI mínima: pílula no canto inferior esquerdo, botão circular no direito.

## 5. Como reproduzir na web
**Stack:** React Three Fiber + drei (`Text`, `useGLTF`, `useAnimations`) + scroll próprio ou Lenis.

1. Modelo GLB animado no centro (`recipes-3d.md` §3).
2. Palavras como `<Text>` (troika) posicionadas num círculo de raio R olhando para fora; um `group` gira com o progresso do scroll.
3. Deixe o depth test ligado: o texto passa naturalmente atrás e na frente do modelo.
4. Parágrafos finais em DOM por cima, com fade por faixa de progresso.

## 6. Transferível vs. específico
- **Levar:** tipografia orbitando um objeto; personagem 3D com idle próprio.
- **Não levar:** a água-viva; o tom lúdico se a marca for sóbria.
- **Bom para:** agência, portfólio, evento, produto com mascote · **Ruim para:** conteúdo denso, app logado

## 7. Custo
Complexidade 4/5 · modelo animado + fontes SDF · precisa de fallback estático no mobile fraco.

## 8. Lições
- Colocar o texto dentro da cena 3D (e não por cima) é o que cria o 'uau'.
- Uma fonte condensada aguenta palavras enormes sem estourar a largura.
