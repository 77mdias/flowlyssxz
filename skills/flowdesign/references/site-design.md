# Modo BRAND SYSTEM — de uma URL para o design system e o branding completos

O usuário manda uma URL (ou aponta uma captura) e quer **o manual inteiro daquele site**: marca, cor, tipografia,
layout, componentes com estados, **catálogo de animações**, bibliotecas e ferramentas usadas, e como reconstruir.

Diferença para o modo DESIGN SYSTEM (vídeo): aqui nada é estimado por pixel. O site roda de verdade num navegador
com uma sonda instalada, e o código-fonte está no disco. O resultado é **medido**, e o que for interpretação sua
(nomes de papéis, princípios, personalidade da marca) precisa aparecer como interpretação.

Entrega em `design-systems/<marca>-design-system/`:

| arquivo | o que é |
|---|---|
| `DESIGN.md` | o manual completo (você escreve; estrutura abaixo) |
| `tokens.json` | fonte única da verdade (você escreve) |
| `tokens.css` · `tailwind-theme.css` · `motion.ts` | gerados por `ds_build.py` |
| `preview.html` | página-espécime: marca, cores (com tema escuro), tipos, componentes, animações clicáveis, stack |
| `assets/` | logo, favicon, 6–10 telas e recortes de componentes citados no DESIGN.md |

## Passo a passo

1. **Capturar** (se ainda não houver captura): `node skills/flowdesign/scripts/capture_site.mjs URL`
   → `captures/<domínio>_<página>/`. Sem captura também funciona (`site_design.mjs URL`), mas você perde o
   código-fonte no disco, o `tech.json` e os arquivos de marca. Prefira capturar.
2. **Medir:** `node skills/flowdesign/scripts/site_design.mjs captures/<pasta>` → `captures/<pasta>/design/`
   - `summary.md` — leia inteiro; é o resumo de tudo
   - `site-raw.json` — dados completos (consulte quando o resumo cortar uma lista)
   - `screens/` — telas desktop distribuídas pela página (com a posição de rolagem), intro/loader, mobile, tema alternativo
   - `components/` — recorte de cada botão, link, campo e card, em repouso e com hover
   - `brand/` — logo (png do que está na tela, svg quando é inline, arquivo original), favicon, imagem social
3. **Olhar** (obrigatório, com a ferramenta de leitura de imagem): todas as telas desktop (em site de cenas cada tela é
   uma cena diferente), a intro, 2–3 telas mobile, o tema alternativo, a logo e os recortes com hover.
   Número sem olho gera manual errado.
4. **Ler o código** listado em "Arquivos para ler" do resumo: o CSS principal (tokens, comentários do autor,
   media queries) e os JS próprios (o que dispara cada animação). Ignore bibliotecas de terceiros.
   A sonda mostra *o que aconteceu*; o código mostra *por quê* e os parâmetros que não apareceram na medição.
5. **Escrever `tokens.json`** (formato em `design-system.md` + extensões abaixo).
6. **Gerar:** `python3 skills/flowdesign/scripts/ds_build.py design-systems/<marca>-design-system/tokens.json`
7. **Conferir:** abra `preview.html`, tire um print e compare com as telas. Mesmas cores? Mesma proporção
   de título? Botão igual ao recorte? As demonstrações de animação lembram o site? Ajuste e gere de novo.
8. **Escrever `DESIGN.md`** e copiar para `assets/` só as imagens que o documento cita.

## Como ler o resumo (o que cada sinal significa)

O extrator espera a intro terminar, rola a página inteira com a roda do mouse (é o que dispara Lenis, ScrollTrigger e
reveals) e lê o que está visível a cada ~0,85 tela. Textos e componentes do resumo são a soma de todas as paradas.

