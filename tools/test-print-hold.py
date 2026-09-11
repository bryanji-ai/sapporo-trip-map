#!/usr/bin/env python3
"""인쇄 탭 「크게 보기」에서 지도를 꾹 눌러 캐릭터를 세우는 길을 헤드리스 크롬으로 확인한다.

   python3 tools/build.py && python3 tools/test-print-hold.py

   🔴 2026-09-11 실제로 났던 것
      확대 보기(.pv-wrap)는 핀치·팬을 직접 받으려고 touch-action:none 이라
      손끝의 미세한 흔들림까지 pointermove 로 다 올라온다. 꾹 누르기 문턱이 4px 이어서
      500ms 를 못 버티고 매번 취소됐다 — 확대한 지도에서는 캐릭터를 못 세웠다.
      아래 ②가 그때 깨지던 자리다.
"""
import json, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

ROWS = [
    {"id": "p1", "n": "삿포로역",   "lat": 43.0686, "lon": 141.3508,
     "d": "2026-09-11", "t": "10:00", "photos": [{"id": "a1", "hero": True}]},
    {"id": "p2", "n": "오도리공원", "lat": 43.0595, "lon": 141.3510,
     "d": "2026-09-11", "t": "11:00", "photos": [{"id": "a2"}]},
]

PROBE = r"""
<script>
window.__err = [];
addEventListener('error', e => window.__err.push('ERR ' + e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* 손가락 하나로 누르고 · 흔들고 · 떼는 흉내 — 확대 보기의 팬 처리도 같이 타게 둔다 */
function press(el, x, y){
  const ev = (t, dx, dy) => new PointerEvent(t, {bubbles:true, cancelable:true, composed:true,
      clientX:x+dx, clientY:y+dy, button:0, buttons:(t === 'pointerup' ? 0 : 1),
      isPrimary:true, pointerId:1, pointerType:'touch'});
  return {
    down:       () => el.dispatchEvent(ev('pointerdown', 0, 0)),
    move: (dx, dy) => el.dispatchEvent(ev('pointermove', dx, dy)),
    up:         () => el.dispatchEvent(ev('pointerup', 0, 0))
  };
}
const picker = () => !!document.querySelector('.char-pick');
const shut   = () => { if (picker()) closeCharPicker(); };
const charsIn = sel => document.querySelectorAll(sel + ' image.charmove').length;

function aim(fy){                                 // 확대된 지도의 빈 지면 한 곳
  const m = document.querySelector('.pv-stage .p-map');
  const r = m.getBoundingClientRect();
  const x = r.left + r.width*0.5, y = r.top + r.height*fy;
  const el = document.elementFromPoint(x, y) || m;
  return {el: el, x: x, y: y, onChar: !!(el.closest && el.closest('image.charmove'))};
}

setTimeout(async () => {
  const out = {};
  try {
    tab('print'); await wait(700);

    /* ① 확대 보기를 연다 — 패널이 .pv-stage 안으로 옮겨 온다 */
    openPosterView('sapporo'); await wait(600);
    out.pvOpen   = !!document.querySelector('.poster-view');
    out.inStage  = !!document.querySelector('.pv-stage .p-panel[data-region]');
    out.hitIsMap = !!aim(0.55).el.closest('.p-map');

    /* ② 손끝이 흔들려도 꾹 누르기가 산다 */
    let a = aim(0.55), p = press(a.el, a.x, a.y);
    p.down();
    for (let i = 1; i <= 3; i++){ await wait(60); p.move(i*2, i); }   // 6px 안쪽 흔들림
    await wait(800);
    out.holdShaky = picker();
    p.up(); await wait(50);

    /* ③ 고른 캐릭터가 확대된 지도 위에 실제로 선다 */
    const before = charsIn('.pv-stage');
    const it = [...document.querySelectorAll('.char-pick .cpick-it')].find(b => !b.classList.contains('dim'));
    out.hasItems = !!it;
    if (it) it.click();
    await wait(700);
    out.added = charsIn('.pv-stage') - before;
    shut();

    /* ④ 정말 밀 때는 꾹 누르기가 아니다 — 확대 보기가 따라 움직인다 */
    const x0 = PV.x;
    a = aim(0.30);                                 // ③ 에서 세운 캐릭터를 밟지 않는 다른 지점
    out.panStartsOnMap = !a.onChar && !!a.el.closest('.p-map');
    p = press(a.el, a.x, a.y);
    p.down();
    for (let i = 1; i <= 4; i++){ await wait(60); p.move(i*12, 0); }
    await wait(800);
    out.holdWhilePan = picker();
    out.panned = Math.abs(PV.x - x0) > 8;
    p.up(); shut(); await wait(50);

    /* ⑤ 확대 보기를 닫으면 패널이 인쇄본 제자리로 돌아온다 */
    closePosterView(); await wait(500);
    out.restored = !!document.querySelector('.poster .p-panel[data-region="sapporo"]');
    out.keptChar = charsIn('.poster .p-panel[data-region="sapporo"]') >= 1;
    out.stageGone = !document.querySelector('.pv-stage');

    /* ⑥ 지도 탭의 꾹 누르기는 그대로다 (4px 문턱을 건드리지 않았는가) */
    tab('screen'); await wait(700);
    const mw = document.querySelector('.mapwrap').getBoundingClientRect();
    const mx = mw.left + mw.width*0.5, my = mw.top + mw.height*0.62;
    const me = document.elementFromPoint(mx, my);
    out.mapHit = me ? me.tagName + '#' + (me.id || '') : null;
    p = press(me, mx, my);
    p.down(); await wait(800);
    out.holdOnMap = picker();
    p.up(); shut();
  } catch (e){ out.thrown = String(e) + ' @ ' + (e.stack || '').split('\n')[1]; }
  out.errors = window.__err;
  const d = document.createElement('pre');
  d.id = 'PROBE'; d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
}, 2500);
</script>
"""


