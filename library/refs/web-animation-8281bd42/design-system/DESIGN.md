# Ateliê Noturno — design system

> Reconstruído a partir de `web-animation-8281bd42` (vídeo de 19s, 720×900, site dentro de mockup).
> **Medido:** cores de interface, tamanho dos títulos, corpo do texto, margem esquerda, ritmo de motion.
> **Inferido:** rótulos minúsculos, estados de hover/foco, espaçamentos finos, comportamento mobile.
> **Substituído:** famílias tipográficas (não são identificáveis por vídeo) e o cinza do parágrafo (o original falha em contraste).
> Abra `preview.html` para ver tudo renderizado. O motion está detalhado em `../breakdown.md`.

## 1. Essência

1. A cor vem das fotos. A interface é preto quente, cinzas e off-white.
2. Um título serifado gigante por tela; todo o resto é pequeno e quieto.
3. Cantos retos, linhas de 1px, nenhuma sombra. Profundidade = a própria foto ampliada e desfocada ao fundo.
4. Rótulos minúsculos em caixa alta fazem o papel de botões.
5. Movimento lento, atrelado ao scroll.

**Não é:** colorido, arredondado, cheio de cards, cheio de ícones, rápido.

## 2. Cor

| token | valor | uso |
|---|---|---|
| `--color-bg` | `#110d11` | fundo de tudo (76% da área medida) |
| `--color-surface` | `#3c3638` | véu das seções com foto desfocada |
| `--color-text` | `#e1dee4` | títulos, nav, CTA (14.5:1) |
| `--color-text-muted` | `#8a878b` | parágrafos, rótulos (5.4:1). O original usa ≈`#4c494d` (2.1:1): não copie |
| `--color-border` | `#595458` | linhas de 1px, trilho do progresso |
| `--color-accent` | `#ed1b29` | só indicadores pequenos (4.4:1). A interface original não tem acento |
| `--color-accent-deep`, `--color-sand` | `#9d1b24`, `#b29784` | tons das fotos, para placeholders e gradientes |

Regra: se uma tela ficou "sem graça", o problema é a foto, não a falta de cor na interface.

## 3. Tipografia

- **Display:** serifa fina de alto contraste (substituta: Instrument Serif). Peso 400, entrelinha 0.92–1.02, tracking levemente negativo.
- **Corpo e rótulos:** grotesca neutra leve (substituta: Hanken Grotesk), peso 300 no corpo e 500 nos rótulos.

| estilo | tamanho | uso |
|---|---|---|
| `hero` | `clamp(4rem, 12.4vw, 11.5rem)` | abertura e fecho, 1–2 palavras por linha |
| `display` | `clamp(3.25rem, 7.5vw, 7.5rem)` | título de cada seção, uma palavra |
| `statement` | `clamp(2.5rem, 6.2vw, 6rem)` | manifesto de 2 linhas, centrado |
| `body` | `clamp(0.9375rem, 1.18vw, 1.125rem)` / 1.45 | parágrafos de no máx. 3–4 linhas e ~34 caracteres por linha |
| `label` | `0.625rem`, caixa alta, tracking 0.24em | nav, eyebrow, CTA |
| `counter` | `1.375rem` serifado | paginação "02 / 03" |

Faça: uma palavra forte no display. Não faça: display em parágrafos, negrito, caixa alta na serifa.

## 4. Espaço e layout

- Escala: 4, 8, 12, 16, 24, 32, 48, 72, 112px (`--space-1…9`).
- Margem lateral `8vw` (medida em 8.3%). Parágrafos com ~`30vw` de largura.
- Cada seção ocupa `100vh`. Módulo de serviço em **split 50/50**: texto num lado, foto sangrando a borda no outro; alterne os lados.
- Ritmo vertical dentro do módulo: eyebrow → 24px → display → 24px → parágrafo → 32px → CTA.

## 5. Forma

- Raio 0 em tudo. Sem sombras. Bordas de 1px em `--color-border`.
- Imagens: recorte quadrado ou 4:3, sem moldura; atrás, a mesma imagem com `filter: blur(40px) brightness(.5)` e `scale(1.2)`.

## 6. Componentes

| classe | anatomia | notas |
|---|---|---|
| `.ds-nav` | redes (esq.) · marca (centro) · "Navegar ≡" (dir.) | tudo em `label`; fica sobre o conteúdo, sem fundo |
| `.ds-eyebrow` | rótulo cinza acima do título | uma palavra |
| `.ds-cta` | rótulo + duas linhas curtas em diagonal | hover (inferido): linhas crescem a 100% e o tracking abre; foco visível com contorno de 1px |
| `.ds-media` | moldura de foto de canto reto | troca de imagem por `clip-path` vertical |
| `.ds-progress` | trilho de 1px + preenchimento claro | progresso do scroll, no rodapé da janela |
| `.ds-counter` | "02 / 03" serifado, atual em claro | posição na sequência de serviços |
| `.ds-service` | eyebrow + display + parágrafo + CTA + mídia | o módulo que se repete |

Não existem: botão preenchido, card com borda, ícones decorativos, input. Se o projeto precisar (formulário de contato), derive:
input = linha de 1px embaixo + `label` em cima; botão = `.ds-cta`.

## 7. Motion

| token | valor |
|---|---|
| `--dur-xs…xl` | 0.15 · 0.3 · 0.6 · 0.9 · 1.4s |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (GSAP `power4.out`) — entradas |
| `--ease-in-out` | `cubic-bezier(0.76, 0, 0.24, 1)` (GSAP `power3.inOut`) — trocas de seção |
| `--ease-scrub` | `linear` — tudo que é atrelado ao scroll |
| stagger | 0.03s por letra, 0.09s por linha |
| scroll | suave, `lerp ≈ 0.09` |

Coreografia do módulo: seção pinada → a anterior sobe como cortina → imagem nova entra por `clip-path` de baixo para cima →
título acende letra a letra com o scroll. Com `prefers-reduced-motion`: seções empilhadas, sem pin, títulos já acesos.

## 8. Acessibilidade

- Contraste: `text` 14.5:1, `text-muted` 5.4:1, `accent` 4.4:1 (use só em elementos gráficos ou texto grande).
- Rótulos de 10px são o limite: nunca use para conteúdo; em mobile suba para 11–12px.
- Foco sempre visível (contorno de 1px em `--color-text`).
- Texto real no DOM, mesmo quando dividido em letras para animar.

## 9. Como usar

```html
<link rel="stylesheet" href="tokens.css">
<article class="ds-service">
  <div>
    <span class="ds-eyebrow">Serviço</span>
    <h2 class="ds-text-display">Acabamento</h2>
    <p class="ds-text-body">…</p>
    <a class="ds-cta" href="/contato">Iniciar projeto</a>
  </div>
  <div class="ds-media"><img src="…" alt="…"></div>
</article>
```

Tailwind v4: `@import "tailwindcss"; @import "./tailwind-theme.css";` → `bg-bg text-text font-display text-display ease-out`.
Motion: `import { dur, ease, stagger } from './motion'` → `gsap.from(el, { duration: dur.l, ease: ease.out })`.

## 10. Como adaptar para outro projeto

**Manter:** a escala tipográfica (1 display enorme + corpo pequeno), raio 0, ausência de sombra, o módulo split, os tokens de motion.
**Trocar:** `color.*` (ex.: off-white quente + grafite para um ateliê de beleza), as duas famílias, as fotos, os textos.
Copie `tokens.json`, altere `color` e `font`, rode `ds_build.py` de novo.