| Sinal no `summary.md` | Interpretação |
|---|---|
| "Como a página se comporta" → intro de N s | há loader/intro que trava a rolagem: documente como parte da marca (veja `desktop_intro.jpg` e a timeline de carga) |
| "X% da rolagem são trechos presos (pin)" | site de cenas: a rolagem conduz animações com a tela parada. O mapa de rolagem do GSAP é o roteiro da página |
| "a rolagem parou em N px" | o extrator não passou dali: o que vem depois **não foi medido**. Diga isso no DESIGN.md |
| Variáveis CSS em `:root` | o sistema de tokens **do autor**: use os nomes e valores dele como base |
| Bloco de variáveis em `[data-theme=…]`, `.dark` ou `prefers-color-scheme` | tema alternativo: vira `theme` no tokens.json |
| Escala real → coluna "CSS do autor" | o valor que o autor escreveu (`2vw`, `clamp(…)`, `1.2rem`). **É ele que vai para o token**; o px é só o resultado em 1440. "herdado de X" = o tamanho vem do pai |
| "interpolação sugerida" | só aparece quando o autor usou valores fixos diferentes em desktop e mobile: é uma proposta sua, marque como tal |
| "pesos usados … sem arquivo" | o site pede um peso que não carregou: o navegador falsifica o negrito. Registre como defeito e carregue o peso certo ao reconstruir |
| "só contorno 1px …" na cor do texto | texto vazado (`-webkit-text-stroke`) |
| Componentes → `← font-size 0.8vw · padding 1.2vw` | medidas escritas pelo autor: use-as no componente do tokens.json |
| Componentes → "hover: a → b" | diferença real de estilo entre repouso e hover, no elemento e nos filhos; oscilações de animação contínua já foram descontadas |
| Componentes → "GSAP `alvo` 0.4s power2.out {…}" no hover | o hover é feito por JavaScript (botão magnético, cursor): não existe em CSS |
| Componentes → "foco: anel padrão do navegador" / "nenhuma mudança visível" | o site não desenhou o foco: é lacuna de acessibilidade, não estilo |
| GSAP — mapa de rolagem | cada ScrollTrigger com px de início e fim, `scrub`, `pin`. "1 s = N px" converte tempo de timeline em rolagem |
| GSAP — timelines | os tweens **na ordem**, com início em segundos e a faixa de rolagem em px de cada um, ease real e valores. `set` = duração 0 |
| "calculado no 1º alvo: x 0 → -400px" | o valor era função ou relativo (`+=`); o número é o que o GSAP calculou para o primeiro elemento |
| ease "personalizada [f(.25)=… ]" | curva própria (CustomEase ou função): os três pontos descrevem o formato; procure a definição no código |
| GSAP "não exposto como global" + muitos elementos animados por JS | a biblioteca está dentro do bundle: procure `scrollTrigger`, `.to(`, `ease:` no JS da lista de leitura |
| Tweens soltos "repetido N× com outros valores" | segue o ponteiro ou a rolagem (cursor, tilt, inércia) |
| Lenis → "opções passadas" | a configuração exata da rolagem suave (duration, easing, multiplicadores) |
| Animações CSS na fase "carga" | entrada com `@keyframes` ou transição: duração, atrasos (escada) e easing são exatos |
| Classe que entra durante a rolagem (`is-in`, `visible`…) + regra com transição | reveal por IntersectionObserver ou por callback: a classe liga um estado, a transição faz o movimento |
| IntersectionObserver com `rootMargin` e `threshold` | o gatilho exato do reveal (ex.: `-12%` embaixo = dispara um pouco depois de entrar) |
| Elementos com style inline reescrito → "outro JS" | animação por JS próprio (rAF, parallax de mouse). A faixa de Y diz onde na página ela acontece |
| `position: sticky` + bloco muito alto + canvas | cena presa com progresso de rolagem feito em CSS (sem ScrollTrigger) |
| requestAnimationFrame em repouso ≈ N laços | há render contínuo (ticker, smooth scroll, canvas): custo de bateria, registre |
| Telas → "ST#2 39%" | em que ponto de qual ScrollTrigger a tela foi tirada: use para ligar imagem e timeline |

