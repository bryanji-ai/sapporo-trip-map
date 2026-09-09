#!/usr/bin/env python3
"""src/ + tools/*.json  →  index.html (단일 파일)"""
import json, pathlib, sys, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, TOOLS = ROOT / "src", ROOT / "tools"

def rd(p):
    return (SRC / p).read_text(encoding="utf-8")

def jz(name):
    return json.dumps(json.loads((TOOLS / name).read_text(encoding="utf-8")),
                      separators=(",", ":"), ensure_ascii=False)

# 🔴 src/*.js 는 하나의 전역 스코프로 합쳐진다 — 같은 이름이 둘이면 나중 것이 조용히 이긴다.
#    빌드 전에 막는다 (2026-09-09 doGet·healthCheck 두 건이 실제로 났다)
if subprocess.run([sys.executable, str(TOOLS / "check-collisions.py"), str(SRC)]).returncode:
    sys.exit("빌드를 멈췄습니다 — 이름 충돌을 먼저 해결하세요.")

data = (f"const MAPS={{sapporo:{jz('sapporo.json')},"
        f"otaru:{jz('otaru.json')},biei:{jz('biei.json')}}};\n"
        f"const DEM_BIEI={jz('biei_dem.json')};\n"
        f"const SPRITES={jz('sprites.json')};")

# 06-load.js 가 맨 끝 — 앞의 정의가 다 올라온 뒤에 boot() 이 돈다
app = "\n".join(rd(f) for f in
                ["00-chars.js", "01-data.js", "02-art.js", "03-terrain.js",
                 "04-illust.js", "05-render.js", "06-load.js"])

out = (rd("index.template.html")
       .replace("/*__STYLE__*/", rd("style.css"))
       .replace("/*__DATA__*/", data)
       .replace("/*__APP__*/", app))

(ROOT / "index.html").write_text(out, encoding="utf-8")
print(f"index.html  {len(out)//1024} KB")
