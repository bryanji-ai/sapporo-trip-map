/* ══ 공용 defs 한 번만 ══ */
document.getElementById('sharedefs').innerHTML = defs('bm');

/* ── 사진 자리 표시 (샘플) ── */
function thumb(seed){
  const h = (seed*47)%360, h2 = (h+38)%360;
  return `<div class="im" style="background:linear-gradient(${140+seed*13%80}deg,hsl(${h} 34% 62%),hsl(${h2} 30% 41%))"></div>`;
}
function hue(seed){ return [(seed*47)%360, (seed*47+38)%360]; }

/* ══════════ 화면용 지도 ══════════ */
let current = 'sapporo';
let openIdx = -1;

const mapwrap  = document.querySelector('.mapwrap');
const mapbase  = document.getElementById('mapbase');
const mapover  = document.getElementById('mapover');
const mapillust= document.getElementById('mapillust');

/* 핀 하나 그리기 — 크기는 사진 수 */
function pinSvg(x, y, ph, color, i, on){
  const r = 5.6 + Math.min(ph,24)/24 * 6.6;
  return `<g class="pin${on?' on':''}" data-i="${i}" tabindex="0" role="button">`
    + `<circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r*2.4).toFixed(1)}" fill="${color}"/>`
    + `<path class="core" d="M${x.toFixed(1)},${(y+r*0.5).toFixed(1)} c${(-r*1.15).toFixed(1)},${(-r*0.9).toFixed(1)} ${(-r*1.5).toFixed(1)},${(-r*1.5).toFixed(1)} ${(-r*1.5).toFixed(1)},${(-r*2.1).toFixed(1)} a${r.toFixed(1)},${r.toFixed(1)} 0 1 1 ${(r*3).toFixed(1)},0 c0,${(r*0.6).toFixed(1)} ${(-r*0.35).toFixed(1)},${(r*1.2).toFixed(1)} ${(-r*1.5).toFixed(1)},${(r*2.1).toFixed(1)} Z" fill="${color}"/>`
    + `<circle cx="${x.toFixed(1)}" cy="${(y-r*1.6).toFixed(1)}" r="${(r*0.42).toFixed(1)}" fill="#FFFFFF"/></g>`;
}

function drawScreen(){
  const R = REGIONS[current];
  const vs = placesOf(current);
  const vb = fit(R.map, vs.map(({p})=>R.px(p.lat,p.lon)), R.kind==='rural'?70:90, 1.15);
  const vbs = vb.map(v=>v.toFixed(1)).join(' ');

  if (mapbase.dataset.g !== current){
    mapbase.innerHTML = terrainOf(R);
    mapbase.dataset.g = current;
  }
  mapbase.setAttribute('viewBox', vbs);
  mapover.setAttribute('viewBox', vbs);
  mapover.setAttribute('aria-label', `${R.name} 여행 지도`);
  mapwrap.style.aspectRatio = `${vb[2]} / ${vb[3]}`;

  const sc = Math.max(0.55, Math.min(1.5, vb[2]/560));
  let pins = '';
  vs.forEach(({p,i}) => {
    const [x,y] = R.px(p.lat,p.lon);
    pins += pinSvg(x, y, p.ph, `var(${CAT[p.k].c})`, i, i===openIdx);
  });
  mapover.innerHTML = landmarkArt(R,sc) + pins + landmarkLabels(R,sc);

  // 캐릭터 — 지도와 같은 크기의 화면 좌표계(원점 0,0)에 고정
  mapillust.setAttribute('viewBox', `0 0 ${vb[2].toFixed(1)} ${vb[3].toFixed(1)}`);
  mapillust.innerHTML = R.illust(vb[2], vb[3]);

  // 축척 바 — 지역마다 실제 거리로
  const barPx = R.scaleMeters / metersPerPx(R.map);
  const bar = document.querySelector('.scalebar');
  bar.style.setProperty('--w', `${(barPx/vb[2]*100).toFixed(1)}%`);
  bar.querySelector('span').textContent = R.scaleLabel;

  document.getElementById('rgname').textContent = R.name;
  document.getElementById('rgjp').textContent = R.jp;
}