def run():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    stub = ("<script>const __F=" + json.dumps({"places": ROWS}, ensure_ascii=False) +
            ";window.fetch=()=>Promise.resolve(new Response(JSON.stringify(__F),"
            "{status:200,headers:{'Content-Type':'application/json'}}));</script>")
    html = html.replace("<script>\nconst MAPS=", stub + "<script>\nconst MAPS=", 1)
    html = html.replace("</body>", PROBE + "</body>", 1)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        path = f.name
    dom = subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--window-size=430,900",
         "--virtual-time-budget=14000", "--dump-dom", "file://" + path],
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


r = run()
if "thrown" in r:
    sys.exit("탐침이 터졌습니다 — " + r["thrown"])

print("인쇄 탭 크게 보기 — 꾹 눌러 캐릭터 추가")
ck("자바스크립트 오류 없음", r["errors"], [])
ck("확대 보기가 열린다", r["pvOpen"], True)
ck("패널이 무대로 옮겨 온다", r["inStage"], True)
ck("눌린 곳이 지도다", r["hitIsMap"], True)
ck("손끝이 흔들려도 꾹 누르기가 산다", r["holdShaky"], True)
ck("고를 캐릭터가 있다", r["hasItems"], True)
ck("확대된 지도에 캐릭터가 선다", r["added"], 1)
ck("미는 손가락이 빈 지면에서 시작한다", r["panStartsOnMap"], True)
ck("밀 때는 꾹 누르기가 아니다", r["holdWhilePan"], False)
ck("미는 동작은 그대로 먹는다", r["panned"], True)
ck("닫으면 패널이 제자리로 돌아온다", r["restored"], True)
ck("세운 캐릭터가 인쇄본에도 남는다", r["keptChar"], True)
ck("무대가 치워진다", r["stageGone"], True)
ck("지도 탭 꾹 누르기도 그대로다", r["holdOnMap"], True)

print()
if fails:
    sys.exit(f"❌ {len(fails)}건 실패: " + ", ".join(fails))
print("✅ 모두 통과")
