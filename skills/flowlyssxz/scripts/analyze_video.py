#!/usr/bin/env python3
"""
analyze_video.py — transforma um vídeo de referência de motion design em material
que um agente de IA consegue "enxergar": folhas de contato com timestamp, keyframes,
curva de movimento, mapa de calor, cortes de cena, eventos de movimento com
estimativa de easing/duração e indícios de parallax/pin/zoom.

O agente NÃO assiste vídeo. Ele lê imagens + números. Este script é a ponte.

Uso:
  python3 analyze_video.py VIDEO --out PASTA_SAIDA
  python3 analyze_video.py VIDEO --out PASTA --start 2.0 --end 4.5 --fps 30   # análise fina de um trecho

Saídas (em --out):
  analysis.json      dados completos (metadados, cenas, eventos, paleta, séries por frame)
  summary.md         resumo legível com pistas de interpretação
  sheet_01.jpg ...   folhas de contato (frames numerados com tempo e evento)
  timeline.png       gráfico: atividade, velocidade x/y, zoom, cortes e eventos
  heatmap.png        onde o movimento acontece na tela (acumulado)
  keyframes/*.jpg    frames em resolução cheia: início / pico / fim de cada evento

Dependências: ffmpeg/ffprobe no PATH, numpy, opencv-python(-headless), pillow.
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

try:
    import cv2
except ImportError:  # pragma: no cover
    sys.exit("Falta OpenCV: pip install opencv-python-headless")
from PIL import Image, ImageDraw, ImageFont

ANALYSIS_WIDTH = 240          # largura usada para optical flow (rápido e suficiente)
GRID = 3                      # grade 3x3 para detectar camadas (parallax/pin)
MOVE_PX = 0.35                # px/frame (na escala de análise) para considerar um vetor "em movimento"


# ----------------------------------------------------------------------------- util

def font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow antigo
        return ImageFont.load_default()


def even(n: float) -> int:
    n = int(round(n))
    return n if n % 2 == 0 else n + 1


def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True,
    )
    data = json.loads(out.stdout or "{}")
    streams = data.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    if not v:
        sys.exit(f"Nenhum stream de vídeo em {path}")
    fr = v.get("avg_frame_rate") or v.get("r_frame_rate") or "0/1"
    num, den = (fr.split("/") + ["1"])[:2]
    fps = float(num) / float(den) if float(den) else 0.0
    dur = float(data.get("format", {}).get("duration") or v.get("duration") or 0)
    w, h = int(v.get("width", 0)), int(v.get("height", 0))
    rot = 0
    for sd in v.get("side_data_list", []) or []:
        if "rotation" in sd:
            rot = int(sd["rotation"])
    if abs(rot) in (90, 270):
        w, h = h, w
    return {
        "width": w, "height": h, "fps": round(fps, 3), "duration": round(dur, 3),
        "codec": v.get("codec_name"), "orientation": "portrait" if h > w else ("square" if h == w else "landscape"),
        "has_audio": any(s.get("codec_type") == "audio" for s in streams),
    }


def ffmpeg_frames(path: Path, fps: float, width: int, height: int, start: float | None, end: float | None, crop=None):
    """Gera frames BGR (np.uint8 HxWx3) na taxa pedida, via pipe do ffmpeg (tempo exato)."""
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", f"{start:.3f}"]
    cmd += ["-i", str(path)]
    if end is not None:
        dur = end - (start or 0)
        cmd += ["-t", f"{dur:.3f}"]
    pre = f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}," if crop else ""
    cmd += ["-vf", f"{pre}fps={fps},scale={width}:{height}:flags=area,setsar=1", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = width * height * 3
    try:
        while True:
            buf = proc.stdout.read(size)
            if len(buf) < size:
                break
            yield np.frombuffer(buf, np.uint8).reshape(height, width, 3)
    finally:
        proc.stdout.close()
        proc.wait()


def grab_frame(path: Path, t: float, dest: Path, max_w: int = 900, crop=None):
    dest.parent.mkdir(parents=True, exist_ok=True)
    pre = f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}," if crop else ""
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{max(t, 0):.3f}", "-i", str(path), "-frames:v", "1",
         "-vf", f"{pre}scale='min({max_w},iw)':-2", "-q:v", "3", str(dest)],
        check=False,
    )


# ----------------------------------------------------------------------------- easing

def _out(f):
    return lambda t: 1 - f(1 - t)


def _inout(f):
    return lambda t: np.where(t < 0.5, f(2 * t) / 2, 1 - f(2 * (1 - t)) / 2)


def _pw(p):
    return lambda t: np.power(t, p)


def _expo_in(t):
    return np.where(t <= 0, 0, np.power(2, 10 * t - 10))


def _back_out(t, s=1.70158):
    t = t - 1
    return t * t * ((s + 1) * t + s) + 1


EASINGS = {
    "linear / none": lambda t: t,
    "sine.inOut": lambda t: -(np.cos(np.pi * t) - 1) / 2,
    "power1.out (ease-out leve)": _out(_pw(2)),
    "power2.out": _out(_pw(3)),
    "power3.out": _out(_pw(4)),
    "power4.out": _out(_pw(5)),
    "expo.out (lerp/inércia)": _out(_expo_in),
    "power1.in": _pw(2),
    "power2.in": _pw(3),
    "power3.in": _pw(4),
    "power1.inOut": _inout(_pw(2)),
    "power2.inOut": _inout(_pw(3)),
    "power3.inOut": _inout(_pw(4)),
    "power4.inOut": _inout(_pw(5)),
    "expo.inOut": _inout(_expo_in),
    "back.out (overshoot)": _back_out,
}

CSS_EQUIV = {
    "power1.out (ease-out leve)": "cubic-bezier(0.5, 1, 0.89, 1)",
    "power2.out": "cubic-bezier(0.33, 1, 0.68, 1)",
    "power3.out": "cubic-bezier(0.25, 1, 0.5, 1)",
    "power4.out": "cubic-bezier(0.22, 1, 0.36, 1)",
    "expo.out (lerp/inércia)": "cubic-bezier(0.16, 1, 0.3, 1)",
    "sine.inOut": "cubic-bezier(0.37, 0, 0.63, 1)",
    "power1.inOut": "cubic-bezier(0.45, 0, 0.55, 1)",
    "power2.inOut": "cubic-bezier(0.65, 0, 0.35, 1)",
    "power3.inOut": "cubic-bezier(0.76, 0, 0.24, 1)",
    "power4.inOut": "cubic-bezier(0.83, 0, 0.17, 1)",
    "expo.inOut": "cubic-bezier(0.87, 0, 0.13, 1)",
    "back.out (overshoot)": "cubic-bezier(0.34, 1.56, 0.64, 1)",
    "power1.in": "cubic-bezier(0.11, 0, 0.5, 0)",
    "power2.in": "cubic-bezier(0.32, 0, 0.67, 0)",
    "power3.in": "cubic-bezier(0.5, 0, 0.75, 0)",
    "linear / none": "linear",
}


def fit_easing(times: np.ndarray, progress: np.ndarray) -> dict:
    if len(times) < 4 or abs(progress[-1]) < 1e-9:
        return {"best": None}
    t = (times - times[0]) / max(times[-1] - times[0], 1e-9)
    p = progress / progress[-1]
    scores = []
    for name, f in EASINGS.items():
        rmse = float(np.sqrt(np.mean((f(t) - p) ** 2)))
        scores.append((rmse, name))
    scores.sort()
    vel = np.gradient(p, t, edge_order=1)
    peak_t = float(t[int(np.argmax(vel))])
    return {
        "best": scores[0][1],
        "css": CSS_EQUIV.get(scores[0][1]),
        "rmse": round(scores[0][0], 4),
        "runner_up": scores[1][1],
        "peak_velocity_at": round(peak_t, 2),  # 0=início, 1=fim
        "overshoot": bool(np.max(p) > 1.03),
        "confidence": "alta" if scores[0][0] < 0.03 else ("média" if scores[0][0] < 0.07 else "baixa"),
    }


# ----------------------------------------------------------------------------- flow

def flow_stats(prev_g, g, H, W, grid_xy):
    flow = cv2.calcOpticalFlowFarneback(prev_g, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    gx, gy = grid_xy
    u = flow[gy, gx, 0].ravel()
    v = flow[gy, gx, 1].ravel()
    mag = np.hypot(u, v)
    moving = mag > MOVE_PX
    frac = float(moving.mean())
    med_u, med_v = float(np.median(u)), float(np.median(v))
    coh = 0.0
    scale = rot = 0.0
    if moving.sum() >= 30:
        mu, mv = u[moving], v[moving]
        mean = np.array([mu.mean(), mv.mean()])
        n = np.linalg.norm(mean)
        if n > 1e-6:
            cos = (mu * mean[0] + mv * mean[1]) / (np.hypot(mu, mv) * n + 1e-9)
            coh = float((cos > 0.85).mean())
        # ajuste afim: separa translação / zoom / rotação
        xs = (gx.ravel()[moving] - W / 2) / (W / 2)
        ys = (gy.ravel()[moving] - H / 2) / (W / 2)
        A = np.stack([xs, ys, np.ones_like(xs)], 1)
        cu, *_ = np.linalg.lstsq(A, mu / (W / 2), rcond=None)
        cv_, *_ = np.linalg.lstsq(A, mv / (W / 2), rcond=None)
        scale = float((cu[0] + cv_[1]) / 2)
        rot = float((cv_[0] - cu[1]) / 2)
    cells = np.zeros((GRID, GRID, 2), np.float32)
    U = flow[gy, gx, 0]
    V = flow[gy, gx, 1]
    rows = np.array_split(np.arange(U.shape[0]), GRID)
    cols = np.array_split(np.arange(U.shape[1]), GRID)
    for i, r in enumerate(rows):
        for j, c in enumerate(cols):
            cells[i, j, 0] = np.median(U[np.ix_(r, c)])
            cells[i, j, 1] = np.median(V[np.ix_(r, c)])
    return {
        "mean_mag": float(mag.mean()), "moving_frac": frac, "dx": med_u, "dy": med_v,
        "coherence": coh, "scale": scale, "rot": rot, "cells": cells,
    }, flow


# ----------------------------------------------------------------------------- eventos

def segment_events(t, act, cuts, fps, min_dur=0.15):
    if len(act) == 0:
        return []
    k = max(1, int(round(fps * 0.08)))
    sm = np.convolve(act, np.ones(k) / k, mode="same")
    base = min(float(np.percentile(sm, 25)), 0.012)   # teto: em loops/reels o "repouso" nunca chega a zero
    hi = max(0.02, base * 2.5 + 0.005)
    lo = hi * 0.6
    events, on, s = [], False, 0
    cutset = set(cuts)
    for i, a in enumerate(sm):
        if i in cutset and on:
            events.append((s, i - 1)); on = False
        if not on and a > hi:
            on, s = True, i
        elif on and a < lo:
            events.append((s, i - 1)); on = False
    if on:
        events.append((s, len(sm) - 1))
    # junta buracos curtos
    merged = []
    for e in events:
        if merged and t[e[0]] - t[merged[-1][1]] < 0.1 and not any(merged[-1][1] < c <= e[0] for c in cuts):
            merged[-1] = (merged[-1][0], e[1])
        else:
            merged.append(e)
    # divide eventos longos em vales profundos
    def split(a, b, depth=0):
        if depth > 6 or t[b] - t[a] < 1.2:
            return [(a, b)]
        edge = max(2, int(fps * 0.3))
        if b - a <= 2 * edge + 2:
            return [(a, b)]
        seg = sm[a + edge:b - edge]
        m = int(np.argmin(seg)) + a + edge
        left, right = sm[a:m].max(), sm[m:b + 1].max()
        if sm[m] < 0.45 * min(left, right):
            return split(a, m - 1, depth + 1) + split(m + 1, b, depth + 1)
        return [(a, b)]
    out = []
    for a, b in merged:
        out += split(a, b)
    return [(a, b) for a, b in out if t[b] - t[a] + 1 / fps >= min_dur]


def describe_event(idx, a, b, t, S, H, W, fps):
    sl = slice(a, b + 1)
    dx = np.array(S["dx"][sl]); dy = np.array(S["dy"][sl])
    sc = np.array(S["scale"][sl]); ro = np.array(S["rot"][sl])
    mf = np.array(S["moving_frac"][sl]); coh = np.array(S["coherence"][sl])
    act = np.array(S["activity"][sl])
    cells = np.array(S["cells"][sl])  # n x 3 x 3 x 2
    times = np.concatenate([[t[a] - 1 / fps], t[sl]])
    tx = float(dx.sum() / W); ty = float(dy.sum() / H)
    zoom = float(np.exp(np.log1p(np.clip(sc, -0.5, 0.5)).sum()))
    rot_deg = float(np.degrees(ro.sum()))
    T = math.hypot(tx, ty)
    Z = abs(math.log(zoom))
    R = abs(rot_deg) / 90
    mfa, coha = float(mf.mean()), float(coh.mean())

    if mfa < 0.22:
        kind, prog = "local (elemento animando numa parte da tela)", np.cumsum(act)
    elif T >= max(Z, R) and coha > 0.5:
        if abs(ty) >= abs(tx):
            kind = "translação vertical global (scroll ou pan)"
            prog = np.cumsum(dy) * (1 if ty >= 0 else -1)
        else:
            kind = "translação horizontal global (scroll lateral / slider / pan)"
            prog = np.cumsum(dx) * (1 if tx >= 0 else -1)
    elif Z >= R and Z > 0.04 and float((np.sign(sc) == np.sign(math.log(zoom))).mean()) > 0.65:
        kind = "zoom " + ("in (aproxima)" if zoom > 1 else "out (afasta)")
        prog = np.cumsum(np.log1p(np.clip(sc, -0.5, 0.5))) * (1 if zoom > 1 else -1)
    elif R > 0.08 and float((np.sign(ro) == np.sign(rot_deg)).mean()) > 0.65:
        kind = "rotação"
        prog = np.cumsum(ro) * (1 if rot_deg >= 0 else -1)
    else:
        kind = "complexo / múltiplos movimentos (provável 3D, morph ou transição)"
        prog = np.cumsum(act)
    prog = np.concatenate([[0.0], prog])
    ease = fit_easing(times, prog)

    # camadas: razão de deslocamento de cada célula vs. global
    layers = None
    axis = 1 if abs(ty) >= abs(tx) else 0
    g_total = (dy.sum() if axis == 1 else dx.sum())
    if abs(g_total) > (H if axis == 1 else W) * 0.10:
        ratios = np.clip(cells[:, :, :, axis].sum(0) / g_total, -3, 3)
        r = np.round(ratios, 2)
        movers = r[np.abs(r) > 0.1]
        spread = float(movers.max() - movers.min()) if movers.size else 0.0
        pinned = bool((np.abs(r) < 0.15).any() and (np.abs(r) > 0.6).any())
        layers = {"axis": "y" if axis == 1 else "x", "cell_ratios_3x3": r.tolist(),
                  "spread": round(spread, 2), "layered_speeds": spread > 0.3, "pinned_region": pinned}

    peak_i = a + int(np.argmax(act))
    return {
        "id": f"E{idx}", "start": round(float(t[a] - 1 / fps), 3), "end": round(float(t[b]), 3),
        "duration": round(float(t[b] - t[a] + 1 / fps), 3), "peak_t": round(float(t[peak_i]), 3),
        "kind": kind,
        "translate_frac": {"x": round(tx, 3), "y": round(ty, 3)},
        "zoom_factor": round(zoom, 3), "rotation_deg": round(rot_deg, 1),
        "moving_area": round(mfa, 2), "coherence": round(coha, 2),
        "peak_speed_screens_per_s": round(float(max(np.abs(dy).max() / H, np.abs(dx).max() / W) * fps), 2),
        "easing": ease, "layers": layers,
    }


def hints_for(ev: dict) -> list[str]:
    h = []
    k, e, L = ev["kind"], ev["easing"], ev["layers"]
    d = ev["duration"]
    if k.startswith("translação vertical"):
        if e.get("best", "").startswith("expo.out") or (e.get("peak_velocity_at", 1) < 0.25):
            h.append("rolagem com cauda de desaceleração → smooth scroll por lerp (Lenis, lerp≈0.08–0.12) ou inércia")
        if L and L["layered_speeds"]:
            h.append(f"regiões movendo em velocidades diferentes (spread {L['spread']}) → PARALLAX; razões por célula indicam data-speed/yPercent")
        if L and L["pinned_region"]:
            h.append("há região quase parada enquanto o resto rola → PIN/sticky (ScrollTrigger pin ou position: sticky)")
    if k.startswith("translação horizontal"):
        h.append("movimento lateral coerente → seção de scroll horizontal pinada, slider/carrossel ou marquee")
    if k.startswith("zoom"):
        h.append("zoom → scale atrelado ao scroll (scrub), câmera 3D avançando (dolly) ou transição 'zoom-through'")
    if k == "rotação":
        h.append("rotação global → objeto 3D girando (rotation.y no scroll/tempo) ou rotate em CSS")
    if k.startswith("local"):
        h.append("animação localizada → reveal/hover/micro-interação; ver strip do trecho para identificar máscara, split de texto, scale")
    if k.startswith("complexo"):
        h.append("movimento não-rígido → provável cena 3D/WebGL, morph, shader ou transição; inspecione keyframes de perto")
    if e.get("overshoot"):
        h.append("passou do alvo e voltou → spring/back.out (Motion spring, gsap back/elastic)")
    if d < 0.25:
        h.append("muito curto (<250ms) → micro-interação/feedback")
    elif d > 1.8 and not k.startswith("translação"):
        h.append("longo (>1.8s) → animação cinematográfica ou atrelada ao scroll (scrub)")
    return h


# ----------------------------------------------------------------------------- imagens

def draw_timeline(path: Path, t, S, events, cuts, dur, start0):
    Wc, Hc, pad = 1400, 460, 50
    img = Image.new("RGB", (Wc, Hc), (16, 16, 18))
    d = ImageDraw.Draw(img)
    f = font(13)
    t0, t1 = start0, start0 + max(dur, 1e-3)
    X = lambda x: pad + (x - t0) / (t1 - t0) * (Wc - 2 * pad)
    for ev in events:
        d.rectangle([X(ev["start"]), pad, X(ev["end"]), Hc - pad], fill=(38, 44, 60))
        d.text((X(ev["start"]) + 2, pad + 2), ev["id"], fill=(170, 190, 255), font=f)
    for c in cuts:
        d.line([X(t[c]), pad, X(t[c]), Hc - pad], fill=(230, 60, 60), width=2)
    series = [
        ("atividade", np.array(S["activity"]), (240, 240, 240)),
        ("vel. y", np.array(S["dy_speed"]), (90, 200, 255)),
        ("vel. x", np.array(S["dx_speed"]), (255, 170, 70)),
        ("zoom", np.convolve(np.array(S["scale"]), np.ones(5) / 5, mode="same") * 20 if len(S["scale"]) else np.array([]), (120, 230, 120)),
    ]
    mid = (Hc) / 2
    span = (Hc - 2 * pad) / 2
    allv = np.concatenate([np.abs(s[1]) for s in series]) if len(t) else np.array([1])
    m = float(np.percentile(allv, 99)) or 1.0
    d.line([pad, mid, Wc - pad, mid], fill=(60, 60, 64))
    for name, s, col in series:
        pts = [(X(tt), mid - np.clip(v / m, -1, 1) * span) for tt, v in zip(t, s)]
        if len(pts) > 1:
            d.line(pts, fill=col, width=2)
    step = 1 if dur <= 20 else (5 if dur <= 90 else 10)
    x = math.ceil(t0)
    while x <= t1:
        d.line([X(x), Hc - pad, X(x), Hc - pad + 5], fill=(150, 150, 150))
        d.text((X(x) - 6, Hc - pad + 8), f"{x:g}s", fill=(150, 150, 150), font=f)
        x += step
    lx = pad
    for name, _, col in series + [("corte", None, (230, 60, 60)), ("evento", None, (38, 44, 60))]:
        d.rectangle([lx, 14, lx + 14, 28], fill=col)
        d.text((lx + 20, 14), name, fill=(220, 220, 220), font=f)
        lx += 110
    d.text((Wc - 420, 14), "vel. y>0 = conteudo sobe (scroll p/ baixo) | zoom>0 = aproxima", fill=(140, 140, 140), font=f)
    img.save(path, quality=90)


def make_sheets(video, out, info, start, end, events, max_tiles, tile_w, crop=None):
    dur = (end if end is not None else info["duration"]) - (start or 0)
    n_target = max_tiles
    sfps = min(6.0, max(n_target / max(dur, 0.1), 0.2))
    W0, H0 = info["width"], info["height"]
    tw = tile_w if H0 >= W0 else int(tile_w * 1.4)
    th = even(H0 * tw / W0)
    tw = even(tw)
    frames, times = [], []
    for i, fr in enumerate(ffmpeg_frames(video, sfps, tw, th, start, end, crop)):
        frames.append(fr[:, :, ::-1].copy())
        times.append((start or 0) + i / sfps)
    per_sheet = 20 if H0 >= W0 else 24
    cols = 5 if H0 >= W0 else 4
    f = font(max(12, tw // 14))
    paths = []
    for si in range(0, len(frames), per_sheet):
        chunk = frames[si:si + per_sheet]
        rows = math.ceil(len(chunk) / cols)
        lab = int(tw // 7)
        sheet = Image.new("RGB", (cols * tw + (cols + 1) * 6, rows * (th + lab) + (rows + 1) * 6), (12, 12, 12))
        d = ImageDraw.Draw(sheet)
        for k, arr in enumerate(chunk):
            r, c = divmod(k, cols)
            x, y = 6 + c * (tw + 6), 6 + r * (th + lab + 6)
            sheet.paste(Image.fromarray(arr), (x, y + lab))
            tt = times[si + k]
            ev = next((e["id"] for e in events if e["start"] <= tt <= e["end"]), "")
            d.text((x + 4, y + 2), f"#{si + k + 1}  t={tt:.2f}s  {ev}", fill=(255, 220, 90) if ev else (200, 200, 200), font=f)
        p = out / f"sheet_{si // per_sheet + 1:02d}.jpg"
        sheet.save(p, quality=86)
        paths.append(p.name)
    return paths, frames, sfps


def palette(frames, k=6):
    if not frames:
        return {}
    pick = frames[:: max(1, len(frames) // 12)]
    px = np.concatenate([cv2.resize(f, (64, int(64 * f.shape[0] / f.shape[1]))).reshape(-1, 3) for f in pick]).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
    _, labels, centers = cv2.kmeans(px, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), minlength=k) / len(labels)
    order = np.argsort(-counts)
    cols = []
    for i in order:
        r, g, b = [int(x) for x in centers[i]]  # frames chegam em RGB
        hsv = cv2.cvtColor(np.uint8([[[r, g, b]]]), cv2.COLOR_RGB2HSV)[0, 0]
        cols.append({"hex": f"#{r:02x}{g:02x}{b:02x}", "share": round(float(counts[i]), 3), "saturation": int(hsv[1]), "value": int(hsv[2])})
    lum = float(np.mean(0.2126 * px[:, 0] + 0.7152 * px[:, 1] + 0.0722 * px[:, 2]))
    accent = next((c for c in sorted(cols, key=lambda c: -c["saturation"]) if c["share"] > 0.015 and c["saturation"] > 90 and c["value"] > 70), None)
    return {"colors": cols, "mean_luminance": round(lum, 1), "theme": "escuro" if lum < 100 else ("claro" if lum > 170 else "médio"),
            "accent": accent["hex"] if accent else None}



# ----------------------------------------------------------------------------- região ativa

def detect_roi(video: Path, info: dict, start, end):
    """Acha a região onde o movimento acontece (ex.: site dentro de um mockup de navegador/celular).
    Retorna (x, y, w, h) em pixels da fonte, ou None se o movimento ocupa quase a tela toda."""
    W0, H0 = info["width"], info["height"]
    w = 160 if H0 >= W0 else 240
    h = even(H0 * w / W0)
    heat, prev = np.zeros((h, w), np.float32), None
    for fr in ffmpeg_frames(video, 5, w, h, start, end):
        g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY).astype(np.float32)
        if prev is not None:
            heat += np.abs(g - prev)
        prev = g
    if heat.max() <= 0:
        return None
    m = heat / (np.percentile(heat, 99) + 1e-6)
    mask = (m > 0.15).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    ys, xs = np.nonzero(mask)
    if len(xs) < 50:
        return None
    x0, x1 = np.percentile(xs, [1, 99]); y0, y1 = np.percentile(ys, [1, 99])
    px, py = 0.02 * w, 0.02 * h
    x0, y0 = max(0, x0 - px), max(0, y0 - py)
    x1, y1 = min(w, x1 + px), min(h, y1 + py)
    if (x1 - x0) * (y1 - y0) / (w * h) > 0.8:
        return None
    sx, sy = W0 / w, H0 / h
    X, Y = int(x0 * sx) // 2 * 2, int(y0 * sy) // 2 * 2
    CW, CH = int((x1 - x0) * sx) // 2 * 2, int((y1 - y0) * sy) // 2 * 2
    if CW < 64 or CH < 64:
        return None
    return (X, Y, min(CW, W0 - X), min(CH, H0 - Y))

# ----------------------------------------------------------------------------- main

def analyze(video: Path, out: Path, fps=None, start=None, end=None, max_tiles=40, tile_w=200, keyframes=True, roi="auto"):
    out.mkdir(parents=True, exist_ok=True)
    info = probe(video)
    if end is not None:
        end = min(end, info["duration"])
    crop = None
    if roi == "auto":
        crop = detect_roi(video, info, start, end)
    elif roi and roi != "none":
        crop = tuple(int(v) // 2 * 2 for v in roi.split(","))
    full = dict(info)
    if crop:  # a partir daqui, "info" descreve a região de conteúdo
        info = dict(info, width=crop[2], height=crop[3],
                    orientation="portrait" if crop[3] > crop[2] else "landscape")
        ctx = out / "context.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(start or 0) + ((end or full['duration']) - (start or 0)) / 2:.2f}",
                        "-i", str(video), "-frames:v", "1", "-vf",
                        f"drawbox=x={crop[0]}:y={crop[1]}:w={crop[2]}:h={crop[3]}:color=yellow@0.9:t=4,scale='min(720,iw)':-2",
                        str(ctx)], check=False)
    afps = float(fps or min(info["fps"] or 30, 15))
    W = ANALYSIS_WIDTH if info["height"] >= info["width"] else int(ANALYSIS_WIDTH * 1.5)
    W = even(W)
    H = even(info["height"] * W / info["width"])
    step = 6
    gx, gy = np.meshgrid(np.arange(step // 2, W, step), np.arange(step // 2, H, step))

    S = {k: [] for k in ["t", "activity", "energy", "hist", "dx", "dy", "dx_speed", "dy_speed", "scale", "rot", "moving_frac", "coherence", "cells"]}
    heat = np.zeros((H, W), np.float32)
    prev_g = prev_h = None
    mid_frame = None
    n_total = int(((end or info["duration"]) - (start or 0)) * afps)
    diag = math.hypot(W, H)
    for i, fr in enumerate(ffmpeg_frames(video, afps, W, H, start, end, crop)):
        g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
        h = cv2.calcHist([hsv], [0, 1], None, [24, 16], [0, 180, 0, 256])
        cv2.normalize(h, h)
        if i == n_total // 2:
            mid_frame = fr.copy()
        if prev_g is not None:
            st, _ = flow_stats(prev_g, g, H, W, (gx, gy))
            diff = cv2.absdiff(prev_g, g)
            S["t"].append((start or 0) + i / afps)
            S["energy"].append(float(diff.mean() / 255))
            S["hist"].append(float(cv2.compareHist(prev_h, h, cv2.HISTCMP_BHATTACHARYYA)))
            S["activity"].append(st["mean_mag"] / diag * afps)
            for k in ["dx", "dy", "scale", "rot", "moving_frac", "coherence"]:
                S[k].append(st[k])
            S["dx_speed"].append(-st["dx"] / W * afps)   # >0: conteúdo vai p/ esquerda
            S["dy_speed"].append(-st["dy"] / H * afps)   # >0: conteúdo sobe (scroll p/ baixo)
            S["cells"].append(st["cells"])
            heat += diff.astype(np.float32)
        prev_g, prev_h = g, h
    if mid_frame is None and prev_g is not None:
        mid_frame = fr.copy()
    t = np.array(S["t"])

    # cortes de cena
    hist = np.array(S["hist"]) if S["hist"] else np.zeros(0)
    cuts = []
    if hist.size:
        med = float(np.median(hist)); mad = float(np.median(np.abs(hist - med))) + 1e-6
        thr = max(0.32, med + 8 * mad)
        cuts = [i for i, v in enumerate(hist) if v > thr and S["energy"][i] > 0.06]
        for c in cuts:  # flow não tem sentido no frame de corte
            for k in ["activity", "dx", "dy", "dx_speed", "dy_speed", "scale", "rot", "moving_frac", "coherence"]:
                S[k][c] = 0.0
            S["cells"][c] = np.zeros_like(S["cells"][c])
    t0 = start or 0
    t_end = end or info["duration"]
    bounds = [t0] + [float(t[c]) for c in cuts] + [t_end]
    scenes = [{"id": f"S{i + 1}", "start": round(bounds[i], 3), "end": round(bounds[i + 1], 3),
               "duration": round(bounds[i + 1] - bounds[i], 3)} for i in range(len(bounds) - 1)]

    ev_idx = segment_events(t, np.array(S["activity"]), cuts, afps)
    events = []
    for n, (a, b) in enumerate(ev_idx, 1):
        ev = describe_event(n, a, b, t, S, H, W, afps)
        ev["hints"] = hints_for(ev)
        events.append(ev)

    # imagens
    draw_timeline(out / "timeline.png", t, S, events, cuts, t_end - t0, t0)
    if mid_frame is not None and heat.max() > 0:
        hm = heat / (np.percentile(heat, 99.5) + 1e-6)
        hm = (np.clip(hm, 0, 1) * 255).astype(np.uint8)
        cm = cv2.applyColorMap(hm, cv2.COLORMAP_INFERNO)
        blend = cv2.addWeighted(mid_frame, 0.35, cm, 0.65, 0)
        blend = cv2.resize(blend, (W * 2, H * 2), interpolation=cv2.INTER_CUBIC)
        cv2.imwrite(str(out / "heatmap.png"), blend)
    sheets, thumbs, sfps = make_sheets(video, out, info, start, end, events, max_tiles, tile_w, crop)
    pal = palette(thumbs)

    kf = []
    if keyframes:
        chosen = sorted(events, key=lambda e: -e["duration"])[:12]
        for ev in sorted(chosen, key=lambda e: e["start"]):
            for tag, tt in (("ini", ev["start"] + 0.02), ("pico", ev["peak_t"]), ("fim", ev["end"])):
                name = f"keyframes/{ev['id']}_{tag}_{tt:06.2f}s.jpg"
                grab_frame(video, tt, out / name, crop=crop)
                kf.append(name)
        for sc in scenes[:20]:
            name = f"keyframes/{sc['id']}_meio_{(sc['start'] + sc['end']) / 2:06.2f}s.jpg"
            grab_frame(video, (sc["start"] + sc["end"]) / 2, out / name, crop=crop)
            kf.append(name)

    total_active = sum(e["duration"] for e in events)
    result = {
        "video": str(video), "window": {"start": t0, "end": t_end}, "info": info, "source_info": full,
        "roi": {"x": crop[0], "y": crop[1], "w": crop[2], "h": crop[3],
                "area_ratio": round(crop[2] * crop[3] / (full["width"] * full["height"]), 2)} if crop else None,
        "analysis": {"fps": afps, "size": [W, H], "sheet_fps": round(sfps, 3)},
        "scenes": scenes, "cuts_at": [round(float(t[c]), 3) for c in cuts],
        "events": events,
        "global": {
            "active_ratio": round(total_active / max(t_end - t0, 1e-6), 2),
            "events_per_min": round(len(events) / max(t_end - t0, 1e-6) * 60, 1),
            "median_event_duration": round(float(np.median([e["duration"] for e in events])), 3) if events else None,
        },
        "palette": pal,
        "files": {"sheets": sheets, "timeline": "timeline.png", "heatmap": "heatmap.png", "keyframes": kf,
                  "context": "context.jpg" if crop else None},
        "series": {k: [round(float(x), 5) for x in S[k]] for k in ["t", "activity", "dx_speed", "dy_speed", "scale", "rot", "moving_frac"]},
    }
    (out / "analysis.json").write_text(json.dumps(result, ensure_ascii=False, indent=1))
    (out / "summary.md").write_text(render_summary(result), encoding="utf-8")
    return result


def render_summary(r: dict) -> str:
    i = r["source_info"]
    L = [f"# Análise automática — {Path(r['video']).name}", "",
         f"- **Formato:** {i['width']}×{i['height']} ({i['orientation']}), {i['fps']} fps, {i['duration']}s, áudio: {'sim' if i['has_audio'] else 'não'}",
         (f"- **Região ativa (ROI):** x={r['roi']['x']} y={r['roi']['y']} {r['roi']['w']}×{r['roi']['h']} — {int(r['roi']['area_ratio'] * 100)}% do quadro "
          f"(provável mockup/moldura; análise feita só dentro dela, veja context.jpg)" if r.get("roi") else "- **Região ativa:** quadro inteiro"),
         f"- **Janela analisada:** {r['window']['start']:.2f}s → {r['window']['end']:.2f}s @ {r['analysis']['fps']} fps",
         f"- **Cenas (cortes):** {len(r['scenes'])} — cortes em {', '.join(f'{c}s' for c in r['cuts_at']) or 'nenhum'}",
         f"- **Eventos de movimento:** {len(r['events'])} • tela em movimento {int(r['global']['active_ratio'] * 100)}% do tempo • duração mediana {r['global']['median_event_duration']}s",
         ]
    if r["global"]["active_ratio"] > 0.85:
        L.append("- **Movimento contínuo:** quase não há repouso → loop, motion reel, fundo vivo ou câmera sempre andando. "
                 "Eventos foram separados pelos vales de velocidade; leia o ritmo pelo timeline.png.")
    p = r.get("palette") or {}
    if p:
        L.append(f"- **Paleta:** tema {p.get('theme')} (lum. {p.get('mean_luminance')}), acento {p.get('accent') or '—'} → " +
                 " ".join(f"`{c['hex']}` {int(c['share'] * 100)}%" for c in p.get("colors", [])))
    L += ["", "> Easing/duração vêm de optical flow em baixa resolução: são **estimativas**. Em gravação de tela, o scroll do usuário",
          "> mistura-se à animação. Confirme sempre olhando as folhas de contato e os strips (frames.py).", "",
          "## Eventos", "", "| id | início–fim | dur. | tipo | easing estimado (conf.) | pico vel. | área | camadas |", "|---|---|---|---|---|---|---|---|"]
    for e in r["events"]:
        es = e["easing"]
        lay = "—"
        if e["layers"]:
            lay = ("parallax " if e["layers"]["layered_speeds"] else "") + ("pin " if e["layers"]["pinned_region"] else "") + f"spread {e['layers']['spread']}"
        L.append(f"| {e['id']} | {e['start']:.2f}–{e['end']:.2f}s | {e['duration']:.2f}s | {e['kind']} | {es.get('best')} ({es.get('confidence', '-')}, pico em {es.get('peak_velocity_at', '-')}) | {e['peak_speed_screens_per_s']} telas/s | {int(e['moving_area'] * 100)}% | {lay} |")
    L += ["", "## Pistas de interpretação", ""]
    for e in r["events"]:
        if e["hints"]:
            L.append(f"- **{e['id']}** ({e['start']:.2f}s): " + "; ".join(e["hints"]))
    L += ["", "## Arquivos", "", "- Folhas de contato: " + ", ".join(r["files"]["sheets"]),
          "- Gráfico: timeline.png • Mapa de calor: heatmap.png", f"- Keyframes: {len(r['files']['keyframes'])} em keyframes/", ""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--out", type=Path, help="pasta de saída (padrão: <pasta do vídeo>/analysis)")
    ap.add_argument("--fps", type=float, help="fps da análise (padrão: min(fps do vídeo, 15)); use 30–60 para trechos curtos")
    ap.add_argument("--start", type=float)
    ap.add_argument("--end", type=float)
    ap.add_argument("--max-tiles", type=int, default=40, help="nº máx. de frames nas folhas de contato")
    ap.add_argument("--tile-w", type=int, default=200)
    ap.add_argument("--no-keyframes", action="store_true")
    ap.add_argument("--roi", default="auto", help="auto (detecta mockup) | none | x,y,w,h em pixels")
    a = ap.parse_args()
    out = a.out or a.video.parent / "analysis"
    r = analyze(a.video, out, a.fps, a.start, a.end, a.max_tiles, a.tile_w, not a.no_keyframes, a.roi)
    print(f"ok → {out}  ({len(r['events'])} eventos, {len(r['scenes'])} cenas, {len(r['files']['sheets'])} folhas)")


if __name__ == "__main__":
    main()
