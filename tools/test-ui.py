#!/usr/bin/env python3
"""index.html 을 헤드리스 크롬에 띄워 동작을 확인한다.

   python3 tools/build.py && python3 tools/test-ui.py

   🔴 2026-09-10 실제로 났던 두 가지를 붙잡아 둔다.
      ① 사진 없는 지역으로 넘어가면 안내(.mapstate)가 지역 전환 칩을 덮어
         다시는 다른 지역으로 못 가던 것
      ② 드라이브 사진이 오기 전(샘플)에는 「펼쳐보기」가 통째로 비어
         비에이를 비롯한 어떤 일정도 보이지 않던 것
"""
import json, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 삿포로에만 사진이 있는 응답 — 비에이·오타루는 「사진 없음」 안내가 뜨는 지역
ONLY_SAPPORO = [
    {"id": "p1", "n": "삿포로역",   "lat": 43.0686, "lon": 141.3508,
     "d": "2026-09-11", "t": "10:00", "photos": [{"id": "a1", "hero": True}]},
    {"id": "p2", "n": "오도리공원", "lat": 43.0595, "lon": 141.3510,
     "d": "2026-09-11", "t": "11:00", "photos": [{"id": "a2"}]},
]
# 세 지역에 고루 있는 응답 — 실데이터가 왔을 때의 정상 동작
ALL_THREE = ONLY_SAPPORO + [
    {"id": "p3", "n": "청의 호수",  "lat": 43.5169, "lon": 142.6236,
     "d": "2026-09-12", "t": "15:20", "photos": [{"id": "b1", "hero": True}]},
    {"id": "p5", "n": "오타루 운하", "lat": 43.1975, "lon": 140.9995,
     "d": "2026-09-13", "t": "13:30", "photos": [{"id": "o1"}]},
]

PROBE = r"""
<script>
window.__err = [];
addEventListener('error', e => window.__err.push('ERR ' + e.message));
function rc(el){                                   // 진짜 클릭에 가깝게 — 포인터까지 같이 쏜다
  const r = el.getBoundingClientRect(), x = r.left + r.width/2, y = r.top + r.height/2;
  const hit = document.elementFromPoint(x, y) || el;
  const o = {bubbles:true, cancelable:true, clientX:x, clientY:y, button:0,
             isPrimary:true, pointerId:1, pointerType:'mouse'};
  hit.dispatchEvent(new PointerEvent('pointerdown', o));
  hit.dispatchEvent(new MouseEvent('mousedown', o));
  hit.dispatchEvent(new PointerEvent('pointerup', o));
  hit.dispatchEvent(new MouseEvent('mouseup', o));
  hit.dispatchEvent(new MouseEvent('click', o));
}
const rg = g => document.querySelector('.regionsw button[data-g="' + g + '"]');
const hits = g => { const b = rg(g), r = b.getBoundingClientRect();
  const e = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
  return !!e && (e === b || b.contains(e)); };
const wait = ms => new Promise(r => setTimeout(r, ms));

setTimeout(async () => {
  const out = {errors: window.__err, isLive: isLive, places: PLACES.length};
  out.regionStart = current;
  rc(rg('biei'));   await wait(400);  out.afterBiei    = current;
  out.hitWhileEmpty = {sapporo: hits('sapporo'), otaru: hits('otaru')};
  rc(rg('sapporo')); await wait(400); out.backToSapporo = current;
  rc(rg('otaru'));   await wait(400); out.thenOtaru     = current;

  const ex = document.getElementById('exbody');
  out.exDays    = [...ex.querySelectorAll('.daybar b')].map(e => e.textContent.trim());
  out.exRegions = [...new Set([...ex.querySelectorAll('.rg')].map(e => e.textContent.trim()))];
  out.exSpots   = ex.querySelectorAll('.spot').length;
  out.errors = window.__err;
  const d = document.createElement('pre');
  d.id = 'PROBE'; d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
}, 2500);
</script>
"""


def run(rows):
    """rows 를 웹앱 응답인 척 물려 index.html 을 띄우고 탐침 결과를 돌려준다.
       rows 가 None 이면 연동 실패 — 샘플 일정으로 떨어지는 길을 탄다."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    stub = ("<script>window.fetch=()=>Promise.reject(new Error('offline'));</script>"
            if rows is None else
            "<script>const __F=" + json.dumps({"places": rows}, ensure_ascii=False) +
            ";window.fetch=()=>Promise.resolve(new Response(JSON.stringify(__F),"
            "{status:200,headers:{'Content-Type':'application/json'}}));</script>")
    html = html.replace("<script>\nconst MAPS=", stub + "<script>\nconst MAPS=", 1)
    html = html.replace("</body>", PROBE + "</body>", 1)

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        path = f.name
    dom = subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--window-size=430,900",
         "--virtual-time-budget=9000", "--dump-dom", "file://" + path],
        capture_output=True, text=True).stdout
    m = re.search(r'<pre id="PROBE">(.*?)</pre>', dom, re.S)
    if not m:
        sys.exit("탐침이 돌지 않았습니다 — 크롬을 찾을 수 없거나 스크립트가 터졌습니다.")
    return json.loads(re.sub(r"&(lt|gt|amp|quot|#39);",
                             lambda x: {"lt": "<", "gt": ">", "amp": "&",
                                        "quot": '"', "#39": "'"}[x.group(1)], m.group(1)))


fails = []
def ck(name, got, want):
    ok = got == want
    print(("  ✅ " if ok else "  ❌ ") + name + (f"   기대 {want!r} · 실제 {got!r}" if not ok else ""))
    if not ok:
        fails.append(name)


print("① 삿포로에만 사진이 있을 때 — 빈 지역 안내가 지역 전환을 막지 않는가")
r = run(ONLY_SAPPORO)
ck("자바스크립트 오류 없음", r["errors"], [])
ck("비에이로 전환된다", r["afterBiei"], "biei")
ck("안내가 떠 있어도 삿포로 칩이 눌린다", r["hitWhileEmpty"]["sapporo"], True)
ck("안내가 떠 있어도 오타루 칩이 눌린다", r["hitWhileEmpty"]["otaru"], True)
ck("삿포로로 되돌아온다", r["backToSapporo"], "sapporo")
ck("이어서 오타루로 간다", r["thenOtaru"], "otaru")

print("② 드라이브 사진이 오기 전(샘플) — 펼쳐보기에 비에이가 보이는가")
r = run(None)
ck("샘플 모드다", r["isLive"], False)
ck("펼쳐보기에 세 지역이 다 있다", sorted(r["exRegions"]), sorted(["삿포로", "비에이", "오타루"]))
ck("펼쳐보기에 날짜가 쌓인다", len(r["exDays"]), 4)

print("③ 실데이터가 왔을 때 — 세 지역이 그대로 쌓인다")
r = run(ALL_THREE)
ck("실데이터 모드다", r["isLive"], True)
ck("펼쳐보기에 세 지역이 다 있다", sorted(r["exRegions"]), sorted(["삿포로", "비에이", "오타루"]))
ck("장소 4곳", r["exSpots"], 4)

print()
if fails:
    sys.exit(f"❌ {len(fails)}건 실패: " + ", ".join(fails))
print("✅ 모두 통과")
