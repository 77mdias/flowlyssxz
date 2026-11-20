#!/usr/bin/env python3
"""
library.py — organiza a biblioteca de referências do flowdesign.

Estrutura:
  library/_inbox/<categoria>/arquivo.mp4     ← você joga os vídeos aqui
  library/refs/<id>/source.mp4               ← cada referência vira uma pasta
  library/refs/<id>/meta.json                ← título, tags, fonte, status
  library/refs/<id>/analysis/                ← saída do analyze_video.py
  library/refs/<id>/breakdown.md             ← engenharia reversa escrita pelo agente
  library/INDEX.md                           ← índice gerado (tabela pesquisável)

Comandos (rode a partir da raiz do repositório):
  python3 skills/flowdesign/scripts/library.py ingest [--analyze]
  python3 skills/flowdesign/scripts/library.py analyze <id|all> [--force]
  python3 skills/flowdesign/scripts/library.py add-url URL --category web --title "..." --tags a,b
  python3 skills/flowdesign/scripts/library.py tag <id> --title "..." --tags a,b --status decoded
  python3 skills/flowdesign/scripts/library.py index
  python3 skills/flowdesign/scripts/library.py find <termo> [<termo> ...]
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VIDEO_EXT = {".mp4", ".mov", ".webm", ".mkv", ".m4v", ".gif"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def repo_root() -> Path:
    p = Path.cwd()
    for c in [p, *p.parents]:
        if (c / "library").is_dir() or (c / "skills" / "flowdesign").is_dir():
            return c
    return p


ROOT = repo_root()
LIB = ROOT / "library"
REFS = LIB / "refs"
INBOX = LIB / "_inbox"


def sha8(path: Path) -> str:
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:8]


def slug(s: str) -> str:
    import re, unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40] or "ref"


def load_meta(d: Path) -> dict:
    p = d / "meta.json"
    return json.loads(p.read_text()) if p.exists() else {}


def save_meta(d: Path, m: dict):
    (d / "meta.json").write_text(json.dumps(m, ensure_ascii=False, indent=2) + "\n")


def cmd_ingest(a):
    INBOX.mkdir(parents=True, exist_ok=True)
    REFS.mkdir(parents=True, exist_ok=True)
    new = []
    for f in sorted(INBOX.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in VIDEO_EXT | IMAGE_EXT or f.name.startswith("."):
            continue
        rel = f.relative_to(INBOX)
        category = slug(rel.parts[0]) if len(rel.parts) > 1 else "geral"
        h = sha8(f)
        rid = f"{category}-{h}"
        d = REFS / rid
        if d.exists():
            print(f"= já existe {rid} ({f.name}) — mantido no inbox")
            continue
        d.mkdir(parents=True)
        dest = d / f"source{f.suffix.lower()}"
        shutil.move(str(f), dest)
        save_meta(d, {
            "id": rid, "category": category, "kind": "video" if f.suffix.lower() in VIDEO_EXT else "image",
            "file": dest.name, "original_name": f.name, "source_url": None, "title": None, "tags": [],
            "niche_fit": [], "techniques": [], "status": "new", "added": dt.date.today().isoformat(), "notes": "",
        })
        new.append(rid)
        print(f"+ {rid}  ← {rel}")
    if a.analyze:
        for rid in new:
            analyze_one(REFS / rid, force=False)
    cmd_index(a)


def analyze_one(d: Path, force=False):
    m = load_meta(d)
    if m.get("kind") != "video":
        return
    out = d / "analysis"
    if (out / "analysis.json").exists() and not force:
        print(f"- {d.name}: já analisado")
        return
    src = d / m["file"]
    print(f"> analisando {d.name} …", flush=True)
    r = subprocess.run([sys.executable, str(HERE / "analyze_video.py"), str(src), "--out", str(out)])
    if r.returncode == 0 and m.get("status") == "new":
        m["status"] = "analyzed"
        save_meta(d, m)


def cmd_analyze(a):
    targets = sorted(REFS.iterdir()) if a.id == "all" else [REFS / a.id]
    for d in targets:
        if d.is_dir():
            analyze_one(d, a.force)
    cmd_index(a)


def cmd_add_url(a):
    REFS.mkdir(parents=True, exist_ok=True)
    rid = f"{slug(a.category)}-{hashlib.sha1(a.url.encode()).hexdigest()[:8]}"
    d = REFS / rid
    d.mkdir(parents=True, exist_ok=True)
    m = load_meta(d) or {"id": rid, "added": dt.date.today().isoformat(), "file": None, "kind": "link", "status": "link", "notes": ""}
    m.update({"category": slug(a.category), "source_url": a.url, "title": a.title or m.get("title"),
              "tags": sorted(set(m.get("tags", []) + [t.strip() for t in (a.tags or "").split(",") if t.strip()])),
              "niche_fit": m.get("niche_fit", []), "techniques": m.get("techniques", [])})
    save_meta(d, m)
    print(f"+ {rid} (link) {a.url}")
    cmd_index(a)


def cmd_tag(a):
    d = REFS / a.id
    m = load_meta(d)
    if not m:
        sys.exit(f"não achei {a.id}")
    if a.title:
        m["title"] = a.title
    for key in ("tags", "techniques", "niche_fit"):
        v = getattr(a, key)
        if v:
            m[key] = sorted(set(m.get(key, []) + [t.strip() for t in v.split(",") if t.strip()]))
    if a.status:
        m["status"] = a.status
    if a.url:
        m["source_url"] = a.url
    save_meta(d, m)
    cmd_index(a)


def rows():
    out = []
    if not REFS.exists():
        return out
    for d in sorted(REFS.iterdir()):
        m = load_meta(d)
        if not m:
            continue
        an = d / "analysis" / "analysis.json"
        dur = ev = ""
        if an.exists():
            j = json.loads(an.read_text())
            dur = f"{j['info']['duration']:.1f}s"
            ev = str(len(j["events"]))
        out.append((m, dur, ev, (d / "breakdown.md").exists()))
    return out


def cmd_index(a=None):
    LIB.mkdir(exist_ok=True)
    rs = rows()
    L = ["# Biblioteca de referências", "",
         f"_Gerado por library.py em {dt.datetime.now():%Y-%m-%d %H:%M} — não edite à mão; edite os meta.json._", "",
         f"Total: {len(rs)} • com breakdown: {sum(1 for r in rs if r[3])}", "",
         "| id | título | categoria | status | duração | eventos | técnicas | tags | nichos |", "|---|---|---|---|---|---|---|---|---|"]
    for m, dur, ev, bd in rs:
        link = f"[{m['id']}](refs/{m['id']}/{'breakdown.md' if bd else 'meta.json'})"
        L.append(f"| {link} | {m.get('title') or '—'} | {m.get('category')} | {m.get('status')} | {dur} | {ev} | "
                 f"{', '.join(m.get('techniques', []))} | {', '.join(m.get('tags', []))} | {', '.join(m.get('niche_fit', []))} |")
    (LIB / "INDEX.md").write_text("\n".join(L) + "\n")
    print(f"índice: {LIB / 'INDEX.md'} ({len(rs)} refs)")


def cmd_find(a):
    terms = [t.lower() for t in a.terms]
    for m, dur, ev, bd in rows():
        d = REFS / m["id"]
        blob = json.dumps(m, ensure_ascii=False).lower()
        if (d / "breakdown.md").exists():
            blob += (d / "breakdown.md").read_text().lower()
        score = sum(blob.count(t) for t in terms)
        if score:
            print(f"{score:3d}  {m['id']:<28} {m.get('title') or '—'}  [{', '.join(m.get('techniques', []))}]")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("ingest"); p.add_argument("--analyze", action="store_true"); p.set_defaults(fn=cmd_ingest)
    p = sp.add_parser("analyze"); p.add_argument("id"); p.add_argument("--force", action="store_true"); p.set_defaults(fn=cmd_analyze)
    p = sp.add_parser("add-url"); p.add_argument("url"); p.add_argument("--category", default="web")
    p.add_argument("--title"); p.add_argument("--tags"); p.set_defaults(fn=cmd_add_url)
    p = sp.add_parser("tag"); p.add_argument("id"); p.add_argument("--title"); p.add_argument("--tags")
    p.add_argument("--techniques"); p.add_argument("--niche-fit", dest="niche_fit"); p.add_argument("--status")
    p.add_argument("--url"); p.set_defaults(fn=cmd_tag)
    p = sp.add_parser("index"); p.set_defaults(fn=cmd_index)
    p = sp.add_parser("find"); p.add_argument("terms", nargs="+"); p.set_defaults(fn=cmd_find)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