Limites da medição (diga no DESIGN.md quando afetarem algo):
- só entra o que aconteceu em carga, rolagem, hover e foco: menus abertos, modais, formulários com erro e outras páginas não;
- o que só aparece depois de um clique (modal de projeto, "entrar no site") não é exercitado; os estilos estão no CSS, leia lá;
- site com rolagem virtual (sem altura real) é percorrido por passos de roda: as posições não são pixels;
- animações por JS sem GSAP global não têm curva lida (leia no código); shaders e cenas 3D são descritos pelo código e pelas telas;
- "CSS do autor" é a regra vencedora por especificidade e ordem, aproximada: `@layer` e seletores muito exóticos podem enganar;
- em máquina sem GPU a medição é lenta em páginas com WebGL (minutos); use `--headed` na sua máquina.

## Extensões do tokens.json para este modo

Além dos grupos de `design-system.md` (`meta`, `color`, `font`, `text`, `space`, `radius`, `shadow`, `border`,
`layout`, `motion`, `component`):

```json
{
  "brand": {
    "logo": "assets/logo.svg",
    "tagline": "frase do próprio site",
    "essence": "2–3 frases: o que a marca é e como o visual sustenta isso",
    "personality": ["adjetivo + evidência visual", "…"],
    "voice": ["regra de escrita + exemplo real do site", "…"],
    "imagery": ["como fotos, ilustrações, 3D e ícones são tratados", "…"],
    "dont": ["o que quebraria a marca", "…"]
  },
  "theme": {
    "dark": { "selector": "[data-theme=\"dark\"]", "color": { "bg": "#16141A", "text": "#F5F1EA" }, "shadow": { } }
  },
  "stack": [
    { "name": "Three.js", "version": "r186", "role": "cena 3D do aparelho", "evidence": "tech.json + import em duo.js" }
  ],
  "animation": [
    {
      "name": "reveal", "kind": "scroll · CSS + IntersectionObserver",
      "what": "o que o usuário vê e o que isso comunica",
      "trigger": "IntersectionObserver rootMargin 0 0 -12% 0, threshold .08",
      "target": ".reveal", "duration": "620ms", "ease": "{motion.ease.out}", "delay": "--d: 0 / 90 / 180ms",
      "tool": "CSS transition", "source": "styles.css .reveal + main.js",
      "keyframes": "@keyframes ds-reveal { from { opacity: 0; transform: translateY(26px) } to { opacity: 1; transform: none } }",
      "demo": "ds-reveal 620ms {motion.ease.out} both",
      "code": "trecho mínimo para reimplementar (CSS/JS)"
    }
  ],
  "breakpoint": { "sm": "420px", "md": "720px" },
  "gradient": { "sheen": "linear-gradient(…)" }
}
```

- `theme.<nome>.color` usa **as mesmas chaves** de `color`; só liste o que muda. Vira um bloco CSS no seletor do tema
  e um botão "alternar tema" no preview (seletores `[atributo="valor"]` e `.classe`).
- `animation[].keyframes` é escrito em `tokens.css` (prefixe os nomes com `ds-` para não colidir). `demo` é o valor de
  `animation` aplicado a um bloco no preview; clique repete. Animações que dependem de rolagem ou 3D ficam sem `demo`:
  descreva e ponha o `code`.
- `meta.kind: "Design system medido no site"` troca o cabeçalho do preview (o padrão é "reconstruído", da rota de vídeo).
- Qualquer grupo novo com pares chave→valor (`breakpoint`, `gradient`, `z`, `size`…) vira `--<grupo>-<chave>`.
- Valores aceitam referências `{grupo.chave}` como no resto do arquivo.

**Regras de decisão específicas**

- **Nomes:** mantenha uma ponte entre os tokens do autor e os papéis do sistema. `color.bg` com `note: "--c-page no site"`.
  Quem for estudar o código original precisa achar a correspondência.
- **Cor:** papéis vêm do uso real (tabela "Cores em uso" + variáveis). Cores que só existem dentro de fotos/3D não viram token.
  Cores de fundo de cards muito próximas entre si (variações de 1–2%) são uma decisão do autor: registre como família
  (`surface-1…n`) em vez de fundir.