/* ── 지역 전환 ── */
function setRegion(g){
  if (g === current) return;
  current = g;
  closeSheet(true);
  document.querySelectorAll('.regionsw button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.g === g)));
  mapwrap.classList.add('fade');
  setTimeout(() => { drawScreen(); mapwrap.classList.remove('fade'); }, 190);
}
document.querySelector('.regionsw').addEventListener('click', e => {
  const b = e.target.closest('button[data-g]');
  if (b) setRegion(b.dataset.g);
});

/* ══════════ 하단 시트 ══════════ */
const sheet = document.getElementById('sheet');
let allPhotos = false;
function openPin(i){
  const p = PLACES[i]; if(!p) return;
  if (p.g !== current) current = p.g;
  openIdx = i;
  const day = DAYS.find(d=>d.id===p.d);
  const c = `var(${day.c})`;
  const shown = allPhotos ? p.ph : Math.min(p.ph, 8);
  let ph = '';
  for (let k=0;k<shown;k++)
    ph += `<div class="ph">${thumb(i*7+k)}<button class="star" aria-pressed="${k===p.hero}" aria-label="대표 사진">★</button></div>`;
  document.getElementById('sheetin').innerHTML =
    `<div class="sheet-head">
       <div class="day" style="color:${c}"><i style="background:${c}"></i>${day.label} · ${p.t}</div>
       <h2>${p.n}</h2><div class="jp">${p.j}</div>
     </div>
     <div class="photos${allPhotos?' all':''}">${ph}</div>
     ${p.ph > 8 ? `<button class="more" id="more">${allPhotos ? '접기' : `사진 ${p.ph}장 모두 보기`}</button>` : ''}
     ${p.pay.length ? `<div class="paid">${p.pay.map(r=>
        `<div class="row"><b>${r[0]}</b><span class="amt">${r[1]}</span></div>`).join('')}</div>` : ''}`;
  sheet.classList.add('open');
  drawScreen();
}
function closeSheet(skipRedraw){
  sheet.classList.remove('open'); openIdx = -1; allPhotos = false;
  if (!skipRedraw) drawScreen();
}

mapover.addEventListener('click', e => {
  const g = e.target.closest('.pin');
  if (g) openPin(+g.dataset.i); else closeSheet();
});
mapover.addEventListener('keydown', e => {
  const g = e.target.closest('.pin');
  if (g && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); openPin(+g.dataset.i); }
});
document.addEventListener('keydown', e => { if(e.key==='Escape') closeSheet(); });
sheet.addEventListener('click', e => {
  if (e.target.closest('#more')){ allPhotos = !allPhotos; openPin(openIdx); return; }
  const b = e.target.closest('.star');
  if (!b) return;
  const stars = [...sheet.querySelectorAll('.star')];
  stars.forEach(s => s.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true');
  if (openIdx >= 0) { PLACES[openIdx].hero = stars.indexOf(b); posterRefresh(); buildExpand(); }
});

/* ── 아래로 밀어서 닫기 ── */
(function dragToClose(){
  let y0 = null, x0 = null, dragging = false, fromTop = 0, dy = 0;
  sheet.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    y0 = e.clientY; x0 = e.clientX; dy = 0; dragging = false;
    fromTop = sheet.scrollTop;
  });
  sheet.addEventListener('pointermove', e => {
    if (y0 == null) return;
    const d = e.clientY - y0, dx = e.clientX - x0;
    if (!dragging){
      if (Math.abs(d) < 6 && Math.abs(dx) < 6) return;
      // 손잡이·제목에서 시작했거나, 시트가 맨 위일 때만 닫기 제스처로 본다
      const onHandle = !!e.target.closest('.grab, .sheet-head');
      const vertical = Math.abs(d) > Math.abs(dx);
      if (d > 0 && vertical && (onHandle || fromTop <= 0)){
        dragging = true;
        sheet.style.transition = 'none';
        try { sheet.setPointerCapture(e.pointerId); } catch(_){}
      } else { y0 = null; return; }
    }
    dy = Math.max(0, d);
    sheet.style.transform = `translateY(${dy}px)`;
    e.preventDefault();
  }, {passive:false});
  const end = () => {
    if (dragging){
      sheet.style.transition = ''; sheet.style.transform = '';
      if (dy > Math.min(110, sheet.offsetHeight * 0.28)) closeSheet();
    }
    y0 = null; dragging = false; dy = 0;
  };
  sheet.addEventListener('pointerup', end);
  sheet.addEventListener('pointercancel', end);
})();

