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

data = (f"const MAPS={{sapporo:{jz('sapporo.json')},"
        f"otaru:{jz('otaru.json')},biei:{jz('biei.json')}}};\n"
        f"const DEM_BIEI={jz('biei_dem.json')};")

# 06-load.js 가 맨 끝 — 앞의 정의가 다 올라온 뒤에 boot() 이 돈다
app = "\n".join(rd(f) for f in
                ["01-data.js", "02-art.js", "03-terrain.js", "04-illust.js",
                 "05-render.js", "06-load.js"])

out = (rd("index.template.html")
       .replace("/*__STYLE__*/", rd("style.css"))
       .replace("/*__DATA__*/", data)
       .replace("/*__APP__*/", app))

(ROOT / "index.html").write_text(out, encoding="utf-8")
print(f"index.html  {len(out)//1024} KB")