- **Tipografia:** a família é a real (`@font-face`). Registre pesos carregados × pesos usados; peso carregado sem uso é custo.
  Fonte paga/proprietária: registre o nome real e uma substituta aberta para uso próprio.
- **Motion:** os tokens são os do autor quando existem (`--e-out`, `--t-slow`). Se não existem, agrupe as durações e
  curvas observadas em 3–5 degraus e diga que o agrupamento é seu.
- **Componentes:** estado de hover = o medido. Foco e ativo = regras do CSS. Estado que não existe no site não entra,
  a menos que você marque como "sugerido".
- **Stack:** só liste com evidência (arquivo, global, assinatura, `tech.json`). Ferramenta de autoria (Figma, Spline,
  Blender) só se houver pista concreta (comentário no CSS, extensão de arquivo, metadado do GLB); senão, "não determinável".

## Estrutura do DESIGN.md (este modo)

```md
# <Marca> — design system e identidade visual
> Engenharia reversa de <URL> em <data>. Medido no navegador + lido no código. Interpretação marcada como tal.

## 0. Ficha (uma tabela: stack, fonte, paleta-chave, raio, motion em uma linha, temas, breakpoints)
## 1. Marca
   essência · personalidade (adjetivo ← evidência) · logo (construção, área de respiro, versões, usos proibidos)
   · voz e texto (regras + exemplos reais) · o que a marca NÃO é
## 2. Cor
   tabela token → valor claro/escuro → nome no site → onde é usado · proporção de uso · contraste · regras
## 3. Tipografia
   família, pesos, origem dos arquivos · escala (desktop, mobile, clamp) · regras por papel · detalhes (tracking, caixa, entrelinha)
## 4. Layout
   contêiner, grid, espaçamento, ritmo vertical · breakpoints e o que muda em cada um · mapa das seções da página
## 5. Forma e profundidade
   raios · sombras/elevação · bordas · efeitos (blur, gradiente, blend)
## 6. Imagem e ícones
   fotografia/ilustração/3D: assunto, enquadramento, tratamento, proporções, formatos · ícones: estilo, tamanho, traço
## 7. Componentes
   para cada um: imagem (assets/), anatomia, valores, estados (repouso, hover, foco, ativo), variações, faça/não faça
## 8. Motion
   princípios · tokens (durações, curvas) · catálogo: para cada animação → o que é, gatilho, alvo, parâmetros, feito com,
   código mínimo · coreografia da página (linha do tempo da carga + mapa por rolagem) · reduced motion
## 9. Stack e ferramentas
   tabela ferramenta → versão → papel → evidência · como os arquivos se organizam · peso da página · o que não é usado (e por quê importa)
## 10. Acessibilidade e performance
## 11. Como reconstruir (ordem de construção, armadilhas, o que estudar)
## 12. Como adaptar para outro projeto (manter × trocar)
## 13. Medido × lido × interpretado (e o que ficou de fora)
```

Regras de escrita:
- Cada afirmação de valor traz o valor (`620ms`, `#F9F3ED`, `clamp(38px, 4.3vw, 58px)`), não um adjetivo.
- Mostre imagens: `![hero](assets/desktop_00.jpg)`. Um manual de identidade sem imagem não serve.
- O catálogo de motion é a parte que o usuário mais quer: nenhuma animação observada pode ficar de fora, e cada uma
  tem código mínimo que funciona fora do site.
- Termine com "Por trás do código" (o que estudar para dominar o que este site faz).

## Uso responsável

O manual descreve como o site foi feito para estudo. Logo, textos, fotos, modelos 3D e código são do dono do site:
ficam em `assets/` apenas como referência visual e não entram em projeto próprio. Para aplicar, passe pelo ADAPT:
mantenha estrutura e ofício (escala, ritmo, lógica de componentes, sistema de motion) e troque a identidade.