/* ══════════ 인쇄 포스터 — 삿포로 + 비에이 한 장 ══════════ */
const MAXCARD = 7;   // 한쪽에 세울 사진 카드 수

/* 같은 장소를 여러 번 갔으면 하나로 합친다 (사진이 가장 많은 방문을 대표로) */
function mergeSpots(R){
  const byKey = new Map();
  placesOf(R.key).forEach(({p,i}) => {
    const k = p.lat.toFixed(4) + ',' + p.lon.toFixed(4);   // 실제로는 60m 반경 병합
    const o = byKey.get(k);
    if (o){ o.ph += p.ph; o.days.add(p.d); if (p.ph > o.bestPh){ o.bestPh = p.ph; o.src = i; o.n = p.n; } }
    else byKey.set(k, {...p, days:new Set([p.d]), bestPh:p.ph, src:i});
  });
  return [...byKey.values()].map(p => {
    const [x,y] = R.px(p.lat,p.lon);
    return {...p, x, y};
  }).sort((a,b) => a.y - b.y);
}

function drawPanel(R, side, baseEl, overEl){
  const spots = mergeSpots(R);
  // 카드는 사진 많은 곳 우선 — 자리 이상으로는 세우지 않는다
  const rank = [...spots].sort((a,b)=>b.ph-a.ph).slice(0, MAXCARD);
  const carded = spots.filter(s => rank.includes(s));

  // 패널의 실제 가로세로비에 viewBox를 맞춘다 (레터박스 없이)
  const box = overEl.parentElement.getBoundingClientRect();
  const A = (box.width && box.height) ? box.width/box.height : 0.9;
  const MF = 0.30;                                   // 사진 여백이 패널 가로의 30%
  const [bx,by,bw,bh] = fit(R.map, spots.map(s=>[s.x,s.y]), R.kind==='rural'?60:60,
                            1/(A*(1-MF)), false);
  // viewBox(가로 bw+M / 세로 bh*1.04)가 패널 비율 A와 정확히 맞아야 레터박스가 안 생긴다
  const M  = Math.max(bw*MF/(1-MF), bh*1.04*A - bw);
  const FS = bh*0.019;                               // 라벨 글자
  const N  = Math.max(1, carded.length);
  const GAP = bh*0.008;                              // 카드 사이 숨구멍
  // 카드 N개가 이름·날짜까지 세로로 다 들어가도록 한 변을 줄인다 (겹쳐서 라벨이 가리는 것 방지)
  const CW = Math.min(M*0.62, bw*0.5, bh/N - FS*2.9 - GAP);
  const SLOT = CW + FS*2.9;                          // 사진 + 이름 + 날짜
  const step = SLOT + GAP;                           // 다음 카드까지 — 절대 겹치지 않는다

  let prev = -1e9;
  carded.forEach(s => {
    s.cy = Math.max(s.y - CW/2, prev + step);
    prev = s.cy;
    s.cx = side==='L' ? bx - M + (M-CW)*0.38 : bx + bw + M - CW - (M-CW)*0.38;
  });
  // 위에서 밀어 넣다 보면 아래로 넘칠 수 있다 — 아래에서부터 되밀어 올려 박스 안에 가둔다.
  // step*N <= bh 이므로 이 패스는 순서·간격을 지키면서 항상 [by, by+bh] 안에 들어온다.
  let next = by + bh - SLOT;
  for (let i = carded.length - 1; i >= 0; i--){
    carded[i].cy = Math.min(carded[i].cy, next);
    next = carded[i].cy - step;
  }

  let grads = '', g = '';
  // 카드 없는 곳도 핀은 찍는다
  spots.filter(s => !carded.includes(s)).forEach(s => {
    g += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(bh*0.0058).toFixed(2)}"
            fill="var(${CAT[s.k].c})" stroke="var(--pin-stroke)" stroke-width="${(bh*0.0022).toFixed(2)}"/>`;
  });
  carded.forEach((s,n) => {
    const c = `var(${CAT[s.k].c})`;
    const [h1,h2] = hue(s.src*7 + PLACES[s.src].hero);
    const gid = `pg-${R.key}-${n}`;
    grads += `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h1} 34% 62%)"/><stop offset="1" stop-color="hsl(${h2} 30% 41%)"/></linearGradient>`;

    // 핀 → 사진 모서리로 잇는 실
    const ax = side==='L' ? s.cx + CW : s.cx;
    const ay = s.cy + CW/2;
    g += `<path class="leader" d="M${s.x.toFixed(1)},${s.y.toFixed(1)} L${((s.x+ax)/2).toFixed(1)},${ay.toFixed(1)} L${ax.toFixed(1)},${ay.toFixed(1)}"/>`;
    g += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(bh*0.0072).toFixed(2)}" fill="${c}" stroke="var(--pin-stroke)" stroke-width="${(bh*0.0026).toFixed(2)}"/>`;

    // 대표 사진
    g += `<rect x="${s.cx.toFixed(1)}" y="${s.cy.toFixed(1)}" width="${CW.toFixed(1)}" height="${CW.toFixed(1)}"
            rx="${(CW*0.06).toFixed(1)}" fill="url(#${gid})"/>`;
    g += `<rect x="${s.cx.toFixed(1)}" y="${(s.cy+CW-CW*0.13).toFixed(1)}" width="${(CW*0.13).toFixed(1)}" height="${(CW*0.13).toFixed(1)}" fill="${c}"/>`;

    // 이름 · 날짜
    const tx = (s.cx + CW/2).toFixed(1);
    g += `<text class="lbl" x="${tx}" y="${(s.cy+CW+FS*1.35).toFixed(1)}" font-size="${FS.toFixed(1)}" text-anchor="middle">${s.n}</text>`;
    g += `<text class="lbl-sub" x="${tx}" y="${(s.cy+CW+FS*2.55).toFixed(1)}" font-size="${(FS*0.8).toFixed(1)}" text-anchor="middle">${[...s.days].map(d=>'9/'+d).join(' · ')}</text>`;
  });

  const vx = side==='L' ? bx - M : bx;
  const pvb = `${vx.toFixed(1)} ${(by-bh*0.02).toFixed(1)} ${(bw+M).toFixed(1)} ${(bh*1.04).toFixed(1)}`;
  baseEl.setAttribute('viewBox', pvb); overEl.setAttribute('viewBox', pvb);
  if (baseEl.dataset.g !== R.key){ baseEl.innerHTML = terrainOf(R); baseEl.dataset.g = R.key; }
  const psc = Math.max(0.6, bw/430);
  overEl.innerHTML = `<defs>${grads}</defs>${landmarkArt(R,psc)}${g}${landmarkLabels(R,psc)}`;
  return spots;
}

