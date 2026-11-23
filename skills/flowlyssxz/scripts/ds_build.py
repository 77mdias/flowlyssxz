#!/usr/bin/env python3
"""
ds_build.py — transforma um tokens.json (fonte única da verdade) num design system utilizável.

Uso:
  python3 ds_build.py CAMINHO/design-system/tokens.json

Gera, na mesma pasta:
  tokens.css           variáveis CSS (:root) + classes dos componentes (.ds-*)
  tailwind-theme.css   bloco @theme para Tailwind v4
  motion.ts            durações, easings (GSAP e CSS) e staggers
  preview.html         página-espécime autocontida: cores, tipografia, espaço, raio, sombra, motion, componentes

Formato do tokens.json: ver references/design-system.md. Valores podem ser string ou
{"value": "...", "note": "..."}. Referências entre tokens usam chaves: "{color.accent}".
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

GROUP_PREFIX = {"color": "color", "space": "space", "radius": "radius", "shadow": "shadow", "border": "border", "layout": "layout"}
CORE_GROUPS = ("space", "radius", "shadow", "border", "layout")
RESERVED = {"meta", "brand", "theme", "stack", "animation", "component", "font", "text", "color", "motion"} | set(CORE_GROUPS)


def extra_groups(T):
    """Grupos livres do tokens.json (gradient, breakpoint, z, size…): viram --<grupo>-<chave>."""
    return [g for g, v in T.items() if g not in RESERVED and isinstance(v, dict)]


def theme_toggle(selector):
    """[data-theme="dark"] → ('attr', 'data-theme', 'dark') · .dark → ('class', 'dark') · outro → None"""
    m = re.fullmatch(r'\s*(?:html|:root)?\[([\w-]+)=["\']?([\w-]+)["\']?\]\s*', selector or "")
    if m:
        return ("attr", m.group(1), m.group(2))
    m = re.fullmatch(r"\s*(?:html|:root)?\.([\w-]+)\s*", selector or "")
    return ("class", m.group(1)) if m else None


def val(x):
    return x["value"] if isinstance(x, dict) and "value" in x else x


def note(x):
    return x.get("note", "") if isinstance(x, dict) else ""


def var_name(path: str) -> str:
    g, k = path.split(".", 1)
    k = k.replace(".", "-")
    if g == "font":
        return f"--font-{k}"
    if g == "motion":
        sub, name = k.split("-", 1)
        return {"duration": f"--dur-{name}", "ease": f"--ease-{name}", "stagger": f"--stagger-{name}"}.get(sub, f"--motion-{k}")
    if g == "text":
        return f"--text-{k}"
    return f"--{GROUP_PREFIX.get(g, g)}-{k}"


def resolve(s, T):
    if not isinstance(s, str):
        return s
    def rep(m):
        path = m.group(1)
        node = T
        for part in path.split("."):
            if not isinstance(node, dict) or part not in node:
                raise SystemExit(f"referência inexistente no tokens.json: {{{path}}}")
            node = node[part]
        return f"var({var_name(path)})"
    return re.sub(r"\{([a-zA-Z0-9_.\-]+)\}", rep, s)


def literal(s, T):
    """Troca {grupo.chave} pelo valor final (para mostrar ao leitor, não para o CSS)."""
    if not isinstance(s, str):
        return s
    def rep(m):
        node = T
        for part in m.group(1).split("."):
            if not isinstance(node, dict) or part not in node:
                return m.group(0)
            node = node[part]
        if isinstance(node, dict):
            node = node.get("css", node.get("value", node.get("stack", m.group(0))))
        return str(node)
    return re.sub(r"\{([a-zA-Z0-9_.\-]+)\}", rep, s)


def lum(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    try:
        la, lb = sorted([lum(a), lum(b)], reverse=True)
        return round((la + 0.05) / (lb + 0.05), 2)
    except Exception:
        return None


def text_style_css(name, st, T):
    fam = st.get("font", "body")
    out = [f"font-family: var(--font-{fam})", f"font-size: var(--text-{name}-size)", f"line-height: var(--text-{name}-line)",
           f"letter-spacing: var(--text-{name}-tracking)", f"font-weight: var(--text-{name}-weight)"]
    if st.get("transform", "none") != "none":
        out.append(f"text-transform: {st['transform']}")
    if st.get("style"):
        out.append(f"font-style: {st['style']}")
    return out


def build_css(T):
    L = [f"/* {T['meta'].get('name', 'design system')} — gerado por ds_build.py a partir de tokens.json. Não edite à mão. */", ":root {"]
    for k, v in T.get("color", {}).items():
        L.append(f"  --color-{k}: {val(v)};")
    for k, v in T.get("font", {}).items():
        L.append(f"  --font-{k}: {v['stack'] if isinstance(v, dict) else v};")
    for k, st in T.get("text", {}).items():
        L += [f"  --text-{k}-size: {st['size']};", f"  --text-{k}-line: {st.get('line', '1.2')};",
              f"  --text-{k}-tracking: {st.get('tracking', '0')};", f"  --text-{k}-weight: {st.get('weight', '400')};"]
    for g in list(CORE_GROUPS) + extra_groups(T):
        for k, v in T.get(g, {}).items():
            L.append(f"  --{g}-{k}: {resolve(val(v), T)};")
    M = T.get("motion", {})
    for k, v in M.get("duration", {}).items():
        L.append(f"  --dur-{k}: {val(v)};")
    for k, v in M.get("ease", {}).items():
        L.append(f"  --ease-{k}: {v['css'] if isinstance(v, dict) else v};")
    for k, v in M.get("stagger", {}).items():
        L.append(f"  --stagger-{k}: {val(v)};")
    L += ["}", ""]
    for name, th in T.get("theme", {}).items():
        L.append(f"/* tema: {name} */")
        L.append(f"{th.get('selector', '[data-theme=' + json.dumps(name) + ']')} {{")
        for g in ("color", "shadow"):
            for k, v in th.get(g, {}).items():
                L.append(f"  --{g}-{k}: {resolve(val(v), T)};")
        L += ["}", ""]
    seen_kf = set()
    for a in T.get("animation", []):
        kf = (a.get("keyframes") or "").strip()
        if kf and kf not in seen_kf:
            seen_kf.add(kf)
            L.append(resolve(kf, T))
    if seen_kf:
        L.append("")
    for k, st in T.get("text", {}).items():
        L.append(f".ds-text-{k} {{ " + "; ".join(text_style_css(k, st, T)) + "; }")
    L.append("")

    def emit(sel, props):
        own, nested = [], []
        for p, v in props.items():
            if p in ("html", "note"):
                continue
            if isinstance(v, dict):
                nested.append((p, v))
            elif p == "text":
                own += text_style_css(v, T["text"][v], T)
            else:
                own.append(f"{p}: {resolve(v, T)}")
        if own:
            L.append(f"{sel} {{ " + "; ".join(own) + "; }")
        for p, v in nested:
            child = sel + p[1:] if p.startswith("&") else (sel + p if p.startswith(":") else f"{sel} {p}")
            emit(child, v)

    for name, props in T.get("component", {}).items():
        emit(f".ds-{name}", props)
    L += ["", "@media (prefers-reduced-motion: reduce) {", "  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }", "}", ""]
    return "\n".join(L)


def build_tailwind(T):
    L = ["/* Tailwind v4 — importe depois de `@import \"tailwindcss\";` */", "@theme {"]
    for k, v in T.get("color", {}).items():
        L.append(f"  --color-{k}: {val(v)};")
    for k, v in T.get("font", {}).items():
        L.append(f"  --font-{k}: {v['stack'] if isinstance(v, dict) else v};")
    for k, st in T.get("text", {}).items():
        L += [f"  --text-{k}: {st['size']};", f"  --text-{k}--line-height: {st.get('line', '1.2')};",
              f"  --text-{k}--letter-spacing: {st.get('tracking', '0')};", f"  --text-{k}--font-weight: {st.get('weight', '400')};"]
    for k, v in T.get("radius", {}).items():
        L.append(f"  --radius-{k}: {val(v)};")
    for k, v in T.get("shadow", {}).items():
        L.append(f"  --shadow-{k}: {val(v)};")
    for k, v in T.get("motion", {}).get("ease", {}).items():
        L.append(f"  --ease-{k}: {v['css'] if isinstance(v, dict) else v};")
    L += ["}", ""]
    return "\n".join(L)


def build_motion_ts(T):
    M = T.get("motion", {})
    sec = lambda s: float(str(val(s)).replace("ms", "e-3").replace("s", "")) if isinstance(val(s), str) else float(val(s))
    dur = {k: round(sec(v), 3) for k, v in M.get("duration", {}).items()}
    stg = {k: round(sec(v), 3) for k, v in M.get("stagger", {}).items()}
    gs = {k: (v.get("gsap") if isinstance(v, dict) else None) or "none" for k, v in M.get("ease", {}).items()}
    cs = {k: (v["css"] if isinstance(v, dict) else v) for k, v in M.get("ease", {}).items()}
    j = lambda o: json.dumps(o, ensure_ascii=False, indent=2)
    return (f"// {T['meta'].get('name', '')} — gerado por ds_build.py. Segundos, prontos para GSAP/Motion.\n"
            f"export const dur = {j(dur)} as const\n\nexport const ease = {j(gs)} as const   // nomes GSAP\n\n"
            f"export const easeCss = {j(cs)} as const\n\nexport const stagger = {j(stg)} as const\n\n"
            f"export const scroll = {j(M.get('scroll', {}))} as const\n")


def build_preview(T, css):
    e = html.escape
    meta = T["meta"]
    C = T.get("color", {})
    bg = val(C.get("bg", "#ffffff"))
    google = [v["google"] for v in T.get("font", {}).values() if isinstance(v, dict) and v.get("google")]
    links = ""
    if google:
        links = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
                 f'<link href="https://fonts.googleapis.com/css2?family={"&family=".join(google)}&display=swap" rel="stylesheet">')
    sw = []
    for k, v in C.items():
        hx = val(v)
        cr = contrast(hx, bg) if k != "bg" else None
        sw.append(f'<figure class="sw"><div class="chip" style="background:{e(hx)}"></div><figcaption><b>{e(k)}</b><code>{e(hx)}</code>'
                  + (f'<span>{cr}:1 s/ fundo</span>' if cr else '') + (f'<em>{e(note(v))}</em>' if note(v) else '') + '</figcaption></figure>')
    spec = meta.get("specimen", {})
    ty = []
    for k, st in T.get("text", {}).items():
        sample = spec.get(k) or spec.get("default") or "Ritmo, peso e silêncio"
        ty.append(f'<div class="ty"><div class="lab"><b>{e(k)}</b><code>{e(st["size"])} · lh {e(str(st.get("line", "")))} · ls {e(str(st.get("tracking", "0")))} · {e(str(st.get("weight", "")))} · {e(st.get("font", "body"))}</code>'
                  + (f'<em>{e(st["note"])}</em>' if st.get("note") else '') + f'</div><div class="ds-text-{k}">{e(sample)}</div></div>')
    fonts = "".join(f'<li><b>{e(k)}</b> <code>{e(v["stack"] if isinstance(v, dict) else v)}</code>' + (f' <em>{e(v.get("note", ""))}</em>' if isinstance(v, dict) else '') + '</li>'
                    for k, v in T.get("font", {}).items())
    sp = "".join(f'<div class="row"><code>{e(k)} · {e(str(val(v)))}</code><i style="width:var(--space-{k})"></i></div>' for k, v in T.get("space", {}).items())
    rd = "".join(f'<figure><div class="rbox" style="border-radius:var(--radius-{k})"></div><figcaption><b>{e(k)}</b><code>{e(str(val(v)))}</code></figcaption></figure>' for k, v in T.get("radius", {}).items())
    sh = "".join(f'<figure><div class="sbox" style="box-shadow:var(--shadow-{k})"></div><figcaption><b>{e(k)}</b></figcaption></figure>' for k, v in T.get("shadow", {}).items())
    lay = "".join(f'<li><b>{e(k)}</b> <code>{e(str(val(v)))}</code>' + (f' <em>{e(note(v))}</em>' if note(v) else '') + '</li>' for k, v in T.get("layout", {}).items())
    M = T.get("motion", {})
    durs = M.get("duration", {})
    demo_dur = "var(--dur-l)" if "l" in durs else (f"var(--dur-{list(durs)[-1]})" if durs else "0.8s")
    mo = "".join(f'<div class="track"><code>{e(k)} · {e(v["css"] if isinstance(v, dict) else v)}' + (f' · gsap {e(v.get("gsap", ""))}' if isinstance(v, dict) and v.get("gsap") else '')
                 + f'</code><div class="rail"><i style="transition-timing-function:var(--ease-{k})"></i></div></div>' for k, v in M.get("ease", {}).items())
    dl = "".join(f'<li><b>{e(k)}</b> <code>{e(str(val(v)))}</code>' + (f' <em>{e(note(v))}</em>' if note(v) else '') + '</li>' for k, v in durs.items())
    st = "".join(f'<li><b>stagger {e(k)}</b> <code>{e(str(val(v)))}</code></li>' for k, v in M.get("stagger", {}).items())
    sc = M.get("scroll")
    comps = "".join(f'<div class="comp"><div class="lab"><b>{e(k)}</b>' + (f'<em>{e(v["note"])}</em>' if v.get("note") else '') + f'</div><div class="stage">{v.get("html", "")}</div></div>'
                    for k, v in T.get("component", {}).items() if v.get("html"))
    B = T.get("brand", {})
    li = lambda xs: "".join(f"<li>{e(x)}</li>" for x in xs or [])
    brand = ""
    if B:
        logo = f'<div class="logo"><img src="{e(B["logo"])}" alt="logo"></div>' if B.get("logo") else ""
        cols = "".join(f'<div><h2 class="k">{e(t)}</h2><ul>{li(B.get(k))}</ul></div>' for k, t in (("personality", "Personalidade"), ("voice", "Voz e texto"), ("imagery", "Imagem e ícones"), ("dont", "Não fazer")) if B.get(k))
        brand = (f'<section><h2 class="k">Marca</h2>{logo}' + (f'<p class="tag">{e(B["tagline"])}</p>' if B.get("tagline") else "")
                 + (f'<p>{e(B["essence"])}</p>' if B.get("essence") else "") + f'<div class="cols">{cols}</div></section>')
    themes = ""
    toggles = []
    for name, th in T.get("theme", {}).items():
        tbg = val(th.get("color", {}).get("bg", bg))
        chips = "".join(f'<figure class="sw"><div class="chip" style="background:{e(val(v))}"></div><figcaption><b>{e(k)}</b><code>{e(val(v))}</code>'
                        + (f'<span>{contrast(val(v), tbg)}:1 s/ fundo</span>' if k != "bg" and contrast(val(v), tbg) else "") + "</figcaption></figure>" for k, v in th.get("color", {}).items())
        tg = theme_toggle(th.get("selector", f'[data-theme="{name}"]'))
        if tg:
            toggles.append((name, tg))
        themes += f'<h2 class="k" style="margin-top:36px">Tema {e(name)} · <code>{e(th.get("selector", ""))}</code></h2><div class="grid">{chips}</div>'
    tbtn = "".join(f'<button class="tg" data-kind="{t[0]}" data-a="{e(t[1])}" data-b="{e(t[2]) if len(t) > 2 else ""}">alternar tema {e(n)}</button>' for n, t in toggles)
    stack = ""
    if T.get("stack"):
        rows = "".join(f'<tr><td><b>{e(x.get("name", ""))}</b></td><td><code>{e(str(x.get("version", "") or "—"))}</code></td><td>{e(x.get("role", ""))}</td><td><em>{e(x.get("evidence", ""))}</em></td></tr>' for x in T["stack"])
        stack = f'<section><h2 class="k">Stack e ferramentas</h2><table><tr><th>ferramenta</th><th>versão</th><th>para quê</th><th>evidência</th></tr>{rows}</table></section>'
    anim = ""
    if T.get("animation"):
        cards = ""
        for i, a in enumerate(T["animation"]):
            facts = "".join(f'<li><b>{e(lbl)}</b> <code>{e(literal(str(a[k]), T))}</code></li>' for k, lbl in (("trigger", "gatilho"), ("target", "alvo"), ("duration", "duração"), ("ease", "easing"), ("delay", "atraso"), ("stagger", "stagger"), ("tool", "feito com"), ("source", "fonte")) if a.get(k))
            demo = f'<div class="demo" data-anim="{e(resolve(a["demo"], T))}"><i></i></div>' if a.get("demo") else ""
            code = f'<pre>{e(a["code"])}</pre>' if a.get("code") else ""
            cards += f'<article class="an"><div><div class="lab"><b>{e(a.get("name", f"anim {i}"))}</b><em>{e(a.get("kind", ""))}</em></div><p>{e(a.get("what", ""))}</p><ul>{facts}</ul></div><div>{demo}{code}</div></article>'
        anim = f'<section><h2 class="k">Catálogo de animações — clique numa demonstração para repetir</h2>{cards}</section>'
    extras = "".join(f'<div><h2 class="k">{e(g)}</h2><ul>' + "".join(f'<li><b>{e(k)}</b> <code>{e(str(val(v)))}</code>' + (f' <em>{e(note(v))}</em>' if note(v) else '') + '</li>' for k, v in T[g].items()) + '</ul></div>' for g in extra_groups(T))
    extras = f'<section><h2 class="k">Outros tokens</h2><div class="cols">{extras}</div></section>' if extras else ""
    conf = "".join(f'<li><b>{e(k)}</b> {e(v)}</li>' for k, v in meta.get("confidence", {}).items())
    notes = "".join(f'<li>{e(n)}</li>' for n in meta.get("notes", []))
    princ = "".join(f'<li>{e(n)}</li>' for n in meta.get("principles", []))
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(meta.get('name', 'Design system'))} — design system</title>{links}
<style>
{css}
/* ---- página-espécime (não faz parte do sistema) ---- */
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body, system-ui); }}
main {{ padding: 48px 5vw 96px; max-width: 1500px; margin: 0 auto; }}
section {{ padding: 56px 0; border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent); }}
h2.k {{ font: 500 11px/1 var(--font-mono, ui-monospace, monospace); letter-spacing: .14em; text-transform: uppercase; opacity: .6; margin: 0 0 28px; }}
code {{ font: 12px/1.5 var(--font-mono, ui-monospace, monospace); opacity: .7; }}
em {{ font-style: normal; font-size: 12px; opacity: .55; display: block; }}
figure {{ margin: 0; }} ul {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; }}
.sw .chip {{ height: 96px; border-radius: 6px; border: 1px solid color-mix(in srgb, currentColor 18%, transparent); }}
.sw figcaption, figcaption {{ display: grid; gap: 2px; margin-top: 8px; font-size: 13px; }} .sw span {{ font-size: 11px; opacity: .6; }}
.ty {{ display: grid; grid-template-columns: minmax(180px, 260px) 1fr; gap: 24px; align-items: baseline; padding: 22px 0; border-bottom: 1px dashed color-mix(in srgb, currentColor 12%, transparent); overflow: hidden; }}
.lab {{ display: grid; gap: 4px; font-size: 13px; align-content: start; }}
.row {{ display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 16px; padding: 5px 0; }} .row i {{ display: block; height: 12px; background: var(--color-accent, currentColor); min-width: 1px; }}
.rbox {{ width: 100%; aspect-ratio: 3/2; border: 1px solid currentColor; background: color-mix(in srgb, currentColor 8%, transparent); }}
.sbox {{ width: 100%; aspect-ratio: 3/2; background: var(--color-surface, var(--color-bg)); border-radius: var(--radius-m, 8px); }}
.track {{ padding: 10px 0; cursor: pointer; }} .rail {{ height: 28px; margin-top: 6px; position: relative; border-bottom: 1px solid color-mix(in srgb, currentColor 25%, transparent); }}
.rail i {{ position: absolute; left: 0; bottom: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--color-accent, currentColor); transition: left {demo_dur}; }}
.go .rail i {{ left: calc(100% - 20px); }}
.comp {{ display: grid; grid-template-columns: minmax(180px, 260px) 1fr; gap: 24px; padding: 28px 0; border-bottom: 1px dashed color-mix(in srgb, currentColor 12%, transparent); }}
.stage {{ display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }}
.two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5vw; }} @media (max-width: 800px) {{ .two, .ty, .comp {{ grid-template-columns: 1fr; }} }}
header p {{ max-width: 70ch; opacity: .75; line-height: 1.6; }}
.logo {{ display: inline-flex; padding: 28px 36px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 8px; }} .logo img {{ height: 64px; width: auto; max-width: 100%; display: block; }}
.tag {{ font-size: 1.25rem; max-width: 46ch; }} .cols {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-top: 28px; }} .cols li {{ font-size: 14px; line-height: 1.5; }}
table {{ width: 100%; border-collapse: collapse; font-size: 14px; }} th, td {{ text-align: left; padding: 10px 14px 10px 0; border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent); vertical-align: top; }} th {{ font: 500 11px/1 var(--font-mono, ui-monospace, monospace); letter-spacing: .12em; text-transform: uppercase; opacity: .6; }}
.an {{ display: grid; grid-template-columns: minmax(260px, 1fr) minmax(260px, 1.2fr); gap: 32px; padding: 26px 0; border-bottom: 1px dashed color-mix(in srgb, currentColor 12%, transparent); }} .an p {{ margin: 8px 0 12px; font-size: 14px; line-height: 1.55; opacity: .85; }} .an li {{ font-size: 13px; }}
.demo {{ height: 150px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, currentColor 14%, transparent); border-radius: 8px; cursor: pointer; overflow: hidden; margin-bottom: 12px; }}
.demo i {{ width: 72px; height: 72px; border-radius: var(--radius-m, var(--radius-md, 10px)); background: var(--color-accent, currentColor); display: block; }}
pre {{ margin: 0; padding: 14px; font: 12px/1.55 var(--font-mono, ui-monospace, monospace); background: color-mix(in srgb, currentColor 7%, transparent); border-radius: 8px; overflow: auto; white-space: pre-wrap; }}
.tg {{ font: 500 12px/1 var(--font-mono, ui-monospace, monospace); padding: 9px 12px; border: 1px solid currentColor; background: none; color: inherit; border-radius: 6px; cursor: pointer; margin: 0 8px 8px 0; }}
@media (max-width: 800px) {{ .an {{ grid-template-columns: 1fr; }} }}
</style></head><body><main>
<header><h2 class="k">{e(meta.get('kind', 'Design system reconstruído'))} · {e(meta.get('source', ''))}</h2>
<div class="ds-text-{e(next(iter(T.get('text', {'h1': 0}))))}">{e(meta.get('name', ''))}</div>
<p>{e(meta.get('summary', ''))}</p>
<div class="two"><div><h2 class="k">Princípios</h2><ul>{princ}</ul></div><div><h2 class="k">Grau de confiança</h2><ul>{conf}</ul><ul style="margin-top:14px">{notes}</ul></div></div></header>
{brand}
<section><h2 class="k">Cor</h2><div class="grid">{''.join(sw)}</div>{themes}<p style="margin-top:24px">{tbtn}</p></section>
<section><h2 class="k">Tipografia</h2><ul style="margin-bottom:24px">{fonts}</ul>{''.join(ty)}</section>
<section class="two"><div><h2 class="k">Espaço</h2>{sp}</div><div><h2 class="k">Layout</h2><ul>{lay}</ul></div></section>
<section class="two"><div><h2 class="k">Raio</h2><div class="grid">{rd}</div></div><div><h2 class="k">Sombra / elevação</h2><div class="grid">{sh or '<em>sem sombras: o sistema é plano</em>'}</div></div></section>
<section><h2 class="k">Motion — clique numa curva para repetir</h2><div class="two"><div id="mo">{mo}</div><div><ul>{dl}{st}</ul>
{f'<p><code>scroll: {e(json.dumps(sc, ensure_ascii=False))}</code></p>' if sc else ''}</div></div></section>
{anim}
<section><h2 class="k">Componentes</h2>{comps or '<em>nenhum componente com "html" definido no tokens.json</em>'}</section>
{stack}
{extras}
</main><script>
const mo = document.getElementById('mo'); const play = () => {{ mo.classList.remove('go'); void mo.offsetWidth; mo.classList.add('go') }};
mo.addEventListener('click', play); setTimeout(play, 400);
for (const d of document.querySelectorAll('.demo')) {{ const run = () => {{ const i = d.firstElementChild; i.style.animation = 'none'; void i.offsetWidth; i.style.animation = d.dataset.anim }}; d.addEventListener('click', run); setTimeout(run, 600) }}
for (const b of document.querySelectorAll('.tg')) b.addEventListener('click', () => {{ const r = document.documentElement; if (b.dataset.kind === 'class') r.classList.toggle(b.dataset.a); else if (r.getAttribute(b.dataset.a) === b.dataset.b) r.removeAttribute(b.dataset.a); else r.setAttribute(b.dataset.a, b.dataset.b) }});
</script></body></html>
"""


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    T = json.loads(src.read_text())
    for g in ("meta", "color", "font", "text"):
        if g not in T:
            sys.exit(f"tokens.json sem o grupo obrigatório '{g}'")
    out = src.parent
    css = build_css(T)
    (out / "tokens.css").write_text(css, encoding="utf-8")
    (out / "tailwind-theme.css").write_text(build_tailwind(T), encoding="utf-8")
    (out / "motion.ts").write_text(build_motion_ts(T), encoding="utf-8")
    (out / "preview.html").write_text(build_preview(T, css), encoding="utf-8")
    C = T["color"]
    warn = []
    if "bg" in C:
        for k in ("text", "text-muted", "accent"):
            if k in C:
                c = contrast(val(C[k]), val(C["bg"]))
                lim = 4.5 if k.startswith("text") else 3
                if c and c < lim:
                    warn.append(f"contraste {k} sobre bg = {c}:1 (mínimo recomendado {lim}:1)")
    print(f"ok → {out}/ (tokens.css, tailwind-theme.css, motion.ts, preview.html)")
    for w in warn:
        print("aviso:", w)


if __name__ == "__main__":
    main()
