#!/usr/bin/env python3
"""
extract_design.py — mede a SUPERFÍCIE de uma referência (vídeo ou imagem) para o agente
montar um design system: telas paradas, cores por papel, tamanhos de texto, alinhamentos
e um resumo de motion.

Uso:
  python3 extract_design.py VIDEO_OU_IMAGEM --out PASTA [--analysis analysis.json] [--viewport 1440] [--max-stills 8]

Na biblioteca (padrão): library/refs/<id>/source.mp4 → saída em library/refs/<id>/design/

Saídas:
  design-raw.json     medições (cores, papéis, contraste, linhas de texto, escala, guias, motion)
  stills/*.png        telas paradas em resolução cheia (já recortadas na ROI)
  stills_sheet.jpg    todas as telas com as linhas de texto detectadas e o tamanho estimado
  palette.png         amostras de cor com papel sugerido e contraste

Tudo aqui é MEDIÇÃO APROXIMADA de um vídeo comprimido. Nome de fonte não é detectável;
tamanhos têm erro de ±15%; cores de foto se misturam com cores de interface. O agente
confere nas imagens antes de transformar em tokens (ver references/design-system.md).

OCR é opcional: com `tesseract` + `pytesseract` instalados, as linhas de texto vêm com o
conteúdo lido; sem eles, o script usa só detecção por morfologia.
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from analyze_video import detect_roi, even, ffmpeg_frames, font, probe  # noqa: E402

IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".avif"}

try:  # OCR opcional
    import pytesseract
    pytesseract.get_tesseract_version()
    HAS_OCR = True
except Exception:  # pragma: no cover
    HAS_OCR = False


# ----------------------------------------------------------------------------- cor

def to_lab(rgb_u8: np.ndarray) -> np.ndarray:
    return cv2.cvtColor((rgb_u8.astype(np.float32) / 255.0).reshape(-1, 1, 3), cv2.COLOR_RGB2Lab).reshape(-1, 3)


def lab_to_hex(lab) -> str:
    rgb = cv2.cvtColor(np.float32([[lab]]), cv2.COLOR_Lab2RGB)[0, 0]
    r, g, b = [int(round(float(np.clip(v, 0, 1)) * 255)) for v in rgb]
    return f"#{r:02x}{g:02x}{b:02x}"


def rel_lum(hex_: str) -> float:
    c = [int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a: str, b: str) -> float:
    la, lb = sorted([rel_lum(a), rel_lum(b)], reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)


def still_clusters(rgb: np.ndarray, k=7):
    small = cv2.resize(rgb, (160, max(2, int(160 * rgb.shape[0] / rgb.shape[1]))), interpolation=cv2.INTER_AREA)
    lab = to_lab(small.reshape(-1, 3))
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 25, 0.5)
    _, labels, centers = cv2.kmeans(lab, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    share = np.bincount(labels.ravel(), minlength=k) / len(labels)
    return centers, share


def merge_clusters(per_still, tol=9.0):
    """per_still: lista de (centers, share). Junta cores parecidas (ΔE76 < tol) entre telas."""
    groups = []
    items = sorted(((float(s), c, i) for i, (cs, ss) in enumerate(per_still) for c, s in zip(cs, ss)), key=lambda x: -x[0])
    for s, c, i in items:
        for g in groups:
            if np.linalg.norm(g["lab"] - c) < tol:
                w = g["w"] + s
                g["lab"] = (g["lab"] * g["w"] + c * s) / w
                g["w"] = w; g["stills"].add(i)
                break
        else:
            groups.append({"lab": c.astype(np.float64), "w": s, "stills": {i}})
    n = len(per_still)
    out = []
    for g in groups:
        L, a, b = g["lab"]
        out.append({"hex": lab_to_hex(g["lab"]), "lab": [round(float(v), 1) for v in g["lab"]], "share": round(g["w"] / n, 4),
                    "presence": round(len(g["stills"]) / n, 2), "chroma": round(float(math.hypot(a, b)), 1), "lightness": round(float(L), 1)})
    return sorted(out, key=lambda c: -c["share"])


def nearest(colors, lab):
    d = [np.linalg.norm(np.array(c["lab"]) - lab) for c in colors]
    return int(np.argmin(d))


# ----------------------------------------------------------------------------- telas paradas

def pick_stills(src: Path, info, crop, start, end, max_stills):
    w = 64
    h = even(info["height"] * w / info["width"])
    thumbs, times = [], []
    fps = 4.0
    for i, fr in enumerate(ffmpeg_frames(src, fps, w, h, start, end, crop)):
        thumbs.append(fr.astype(np.int16)); times.append((start or 0) + i / fps)
    if not thumbs:
        return []
    if len(thumbs) == 1:
        return [times[0]]
    act = np.array([0.0] + [float(np.abs(thumbs[i] - thumbs[i - 1]).mean()) for i in range(1, len(thumbs))])
    quiet = act <= max(np.percentile(act, 45), 0.6)
    runs, s = [], None
    for i, q in enumerate(quiet):
        if q and s is None:
            s = i
        if (not q or i == len(quiet) - 1) and s is not None:
            e = i if q else i - 1
            if e - s >= 1:
                runs.append((s, e))
            s = None
    if not runs:
        runs = [(int(np.argmin(act)), int(np.argmin(act)))]
    cand = [s + int((e - s) * 0.7) for s, e in runs]          # fim do trecho calmo = animações assentadas
    chosen = []
    for c in sorted(cand, key=lambda c: -(runs[cand.index(c)][1] - runs[cand.index(c)][0])):
        if thumbs[c].std() < 6:                                # tela vazia/preta
            continue
        if all(np.abs(thumbs[c] - thumbs[o]).mean() > 14 for o in chosen):
            chosen.append(c)
        if len(chosen) >= max_stills:
            break
    if not chosen:
        chosen = [cand[0]]
    return [times[c] for c in sorted(chosen)]


def grab_rgb(src: Path, t: float | None, crop) -> np.ndarray:
    vf = f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}" if crop else "null"
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", f"{t:.3f}"] if t is not None else []) + ["-i", str(src), "-frames:v", "1", "-vf", vf,
                                                                                         "-f", "image2pipe", "-vcodec", "png", "-"]
    p = subprocess.run(cmd, capture_output=True)
    arr = cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR)
    if arr is None:
        sys.exit(f"não consegui ler um quadro de {src}")
    return cv2.cvtColor(arr, cv2.COLOR_BGR2RGB)


# ----------------------------------------------------------------------------- texto

def est_font_px(h: float, text: str | None) -> float:
    if text:
        letters = [c for c in text if c.isalpha()]
        if letters and all(c.isupper() for c in letters):
            return h / 0.72
        if any(c in "gjpqy" for c in text):
            return h / 0.93
    return h / 0.75


def lines_ocr(rgb: np.ndarray):
    scale = 3
    big = cv2.resize(rgb, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    out = []
    for img in (big, 255 - big):                               # texto escuro e texto claro
        d = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config="--psm 11")
        rows = {}
        for i, txt in enumerate(d["text"]):
            txt = txt.strip()
            if len(txt) < 2 or float(d["conf"][i]) < 55:
                continue
            key = (d["block_num"][i], d["par_num"][i], d["line_num"][i])
            x, y, w, h = d["left"][i], d["top"][i], d["width"][i], d["height"][i]
            r = rows.setdefault(key, {"x0": x, "y0": y, "x1": x + w, "y1": y + h, "words": []})
            r["x0"], r["y0"] = min(r["x0"], x), min(r["y0"], y)
            r["x1"], r["y1"] = max(r["x1"], x + w), max(r["y1"], y + h)
            r["words"].append(txt)
        for r in rows.values():
            out.append({"x": r["x0"] / scale, "y": r["y0"] / scale, "w": (r["x1"] - r["x0"]) / scale, "h": (r["y1"] - r["y0"]) / scale,
                        "text": " ".join(r["words"]), "via": "ocr"})
    # remove duplicatas (mesma linha lida nas duas polaridades)
    keep = []
    for l in sorted(out, key=lambda l: -len(l["text"])):
        if not any(abs(l["y"] - k["y"]) < max(l["h"], k["h"]) * 0.6 and l["x"] < k["x"] + k["w"] and k["x"] < l["x"] + l["w"] for k in keep):
            keep.append(l)
    return keep


def lines_morph(rgb: np.ndarray):
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    H, W = g.shape
    grad = cv2.morphologyEx(g, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, np.ones((1, max(3, W // 60)), np.uint8))
    n, _, stats, _ = cv2.connectedComponentsWithStats(bw, 8)
    out = []
    for x, y, w, h, area in stats[1:]:
        if h < max(5, H * 0.012) or h > H * 0.3 or w < h * 2.2 or area / (w * h) < 0.35:
            continue
        out.append({"x": float(x), "y": float(y), "w": float(w), "h": float(h), "text": None, "via": "morfologia"})
    return out


def text_color(rgb: np.ndarray, l) -> tuple[np.ndarray, np.ndarray] | None:
    x0, y0 = max(0, int(l["x"])), max(0, int(l["y"]))
    box = rgb[y0:int(l["y"] + l["h"]) + 1, x0:int(l["x"] + l["w"]) + 1]
    if box.size < 30:
        return None
    lab = to_lab(box.reshape(-1, 3))
    edge = np.concatenate([box[0], box[-1], box[:, 0], box[:, -1]])
    bg = np.median(to_lab(edge), 0)
    d = np.abs(lab[:, 0] - bg[0])
    if d.max() < 18:
        return None
    fg = np.median(lab[d >= np.percentile(d, 88)], 0)
    return fg, bg


def cluster_sizes(lines, key="font_px_ref"):
    vals = sorted(((l[key], l) for l in lines), key=lambda x: x[0])
    steps = []
    for v, l in vals:
        if steps and v / steps[-1]["vals"][0] < 1.14:
            steps[-1]["vals"].append(v); steps[-1]["lines"].append(l)
        else:
            steps.append({"vals": [v], "lines": [l]})
    out = []
    for s in steps:
        med = float(np.median(s["vals"]))
        sample = next((l["text"] for l in sorted(s["lines"], key=lambda l: -len(l["text"] or "")) if l["text"]), None)
        out.append({"confidence": "ok" if len(s["lines"]) >= 2 and all(l.get("reliable") for l in s["lines"]) else "baixa",
                    "px_ref": round(med, 1), "vw": round(float(np.median([l["font_vw"] for l in s["lines"]])), 2),
                    "count": len(s["lines"]), "sample": sample,
                    "uppercase": bool(sample and sample.upper() == sample and any(c.isalpha() for c in sample))})
    return out


def paragraphs(rgb: np.ndarray, viewport: int):
    """Blocos de texto corrido: linhas com o mesmo x inicial e espaçamento regular.
    O passo entre linhas (pitch) é muito mais confiável que a altura da caixa para texto pequeno."""
    H, W = rgb.shape[:2]
    ls = sorted(lines_morph_small(rgb), key=lambda l: (round(l["x"] / (W * 0.015)), l["y"]))
    blocks, cur = [], []
    for l in ls:
        if cur and abs(l["x"] - cur[-1]["x"]) < W * 0.015 and 1.05 * cur[-1]["h"] < l["y"] - cur[-1]["y"] < 2.6 * cur[-1]["h"]:
            cur.append(l)
        else:
            if len(cur) >= 2:
                blocks.append(cur)
            cur = [l]
    if len(cur) >= 2:
        blocks.append(cur)
    out = []
    for b in blocks:
        pitch = float(np.median(np.diff([l["y"] for l in b])))
        out.append({"lines": len(b), "x_pct": round(b[0]["x"] / W * 100, 1), "y_pct": round(b[0]["y"] / H * 100, 1),
                    "width_pct": round(max(l["w"] for l in b) / W * 100, 1),
                    "line_pitch_px_ref": round(pitch * viewport / W, 1), "font_px_ref_est": round(pitch / 1.45 * viewport / W, 1)})
    return out


def lines_morph_small(rgb: np.ndarray):
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    H, W = g.shape
    grad = cv2.morphologyEx(g, cv2.MORPH_GRADIENT, np.ones((2, 2), np.uint8))
    bw = (grad > max(10, np.percentile(grad, 93))).astype(np.uint8) * 255
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, np.ones((1, max(5, W // 45)), np.uint8))
    n, _, stats, _ = cv2.connectedComponentsWithStats(bw, 8)
    return [{"x": float(x), "y": float(y), "w": float(w), "h": float(h)} for x, y, w, h, area in stats[1:]
            if 3 <= h <= H * 0.035 and w > h * 6 and w < W * 0.6]


# ----------------------------------------------------------------------------- motion (resumo de analysis.json)

def motion_summary(an: dict | None):
    if not an or not an.get("events"):
        return None
    ev = an["events"]
    dur = np.array([e["duration"] for e in ev])
    eas = {}
    for e in ev:
        b, c = e["easing"].get("best"), e["easing"].get("confidence")
        if b and c in ("alta", "média"):
            eas[b] = eas.get(b, 0) + (2 if c == "alta" else 1)
    scroll = [e for e in ev if e["kind"].startswith("translação vertical")]
    return {
        "events": len(ev), "active_ratio": an["global"]["active_ratio"],
        "duration_s": {"p25": round(float(np.percentile(dur, 25)), 2), "p50": round(float(np.percentile(dur, 50)), 2),
                       "p75": round(float(np.percentile(dur, 75)), 2), "max": round(float(dur.max()), 2)},
        "easing_votes": dict(sorted(eas.items(), key=lambda kv: -kv[1])),
        "css_for": {e["easing"]["best"]: e["easing"].get("css") for e in ev if e["easing"].get("best")},
        "parallax_events": sum(1 for e in ev if e["layers"] and e["layers"]["layered_speeds"]),
        "pin_events": sum(1 for e in ev if e["layers"] and e["layers"]["pinned_region"]),
        "scroll_events": len(scroll), "cuts": len(an.get("cuts_at", [])),
        "note": "estimativas do analyze_video.py; confirme no breakdown antes de virar token",
    }


# ----------------------------------------------------------------------------- imagens de saída

def draw_sheet(stills, out: Path):
    tiles = []
    for s in stills:
        im = Image.fromarray(s["rgb"]).convert("RGB")
        sc = 520 / im.width
        im = im.resize((520, int(im.height * sc)))
        d = ImageDraw.Draw(im)
        f = font(12)
        for l in s["lines"]:
            box = [l["x"] * sc, l["y"] * sc, (l["x"] + l["w"]) * sc, (l["y"] + l["h"]) * sc]
            col = (255, 80, 200) if l["via"] == "ocr" else (60, 200, 255)
            d.rectangle(box, outline=col, width=1)
            d.text((box[0], max(0, box[1] - 13)), f"{l['font_px_ref']:.0f}px", fill=col, font=f)
        lab = Image.new("RGB", (520, 22), (12, 12, 12))
        ImageDraw.Draw(lab).text((4, 3), f"{s['name']}  t={s['t']}", fill=(255, 220, 90), font=font(13))
        tile = Image.new("RGB", (520, im.height + 22), (12, 12, 12))
        tile.paste(lab, (0, 0)); tile.paste(im, (0, 22))
        tiles.append(tile)
    cols = 2 if len(tiles) > 1 else 1
    rows = math.ceil(len(tiles) / cols)
    th = max(t.height for t in tiles)
    sheet = Image.new("RGB", (cols * 526 + 6, rows * (th + 6) + 6), (12, 12, 12))
    for i, t in enumerate(tiles):
        sheet.paste(t, (6 + (i % cols) * 526, 6 + (i // cols) * (th + 6)))
    sheet.save(out, quality=88)


def draw_palette(colors, roles, out: Path):
    cols = colors[:14]
    W, rowh = 760, 46
    img = Image.new("RGB", (W, rowh * len(cols) + 10), (245, 245, 245))
    d = ImageDraw.Draw(img)
    f = font(14)
    bg = roles.get("bg")
    inv = {}
    for k, v in roles.items():
        for h in (v if isinstance(v, list) else [v]):
            if h:
                inv.setdefault(h, []).append(k)
    for i, c in enumerate(cols):
        y = 5 + i * rowh
        d.rectangle([8, y, 120, y + rowh - 6], fill=c["hex"], outline=(120, 120, 120))
        txt = f"{c['hex']}   area {c['share'] * 100:4.1f}%   telas {int(c['presence'] * 100)}%   croma {c['chroma']:.0f}   L {c['lightness']:.0f}"
        if bg and c["hex"] != bg:
            txt += f"   contraste c/ fundo {contrast(c['hex'], bg)}"
        d.text((132, y + 4), txt, fill=(20, 20, 20), font=f)
        if c["hex"] in inv:
            d.text((132, y + 22), "papel sugerido: " + ", ".join(inv[c["hex"]]), fill=(170, 30, 90), font=f)
    img.save(out)


# ----------------------------------------------------------------------------- main

def extract(src: Path, out: Path, analysis: Path | None, viewport: int, max_stills: int):
    out.mkdir(parents=True, exist_ok=True)
    (out / "stills").mkdir(exist_ok=True)
    is_img = src.suffix.lower() in IMG_EXT
    an = None
    if analysis is None and (src.parent / "analysis" / "analysis.json").exists():
        analysis = src.parent / "analysis" / "analysis.json"
    if analysis and analysis.exists():
        an = json.loads(analysis.read_text())
    crop = None
    if is_img:
        times = [None]
    else:
        info = probe(src)
        if an and an.get("roi"):
            r = an["roi"]; crop = (r["x"], r["y"], r["w"], r["h"])
        elif not an:
            crop = detect_roi(src, info, None, None)
        if crop:  # tira a moldura do mockup (borda da janela, sombra)
            ix, iy = int(crop[2] * 0.025) // 2 * 2, int(crop[3] * 0.03) // 2 * 2
            crop = (crop[0] + ix, crop[1] + iy, crop[2] - 2 * ix, crop[3] - 2 * iy)
        cinfo = dict(info, width=crop[2], height=crop[3]) if crop else info
        times = pick_stills(src, cinfo, crop, None, None, max_stills)

    stills, per_still = [], []
    for i, t in enumerate(times, 1):
        rgb = grab_rgb(src, t, crop)
        name = f"still_{i:02d}" + (f"_{t:06.2f}s" if t is not None else "")
        Image.fromarray(rgb).save(out / "stills" / f"{name}.png")
        H, W = rgb.shape[:2]
        lines = (lines_ocr(rgb) if HAS_OCR else [])
        if len(lines) < 3:
            seen = lines
            lines = seen + [m for m in lines_morph(rgb) if not any(abs(m["y"] - k["y"]) < k["h"] and m["x"] < k["x"] + k["w"] and k["x"] < m["x"] + m["w"] for k in seen)]
        lines = [l for l in lines if l["h"] <= H * 0.25 and (l["text"] is None or sum(c.isalpha() for c in l["text"]) >= 3)]
        for l in lines:
            l["reliable"] = bool(l["h"] >= 9)                   # abaixo disso o vídeo não tem resolução para medir
            px = est_font_px(l["h"], l["text"])
            l["font_px_src"] = round(px, 1)
            l["font_px_ref"] = round(px * viewport / W, 1)
            l["font_vw"] = round(px / W * 100, 2)
            l["x_pct"] = round(l["x"] / W * 100, 1); l["y_pct"] = round(l["y"] / H * 100, 1)
            l["right_pct"] = round((l["x"] + l["w"]) / W * 100, 1)
            l["center_pct"] = round((l["x"] + l["w"] / 2) / W * 100, 1)
            tc = text_color(rgb, l)
            l["_tc"] = tc
        per_still.append(still_clusters(rgb))
        stills.append({"name": name, "t": None if t is None else round(t, 2), "rgb": rgb, "lines": lines, "size": [W, H],
                       "paragraphs": paragraphs(rgb, viewport)})

    colors = merge_clusters(per_still)
    # papéis
    votes_bg, votes_text = {}, {}
    for s in stills:
        rgb = s["rgb"]; H, W = rgb.shape[:2]
        b = max(2, int(min(H, W) * 0.05))
        ring = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3), rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
        lab = to_lab(ring[:: max(1, len(ring) // 4000)])
        for px in lab:
            k = nearest(colors, px); votes_bg[k] = votes_bg.get(k, 0) + 1
        for l in s["lines"]:
            tc = l.pop("_tc")
            if tc is None:
                continue
            fg, bg = tc
            l["color"] = lab_to_hex(fg); l["on"] = lab_to_hex(bg); l["contrast"] = contrast(l["color"], l["on"])
            k = nearest(colors, fg)
            if np.linalg.norm(np.array(colors[k]["lab"]) - fg) < 16:
                votes_text[k] = votes_text.get(k, 0) + l["w"] * l["h"]
    tot = sum(votes_bg.values()) or 1
    score = {k: colors[k]["share"] + 0.5 * votes_bg.get(k, 0) / tot for k in range(len(colors))}
    bg_rank = sorted(score, key=lambda k: -score[k])
    bgs = [colors[k]["hex"] for k in bg_rank if score[k] > 0.12][:3] or [colors[0]["hex"]]
    texts = [colors[k]["hex"] for k in sorted(votes_text, key=lambda k: -votes_text[k]) if colors[k]["hex"] not in bgs][:3]
    if not texts:  # sem texto detectado: a cor de maior contraste com o fundo
        texts = [max(colors, key=lambda c: contrast(c["hex"], bgs[0]))["hex"]]
    acc = [c for c in colors if c["chroma"] >= 32 and 0.002 <= c["share"] <= 0.3 and c["hex"] not in bgs + texts]
    acc = sorted(acc, key=lambda c: -(c["chroma"] * math.sqrt(c["share"])))[:3]
    neutrals = sorted([c for c in colors if c["chroma"] < 12], key=lambda c: c["lightness"])
    roles = {"bg": bgs[0], "bg_alt": bgs[1:], "text": texts[0], "text_alt": texts[1:],
             "accent_candidates": [c["hex"] for c in acc], "neutral_ramp": [c["hex"] for c in neutrals]}
    theme = "escuro" if rel_lum(bgs[0]) < 0.18 else "claro"

    all_lines = [l for s in stills for l in s["lines"]]
    scale = cluster_sizes(all_lines) if all_lines else []
    def guides(key):
        vals = np.round(np.array([l[key] for l in all_lines]) / 1.0)
        if len(vals) == 0:
            return []
        u, c = np.unique(vals, return_counts=True)
        return [{"pct": float(a), "count": int(b)} for a, b in sorted(zip(u, c), key=lambda x: -x[1]) if b >= 2][:6]
    centered = sum(1 for l in all_lines if abs(l["center_pct"] - 50) < 3)
    layout = {"left_guides_pct": guides("x_pct"), "right_guides_pct": guides("right_pct"),
              "centered_lines_ratio": round(centered / len(all_lines), 2) if all_lines else None,
              "note": "guias = posições x (em % da largura) onde 2+ linhas de texto começam/terminam; a menor guia esquerda frequente costuma ser a margem"}

    draw_sheet(stills, out / "stills_sheet.jpg")
    draw_palette(colors, roles, out / "palette.png")

    result = {
        "source": str(src), "viewport_ref": viewport, "ocr": HAS_OCR, "roi": crop, "theme": theme,
        "stills": [{"file": f"stills/{s['name']}.png", "t": s["t"], "size": s["size"], "paragraphs": s["paragraphs"],
                    "lines": sorted(s["lines"], key=lambda l: (l["y"], l["x"]))} for s in stills],
        "colors": colors, "roles": roles,
        "contrast": {"text_on_bg": contrast(roles["text"], roles["bg"]),
                     "accents_on_bg": {h: contrast(h, roles["bg"]) for h in roles["accent_candidates"]}},
        "type_scale": scale,
        "body_text": {"blocks": sum(len(s["paragraphs"]) for s in stills),
                      "font_px_ref_median": (round(float(np.median([p["font_px_ref_est"] for s in stills for p in s["paragraphs"]])), 1)
                                             if any(s["paragraphs"] for s in stills) else None),
                      "note": "texto corrido medido pelo passo entre linhas (pitch / 1.45); use isto, e não type_scale, para o corpo"},
        "layout": layout, "motion": motion_summary(an),
        "caveats": ["cores de fotos/3D entram na lista: papéis são sugestões", "tamanho de fonte ±15%; convertido para viewport de referência",
                    "família tipográfica NÃO é detectada: classifique olhando os stills e escolha substituta",
                    "raio, sombra, espaçamento e componentes: medir olhando os stills (frames.py --crop para ampliar)"],
    }
    def clean(o):
        if isinstance(o, dict):
            return {k: clean(v) for k, v in o.items() if k != "rgb"}
        if isinstance(o, (list, tuple)):
            return [clean(v) for v in o]
        if isinstance(o, (np.floating, np.integer)):
            return float(o)
        return o
    (out / "design-raw.json").write_text(json.dumps(clean(result), ensure_ascii=False, indent=1))
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--analysis", type=Path)
    ap.add_argument("--viewport", type=int, default=1440, help="largura de referência para converter tamanhos (padrão 1440)")
    ap.add_argument("--max-stills", type=int, default=8)
    a = ap.parse_args()
    out = a.out or a.source.parent / "design"
    r = extract(a.source, out, a.analysis, a.viewport, a.max_stills)
    print(f"ok → {out}  ({len(r['stills'])} telas, {len(r['colors'])} cores, {len(r['type_scale'])} tamanhos de texto, corpo ≈ {r['body_text']['font_px_ref_median']}px, tema {r['theme']}, OCR {'sim' if r['ocr'] else 'não'})")


if __name__ == "__main__":
    main()
