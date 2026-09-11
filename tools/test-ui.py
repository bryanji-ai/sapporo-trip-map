#!/usr/bin/env python3
"""index.html 을 헤드리스 크롬에 띄워 동작을 확인한다.

   python3 tools/build.py && python3 tools/test-ui.py

   🔴 2026-09-10 실제로 났던 두 가지를 붙잡아 둔다.
      ① 사진 없는 지역으로 넘어가면 안내(.mapstate)가 지역 전환 칩을 덮어
         다시는 다른 지역으로 못 가던 것
      ② 드라이브 사진이 오기 전(샘플)에는 「펼쳐보기」가 통째로 비어
         비에이를 비롯한 어떤 일정도 보이지 않던 것
   🔴 2026-09-11 ③ 실데이터가 비에이 한 곳만 왔더니 샘플 일정이 통째로 밀려
         인쇄 포스터의 삿포로·오타루 패널이 「사진이 아직 없어요」만 남던 것
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

# 실제 웹앱이 돌려주던 응답 — 비에이 한 곳뿐이고 그마저 사진이 0장이다.
# 이것 하나 때문에 샘플 일정 30곳이 통째로 밀려 삿포로·오타루 패널이 비었다.
ONLY_BIEI = [
    {"id": "P001", "name": "비에이 버스 투어", "days": "2026-09-12", "first": "",
     "photos": 0, "pays": 1, "lat": 43.591112, "lon": 142.461705, "k": "move"},
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

# 인쇄 포스터 탐침 — 세 패널에 사진 카드가 몇 장 섰는지 센다.
# 카드는 실사진이면 <image class="p-shot">, 사진이 없으면 색 타일 <rect fill="url(#pg-…)">.
POSTER_PROBE = r"""
<script>
window.__err = [];
addEventListener('error', e => window.__err.push('ERR ' + e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));

function panels(){
  const o = {};
  document.querySelectorAll('.p-panel').forEach(p => {
    const map = p.querySelector('.p-map'), ov = map.querySelector('svg:last-of-type');
    o[p.dataset.region] = {
      cards:  ov.querySelectorAll('image.p-shot').length
            + ov.querySelectorAll('rect[fill^="url(#pg-"]').length,
      shots:  ov.querySelectorAll('image.p-shot').length,
      tiles:  ov.querySelectorAll('rect[fill^="url(#pg-"]').length,
      nospot: map.classList.contains('nospot'),
      sample: p.classList.contains('sample')
    };
  });
  return o;
}

setTimeout(async () => {
  const out = {errors: window.__err, isLive: isLive, places: PLACES.length, byG: {}};
  PLACES.forEach(p => out.byG[p.g] = (out.byG[p.g] || 0) + 1);
  tab('print'); await wait(600);
  out.poster = panels();
  // 크게 보기로 옮겨도 카드가 그대로 따라오는가 (패널을 pv-stage 로 옮기고 다시 잰다)
  openPosterView('sapporo'); await wait(500);
  out.enlargedSapporo = panels().sapporo;
  closePosterView(); await wait(300);
  const ex = document.getElementById('exbody');
  out.exSampleBadges = ex.querySelectorAll('.spot .ex-eg').length;
  out.exBanner = !!ex.querySelector('.ex-sample');
  out.errors = window.__err;
  const d = document.createElement('pre');
  d.id = 'PROBE'; d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
}, 2500);
</script>
"""


def run(rows, probe=None):
    """rows 를 웹앱 응답인 척 물려 index.html 을 띄우고 탐침 결과를 돌려준다.
       rows 가 None 이면 연동 실패 — 샘플 일정으로 떨어지는 길을 탄다."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    stub = ("<script>window.fetch=()=>Promise.reject(new Error('offline'));</script>"
            if rows is None else
            "<script>const __F=" + json.dumps({"places": rows}, ensure_ascii=False) +
            ";window.fetch=()=>Promise.resolve(new Response(JSON.stringify(__F),"
            "{status:200,headers:{'Content-Type':'application/json'}}));</script>")
    html = html.replace("<script>\nconst MAPS=", stub + "<script>\nconst MAPS=", 1)
    html = html.replace("</body>", (probe or PROBE) + "</body>", 1)

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

print("④ 실데이터가 비에이 한 곳뿐일 때 — 삿포로·오타루 포스터 패널이 비지 않는가")
r = run(ONLY_BIEI, POSTER_PROBE)
ck("자바스크립트 오류 없음", r["errors"], [])
ck("실데이터 모드다", r["isLive"], True)
ck("삿포로 패널에 「사진 없음」이 뜨지 않는다", r["poster"]["sapporo"]["nospot"], False)
ck("오타루 패널에 「사진 없음」이 뜨지 않는다", r["poster"]["otaru"]["nospot"], False)
ck("삿포로에 사진 카드가 정원껏 선다", r["poster"]["sapporo"]["cards"], 7)
ck("오타루에 사진 카드가 정원껏 선다", r["poster"]["otaru"]["cards"], 3)
ck("비에이는 실데이터 한 곳", r["poster"]["biei"]["cards"], 1)
ck("실사진이 없으니 전부 색 타일", r["poster"]["sapporo"]["shots"], 0)
ck("크게 보기로 옮겨도 카드가 따라온다", r["enlargedSapporo"]["cards"], 7)
ck("예시로 채운 패널은 예시라고 밝힌다", r["poster"]["sapporo"]["sample"], True)
ck("실데이터 패널에는 예시 표시가 없다", r["poster"]["biei"]["sample"], False)
ck("펼쳐보기에도 예시 안내가 뜬다", r["exBanner"], True)
ck("펼쳐보기 예시 일정에 배지가 붙는다", r["exSampleBadges"] > 0, True)

print()
if fails:
    sys.exit(f"❌ {len(fails)}건 실패: " + ", ".join(fails))
print("✅ 모두 통과")
