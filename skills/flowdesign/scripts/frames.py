#!/usr/bin/env python3
"""
frames.py — a "lupa" do agente: depois da análise geral, amplia um trecho específico.

  # frames em resolução cheia em instantes exatos
  python3 frames.py VIDEO --at 1.20 1.35 1.50 --out PASTA

  # tira (filmstrip) com N frames entre dois tempos — ideal para ler UMA transição
  python3 frames.py VIDEO --strip 2.0 2.8 --n 10 --out PASTA

  # mesma tira, recortando uma região (frações 0–1 ou pixels): x,y,w,h
  python3 frames.py VIDEO --strip 2.0 2.8 --n 10 --crop 0,0.3,1,0.4 --out PASTA

  # tira de diferenças (o que mudou entre frames vizinhos fica claro)
  python3 frames.py VIDEO --strip 2.0 2.8 --n 10 --diff --out PASTA

Dica: N frames em D segundos = 1 frame a cada D/N s. Para medir easing a olho,
use 10–16 frames no trecho e observe o espaçamento: frames muito próximos no fim
= ease-out; espaçamento uniforme = linear; próximos nas duas pontas = inOut.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def size_of(video: Path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "json", str(video)], capture_output=True, text=True)
    s = json.loads(out.stdout)["streams"][0]
    return int(s["width"]), int(s["height"])


def grab(video: Path, t: float, crop=None, max_w=1200) -> Image.Image:
    vf = []
    if crop:
        x, y, w, h = crop
        vf.append(f"crop={w}:{h}:{x}:{y}")
    vf.append(f"scale='min({max_w},iw)':-2")
    p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(t, 0):.3f}", "-i", str(video), "-frames:v", "1",
                        "-vf", ",".join(vf), "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    if not p.stdout:
        sys.exit(f"não consegui extrair frame em t={t}")
    from io import BytesIO
    return Image.open(BytesIO(p.stdout)).convert("RGB")


def parse_crop(s: str | None, W: int, H: int):
    if not s:
        return None
    v = [float(x) for x in s.split(",")]
    if all(x <= 1 for x in v):
        v = [v[0] * W, v[1] * H, v[2] * W, v[3] * H]
    x, y, w, h = [int(round(a)) for a in v]
    return x, y, w - w % 2, h - h % 2


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--at", type=float, nargs="+")
    ap.add_argument("--strip", type=float, nargs=2, metavar=("INICIO", "FIM"))
    ap.add_argument("--n", type=int, default=10)
    ap.add_argument("--crop")
    ap.add_argument("--diff", action="store_true", help="mostra diferença entre frames vizinhos")
    ap.add_argument("--cols", type=int)
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    W, H = size_of(a.video)
    crop = parse_crop(a.crop, W, H)

    if a.at:
        for t in a.at:
            p = a.out / f"frame_{t:07.3f}s.png"
            grab(a.video, t, crop).save(p)
            print(p)

    if a.strip:
        t0, t1 = a.strip
        ts = np.linspace(t0, t1, a.n)
        tile_w = 260 if (crop[3] if crop else H) >= (crop[2] if crop else W) else 360
        imgs = [grab(a.video, float(t), crop, max_w=tile_w) for t in ts]
        if a.diff:
            d = [ImageChops.difference(imgs[i], imgs[i - 1]) for i in range(1, len(imgs))]
            d = [Image.eval(x, lambda v: min(255, v * 3)) for x in d]
            imgs, ts = d, ts[1:]
        cols = a.cols or min(len(imgs), 5)
        rows = -(-len(imgs) // cols)
        tw, th = imgs[0].size
        lab = 22
        sheet = Image.new("RGB", (cols * (tw + 6) + 6, rows * (th + lab + 6) + 6), (12, 12, 12))
        dr = ImageDraw.Draw(sheet)
        f = font(14)
        for k, (im, t) in enumerate(zip(imgs, ts)):
            r, c = divmod(k, cols)
            x, y = 6 + c * (tw + 6), 6 + r * (th + lab + 6)
            sheet.paste(im, (x, y + lab))
            dt = (t - ts[0])
            dr.text((x + 3, y + 3), f"{k + 1}  t={t:.3f}s  (+{dt * 1000:.0f}ms)", fill=(255, 220, 90), font=f)
        name = f"strip_{t0:.2f}-{t1:.2f}{'_diff' if a.diff else ''}{'_crop' if crop else ''}.jpg"
        sheet.save(a.out / name, quality=90)
        print(a.out / name)


if __name__ == "__main__":
    main()