function drawPoster(){
  const a = drawPanel(REGIONS.sapporo, 'L',
    document.getElementById('pbase-s'), document.getElementById('pover-s'));
  const b = drawPanel(REGIONS.biei, 'R',
    document.getElementById('pbase-b'), document.getElementById('pover-b'));

  const used = new Set([...a,...b].map(s => s.k));
  let leg = Object.entries(CAT).filter(([k]) => used.has(k))
    .map(([,v]) => `<div><i style="background:var(${v.c})"></i><b>${v.n}</b></div>`).join('');
  leg += ['밀','라벤더','감자'].map((n,i) =>
    `<div><i class="sq" style="background:var(--${['wheat','lav','potato'][i]})"></i><b>${n}밭</b></div>`).join('');
  document.getElementById('plegend').innerHTML = leg;
}

/* ══════════ 펼쳐보기 — 날짜순, 지역 섞어서 ══════════ */
function buildExpand(){
  let html = '';
  DAYS.forEach(d => {
    const list = PLACES.map((p,i)=>({p,i})).filter(o => o.p.d === d.id)
      .sort((x,y) => x.p.t.localeCompare(y.p.t));
    if (!list.length) return;
    const c = `var(${d.c})`;
    html += `<section class="daysec"><div class="daybar">
        <i style="background:${c}"></i><b>${d.label}</b><span>${d.note}</span>
        <em>${list.length}곳 · 사진 ${list.reduce((a,o)=>a+o.p.ph,0)}</em></div>`;
    list.forEach(({p,i}) => {
      const shown = Math.min(p.ph, 6);
      let ph = '';
      for (let k=0;k<shown;k++)
        ph += `<div class="ph${k===p.hero?' hero':''}">${thumb(i*7+k)}</div>`;
      if (p.ph > shown) ph += `<div class="count">+${p.ph-shown}</div>`;
      html += `<article class="spot">
          <div class="top"><span class="tm">${p.t}</span>
            <div><h3>${p.n}</h3><div class="jp">${p.j}</div></div>
            <span class="rg">${REGIONS[p.g].name}</span></div>
          ${p.ph ? `<div class="exphotos">${ph}</div>` : ''}
        </article>`;
    });
    html += `</section>`;
  });
  document.getElementById('exbody').innerHTML = html;
}

