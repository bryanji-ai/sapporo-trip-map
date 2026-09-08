#!/usr/bin/env python3
"""src/ + tools/*.json  →  index.html (단일 파일)"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, TOOLS = ROOT / "src", ROOT / "tools"

def rd(p):
    return (SRC / p).read_text(encoding="utf-8")

def jz(name):
    return json.dumps(json.loads((TOOLS / name).read_text(encoding="utf-8")),
                      separators=(",", ":"), ensure_ascii=False)

data = (f"const MAPS={{sapporo:{jz('sapporo.json')},biei:{jz('biei.json')}}};\n"
        f"const DEM_BIEI={jz('biei_dem.json')};")

app = "\n".join(rd(f) for f in
                ["01-data.js", "02-art.js", "03-terrain.js", "04-illust.js", "05-render.js"])

out = (rd("index.template.html")
       .replace("/*__STYLE__*/", rd("style.css"))
       .replace("/*__DATA__*/", data)
       .replace("/*__APP__*/", app))

(ROOT / "index.html").write_text(out, encoding="utf-8")
print(f"index.html  {len(out)//1024} KB")