/* ══════════ 탭 ══════════ */
const TABS = {
  screen: [document.getElementById('t-screen'), document.getElementById('screen'), 'off'],
  expand: [document.getElementById('t-expand'), document.getElementById('expand'), 'on'],
  print:  [document.getElementById('t-print'),  document.getElementById('printview'), 'on']
};
function tab(which){
  for (const [k,[btn,el,cls]] of Object.entries(TABS)){
    const on = k === which;
    btn.setAttribute('aria-selected', String(on));
    el.classList.toggle(cls, cls === 'on' ? on : !on);
  }
  document.getElementById('intro').style.display = which==='screen' ? '' : 'none';
  closeSheet(which !== 'screen');
  window.scrollTo({top:0});
  if (which === 'print') requestAnimationFrame(drawPoster);   // 패널 크기 잡힌 뒤에
}
for (const k of Object.keys(TABS)) TABS[k][0].onclick = () => tab(k);

/* 인쇄 탭이 열려 있을 때만 포스터를 다시 그린다 (패널 크기를 재야 하므로) */
function posterRefresh(){
  if (TABS.print[1].classList.contains('on')) drawPoster();
}

/* ── 주소로 바로 열기 — #biei · #print · #expand ── */
function applyHash(){
  const h = (location.hash || '').replace('#','');
  if (h === 'biei' || h === 'sapporo') setRegion(h);
  else if (h === 'print' || h === 'expand') tab(h);
}
addEventListener('hashchange', applyHash);

/* 창 크기가 바뀌면 포스터 패널 비율이 달라진다 */
let rt;
addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => { if (TABS.print[1].classList.contains('on')) drawPoster(); }, 160);
});

drawScreen();
buildExpand();
openPin(1);
applyHash();
