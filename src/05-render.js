/* ══ 공용 defs 한 번만 ══ */
document.getElementById('sharedefs').innerHTML = defs('bm');

/* ══ 사진 ══
   드라이브 파일 id 가 있으면 실제 썸네일, 없으면 색 타일로 자리만 잡는다. */
const photoUrl = (id, w) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`;

/* 사진 한 장의 주소 — 드라이브 파일 id 가 원칙이고,
   샘플 사진(01-data.js sampleShots)은 src 를 직접 들고 온다.
   src 안의 {w} 는 여기서 요청 폭으로 바뀐다. */
function shotUrl(s, w){
  if (!s) return '';
  if (s.src) return String(s.src).replace(/\{w\}/g, w);
  return s.id ? photoUrl(s.id, w) : '';
}

function heroShot(p){
  if (!p.shots || !p.shots.length) return null;
  return p.shots[p.hero] || p.shots[0];
}
function tile(seed){
  const h = (seed*47)%360, h2 = (h+38)%360;
  return `<div class="im" style="background:linear-gradient(${140+seed*13%80}deg,hsl(${h} 34% 62%),hsl(${h2} 30% 41%))"></div>`;
}
/* 시트·펼쳐보기에 들어갈 사진 한 장 */
function shotImg(p, k, seed, w){
  const u = shotUrl(p.shots && p.shots[k], w);
  return u
    ? `<img class="im" loading="lazy" decoding="async" src="${u}" alt="">`
    : tile(seed);
}
function hue(seed){ return [(seed*47)%360, (seed*47+38)%360]; }

/* ══ 라이트박스 — 사진을 화면 가득 ══
   인쇄 포스터의 대표 사진(SVG <image>)과 시트의 썸네일에서 열린다.
   같은 장소의 사진끼리 좌우로 넘길 수 있게 한 장소의 shots 를 한 묶음으로 넘긴다. */
let lbNode = null;                    // 열려 있는 라이트박스 — 시트의 ESC 를 막는 데도 쓴다

function openLightbox(srcs, idx){
  if (!srcs.length) return;
  closeLightbox();
  let cur = Math.max(0, Math.min(idx | 0, srcs.length - 1));
  const many = srcs.length > 1;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML =
      `<button class="lightbox-close" aria-label="닫기">✕</button>`
    + (many ? `<button class="lightbox-arrow lightbox-prev" aria-label="이전 사진">‹</button>` : '')
    + `<img src="" alt="">`
    + (many ? `<button class="lightbox-arrow lightbox-next" aria-label="다음 사진">›</button>` : '')
    + (many ? `<div class="lightbox-count"></div>` : '');
  document.body.appendChild(lb);

  const img = lb.querySelector('img');
  const cnt = lb.querySelector('.lightbox-count');
  const go = d => {
    cur = (cur + d + srcs.length) % srcs.length;
    img.src = srcs[cur];
    if (cnt) cnt.textContent = `${cur+1} / ${srcs.length}`;
  };
  go(0);

  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });   // 배경만
  lb.querySelector('.lightbox-prev')?.addEventListener('click', e => { e.stopPropagation(); go(-1); });
  lb.querySelector('.lightbox-next')?.addEventListener('click', e => { e.stopPropagation(); go(1); });

  lb._key = e => {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft'  && many){ e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight' && many){ e.preventDefault(); go(1); }
  };
  document.addEventListener('keydown', lb._key);
  lb._prevOv = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';   // 뒤 페이지가 따라 스크롤되지 않게
  lbNode = lb;
}

function closeLightbox(){
  if (!lbNode) return;
  document.removeEventListener('keydown', lbNode._key);
  document.documentElement.style.overflow = lbNode._prevOv;
  lbNode.remove();
  lbNode = null;
}

/* 한 장소의 사진 목록 — 원본 shots 순번(k)을 같이 들고 다녀야 시트에서 누른 장을 찾을 수 있다 */
function lbShots(p){
  return (p.shots || [])
    .map((s,k) => ({k, url: shotUrl(s, 1600)}))
    .filter(o => o.url);
}
/* i 번째 장소의 사진을 연다 — k 를 주면 그 장부터, 없으면 대표 사진부터 */
function openPlacePhotos(i, k){
  const p = PLACES[i];
  if (!p) return;
  const list = lbShots(p);
  if (!list.length) return;                             // 색 타일(사진 없음)은 열지 않는다
  const want = k == null ? (p.hero || 0) : k;
  const at = list.findIndex(o => o.k === want);
  openLightbox(list.map(o => o.url), at < 0 ? 0 : at);
}

/* ══ 전체 사진 갤러리 — 인쇄 탭 포스터를 누르면 열린다 ══
   포스터에는 장소마다 대표 사진 한 장만 올라간다. 나머지 사진을
   지역 · 날짜 순으로 한 번에 훑어보게 하는 층이다.
   한 장소에 6장까지 늘어놓고, 넘치는 만큼은 「+N」 타일이 라이트박스로 잇는다. */
let galNode = null;                   // 열려 있는 갤러리
const GAL_MAX = 6;                    // 한 장소에 늘어놓는 썸네일 정원

/* 갤러리 본문 — 포스터와 같은 지역 순서(삿포로 → 오타루 → 비에이)로 */
function galleryBody(){
  let html = '';
  PANELS.forEach(pn => {
    const R = REGIONS[pn.key];
    // 사진이 실제로 붙어 있는 장소만 — 색 타일로만 채워진 자리는 건너뛴다
    const list = placesOf(pn.key)
      .map(({p,i}) => ({p, i, shots:(p.shots || [])
        .map((s,k) => ({k, u:shotUrl(s, 400)})).filter(o => o.u)}))
      .filter(o => o.shots.length);
    if (!list.length) return;

    const days = [...new Set(list.map(o => o.p.d))].sort(dayCmp);
    html += `<section class="gallery-region">`
      + `<h3>${R.name} ${R.jp}${days.length ? ` · ${days.join(' · ')}` : ''}</h3>`
      + `<div class="gallery-spots">`;

    list.forEach(({p, i, shots}) => {
      const shown = shots.slice(0, GAL_MAX);
      html += `<div class="gallery-spot">`
        + `<p class="spot-name">${p.n}<span>${p.d}${p.t === '--:--' ? '' : ` · ${p.t}`}</span></p>`
        + `<div class="gallery-photos">`
        + shown.map(o =>
            `<img src="${o.u}" loading="lazy" decoding="async" alt=""
                  data-pi="${i}" data-k="${o.k}">`).join('')
        + (shots.length > shown.length
            ? `<button class="gallery-more" data-pi="${i}" data-k="${shots[shown.length].k}"
                 aria-label="${p.n} 사진 더 보기">+${shots.length - shown.length}</button>`
            : '')
        + `</div></div>`;
    });
    html += `</div></section>`;
  });
  return html;
}

function openGallery(){
  if (galNode) return;
  const body = galleryBody();
  const g = document.createElement('div');
  g.className = 'gallery-modal';
  g.id = 'galleryModal';
  g.setAttribute('role', 'dialog');
  g.setAttribute('aria-label', '여행 사진 모아보기');
  g.innerHTML = `<button class="gallery-close" aria-label="닫기">✕</button>`
    + `<div class="gallery-inner"><h2>📸 여행 사진 모아보기</h2>`
    + (body || `<p class="gallery-empty">아직 사진이 없어요.<br>드라이브 「삿포로여행_사진」 폴더에 사진을 올려주세요.</p>`)
    + `</div>`;
  document.body.appendChild(g);

  g.addEventListener('click', e => {
    const hit = e.target.closest('.gallery-photos img, .gallery-more');
    if (hit){ openPlacePhotos(+hit.dataset.pi, +hit.dataset.k); return; }
    if (e.target.closest('.gallery-close') || e.target === g) closeGallery();
  });
  // 라이트박스가 열려 있으면 ESC 는 그쪽이 먼저 받는다 (시트와 같은 규칙)
  g._key = e => { if (e.key === 'Escape' && !lbNode) closeGallery(); };
  document.addEventListener('keydown', g._key);
  g._prevOv = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';   // 뒤 포스터가 따라 스크롤되지 않게
  galNode = g;
}

function closeGallery(){
  if (!galNode) return;
  closeLightbox();                                      // 겹쳐 있던 사진도 같이 닫는다
  document.removeEventListener('keydown', galNode._key);
  document.documentElement.style.overflow = galNode._prevOv;
  galNode.remove();
  galNode = null;
}

/* 인쇄 탭 — 대표 사진(SVG <image> 라 img 가 아니다)은 그 장소만,
   지도 패널은 그 지역 지도를 전체 화면으로,
   그 밖의 포스터 여백은 전체 갤러리를 연다 */
document.getElementById('printview').addEventListener('click', e => {
  if (e.target.closest('#pvAll')){ openPosterView(null); return; }
  const im = e.target.closest('image[data-pi]');
  if (im){ openPlacePhotos(+im.dataset.pi); return; }
  const panel = e.target.closest('.p-panel[data-region]');
  // 🔴 예전에는 지도 탭의 지도를 통째로 옮겨 와서(openMapFullscreen) 두 탭이 같아 보였다.
  //    인쇄 탭에서는 「대표 사진이 붙은 인쇄본」을 그대로 크게 보여준다. (2026-09-09)
  if (panel){ openPosterView(panel.dataset.region); return; }
  if (e.target.closest('.poster')) openGallery();
});


/* ══ 캐릭터 만지기 — 끌기 · 꾹 누르기 · 지우기 ══════════════════
   ① 끌기      자리를 옮긴다. SVG 안이라 화면 좌표를 뷰박스 좌표로 바꿔야 한다.
                놓으면 상자 대비 0~1 비율로 저장해 두 사람이 같은 자리를 본다.
   ② 꾹 누르기 캐릭터 위 → 「캐릭터 변경」, 빈 곳 → 「캐릭터 추가」.
                살짝이라도 움직이면 끌기로 넘어간다 (타이머를 그때 끈다).
   ③ 지우기    캐릭터에 손을 얹으면 오른쪽 위에 ✕ 가 뜬다.

   🔴 모바일에서 끌기가 안 되던 이유 (2026-09-09)
      image.charmove 에 touch-action:none 을 써 두었지만 **SVG 자식 요소에는 touch-action 이
      먹지 않는다** — 브라우저는 CSS 박스를 만드는 요소에만 이 값을 본다. 그래서 손가락을
      대면 브라우저가 「페이지를 미는 중」으로 보고 첫 이동에서 포인터를 가져가며
      pointercancel 을 던졌고, 그게 drop() 을 불러 드래그가 시작하자마자 끝났다.
      (헤드리스 크롬 터치 재현: pointerdown → touchstart → touchmove → pointercancel)

      고친 방법 두 가지
      ① 캐릭터 위에서 시작한 touchstart 를 non-passive 로 받아 preventDefault 한다.
         touch-action 과 달리 이건 SVG 에서도 확실히 듣는다.
      ② 포인터 이벤트가 오다 말아도 끌리도록 알맹이(begin/drag/end)를 입력 종류와 분리했다.
         먼저 잡은 쪽(pointer 또는 touch)이 끝까지 끌고, 손가락이 다 떨어지면 반드시 끝난다. */
(function charDrag(){
  const SLOP    = 4;              // 이만큼 움직여야 「끄는 중」으로 본다 (탭 흔들림 무시)
  const HOLD_MS = 500;            // 이만큼 누르고 있으면 「꾹 누르기」
  let cur  = null;                // 지금 끌고 있는 캐릭터 — 한 번에 하나만
  let raf  = 0;
  let hold = 0;                   // 캐릭터 위 꾹 누르기 타이머
  let spot = null;                // 빈 곳 꾹 누르기 {x, y, t}

  function charAt(t){ return t && t.closest ? t.closest('image.charmove') : null; }

  function toUser(svg, x, y){
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = svg.createSVGPoint();
    p.x = x; p.y = y;
    return p.matrixTransform(m.inverse());
  }

  function pick(list, id){
    for (const t of list) if (id == null || t.identifier === id) return t;
    return null;
  }

  /* ── 입력 종류와 상관없는 알맹이 ── */
  function begin(im, x, y, opt){
    if (cur) return false;                       // 두 번째 손가락은 무시한다
    if (charPickNode) return false;              // 고르기 팝업이 떠 있는 동안은 안 끈다
    const svg = im.ownerSVGElement;
    if (!svg) return false;
    const q = toUser(svg, x, y);
    if (!q) return false;
    cur = {
      im: im, svg: svg, id: opt.id, src: opt.src,
      moved: false, sx: x, sy: y,
      dx: q.x - parseFloat(im.getAttribute('x')),
      dy: q.y - parseFloat(im.getAttribute('y')),
      w: parseFloat(im.dataset.w), h: parseFloat(im.dataset.h),
      bx: parseFloat(im.dataset.bx), by: parseFloat(im.dataset.by),
      bw: parseFloat(im.dataset.bw), bh: parseFloat(im.dataset.bh)
    };
    im.classList.add('dragging');
    /* 🔴 예전에는 document 에 pointermove 를 늘 걸어 두었다 — 지도를 밀 때마다 손가락 좌표를
          SVG 좌표로 바꾸는 계산이 따라붙어 스크롤이 걸렸다. 끌기 시작할 때만 붙인다. */
    document.addEventListener('pointermove',  onPointerMove, true);
    document.addEventListener('touchmove',    onTouchMove,   { passive:false, capture:true });
    document.addEventListener('touchend',     onTouchEnd,    true);
    document.addEventListener('touchcancel',  onTouchEnd,    true);
    holdArm();
    return true;
  }

  function drag(x, y){
    if (!cur) return;
    if (!cur.moved && Math.hypot(x - cur.sx, y - cur.sy) < SLOP) return;
    holdOff();                                      // 움직였으면 꾹 누르기가 아니다
    charXHide();
    const q = toUser(cur.svg, x, y);
    if (!q) return;
    cur.at = [Math.max(cur.bx, Math.min(cur.bx + cur.bw - cur.w, q.x - cur.dx)),
              Math.max(cur.by, Math.min(cur.by + cur.bh - cur.h, q.y - cur.dy))];
    cur.moved = true;
    if (!raf) raf = requestAnimationFrame(paint);   // 옮긴 자리는 프레임마다 한 번만 반영
  }

  function apply(c){
    if (!c || !c.at) return;
    c.im.setAttribute('x', c.at[0].toFixed(1));
    c.im.setAttribute('y', c.at[1].toFixed(1));
  }
  function paint(){ raf = 0; apply(cur); }

  /** 끌기를 접는다. 저장은 하지 않는다 — end() 와 꾹 누르기가 함께 쓴다. */
  function letGo(){
    const c = cur; cur = null;                      // 되불려도 한 번만 끝나게
    holdOff();
    document.removeEventListener('pointermove', onPointerMove, true);
    document.removeEventListener('touchmove',   onTouchMove,   true);
    document.removeEventListener('touchend',    onTouchEnd,    true);
    document.removeEventListener('touchcancel', onTouchEnd,    true);
    if (raf){ cancelAnimationFrame(raf); raf = 0; }
    if (c){
      apply(c);                                     // 마지막 좌표를 놓치지 않게 바로 반영
      c.im.classList.remove('dragging');
      try { c.im.releasePointerCapture(c.id); } catch (_) {}
    }
    return c;
  }

  function end(e){
    if (!cur) return;
    const c = letGo();
    if (c.moved){
      const x = parseFloat(c.im.getAttribute('x')), y = parseFloat(c.im.getAttribute('y'));
      const fx = c.bw - c.w > 0 ? (x - c.bx) / (c.bw - c.w) : 0;
      const fy = c.bh - c.h > 0 ? (y - c.by) / (c.bh - c.h) : 0;
      saveCharPos(c.im.dataset.ck, Math.max(0, Math.min(1, fx)), Math.max(0, Math.min(1, fy)));
      charToast('자리를 저장했어요 · 꾹 누르면 다른 캐릭터로');
      if (e){ e.preventDefault(); e.stopPropagation(); }
    }
  }

  /* ── 캐릭터를 꾹 누르면 「캐릭터 변경」 ── */
  function holdArm(){
    holdOff();
    hold = setTimeout(() => {
      hold = 0;
      if (!cur || cur.moved) return;
      const im = cur.im;
      letGo();                                      // 드래그는 취소하고 팝업만 남긴다
      charEatClick();                               // 뒤따라 오는 click 은 삼킨다
      const p = charKeyParts(im.dataset.ck);
      openCharPicker({ mode:'swap', where:p.where, region:p.region,
                       key: im.dataset.ck, current: im.dataset.sp });
    }, HOLD_MS);
  }
  function holdOff(){ if (hold){ clearTimeout(hold); hold = 0; } }

  /* ── 포인터 이벤트 ── */
  document.addEventListener('pointerdown', e => {
    const im = charAt(e.target);
    if (!im) return;
    if (!begin(im, e.clientX, e.clientY, { id: e.pointerId, src: 'pointer' })) return;
    e.preventDefault(); e.stopPropagation();      // 지도·인쇄본의 팬/줌이 같이 반응하지 않게
    try { im.setPointerCapture(e.pointerId); } catch (_) {}
  }, true);

  function onPointerMove(e){
    if (!cur || cur.src !== 'pointer' || e.pointerId !== cur.id) return;
    drag(e.clientX, e.clientY);
    e.preventDefault(); e.stopPropagation();
  }
  function onPointerEnd(e){
    if (!cur || cur.src !== 'pointer' || e.pointerId !== cur.id) return;
    end(e);
  }
  document.addEventListener('pointerup',     onPointerEnd, true);
  document.addEventListener('pointercancel', onPointerEnd, true);

  /* ── 터치 이벤트 — SVG 에 touch-action 이 안 먹는 걸 여기서 메운다 ── */
  document.addEventListener('touchstart', e => {
    const im = charAt(e.target);
    if (!im) return;
    // ★ 이 한 줄이 모바일 드래그의 핵심이다. 막지 않으면 브라우저가 스크롤로
    //   제스처를 가져가며 pointercancel 을 던져 드래그가 죽는다.
    if (e.cancelable) e.preventDefault();
    if (cur) return;                              // pointerdown 이 이미 잡았다
    const t = e.changedTouches[0];
    if (t) begin(im, t.clientX, t.clientY, { id: t.identifier, src: 'touch' });
  }, { passive:false, capture:true });

  function onTouchMove(e){
    if (!cur) return;
    if (e.cancelable) e.preventDefault();          // 끄는 동안 페이지가 따라 움직이지 않게
    if (cur.src !== 'touch') return;               // 좌표는 pointermove 가 이미 대고 있다
    const t = pick(e.changedTouches, cur.id);
    if (t) drag(t.clientX, t.clientY);
  }
  function onTouchEnd(e){
    if (!cur) return;
    if (e.touches && e.touches.length) return;     // 아직 남은 손가락이 있다
    end(e);                                        // pointerup 이 안 와도 여기서 반드시 끝난다
  }

  /* ── 지도 빈 곳을 꾹 누르면 「캐릭터 추가」 ──
        캐릭터·핀·겹쳐 둔 단추 위에서 시작한 건 빼고, 정말 빈 지면만 센다.
        캐릭터는 mapillust 레이어(원점 0,0)에 서므로 그 좌표계로 눌린 곳을 옮겨 둔다. */
  function spotOff(){ if (spot){ clearTimeout(spot.t); spot = null; } }

  /* 🔴 mapwrap 은 이 파일 아래쪽에서 const 로 잡힌다 — 여기서 바로 쓰면 초기화 전 참조다.
        document 에 걸고 눌린 곳이 지도 안인지 그때 확인한다. 전체 화면으로 옮겨 가도 그대로 듣는다. */
  document.addEventListener('pointerdown', e => {
    spotOff();
    if (charPickNode || cur || charAt(e.target)) return;
    if (!e.target.closest || !e.target.closest('.mapwrap')) return;
    // .mapstate(사진 없음·불러오는 중 안내)는 막지 않는다 — 사진이 한 장도 없는 여행 첫날에도
    // 캐릭터는 세울 수 있어야 하는데, 그때가 바로 저 안내가 지도를 덮고 있는 때다.
    if (e.target.closest('.pin, .regionsw, .scalebar, button, a')) return;
    const x = e.clientX, y = e.clientY;
    spot = { x: x, y: y, t: setTimeout(() => {
      spot = null;
      const q = toUser(mapillust, x, y);
      charEatClick();                              // 손을 떼며 나는 click 이 시트를 닫지 않게
      openCharPicker({ mode:'add', where:'map', region: current,
                       at: q ? [q.x, q.y] : null });
    }, HOLD_MS) };
  }, true);

  document.addEventListener('pointermove', e => {
    if (spot && Math.hypot(e.clientX - spot.x, e.clientY - spot.y) > SLOP) spotOff();
  }, true);
  ['pointerup','pointercancel'].forEach(t => document.addEventListener(t, spotOff, true));
  addEventListener('scroll', spotOff, true);
})();

/* ── 알림 한 줄 ── */
function charToast(msg){
  let t = document.getElementById('charToast');
  if (!t){
    t = document.createElement('div');
    t.id = 'charToast'; t.className = 'char-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), 2200);
}

/* 꾹 누르고 손을 떼면 click 이 따라 나온다 — 그게 시트를 닫거나 인쇄본을 열지 않게 한 번 삼킨다.
   팝업 안의 클릭은 통과시킨다 (팝업을 바로 누를 수도 있어야 하므로). */
function charEatClick(){
  const kill = e => {
    if (e.target.closest && e.target.closest('.char-pick')) return;
    e.preventDefault(); e.stopPropagation();
  };
  document.addEventListener('click', kill, true);
  setTimeout(() => document.removeEventListener('click', kill, true), 400);
}

/* 캐릭터를 손댄 뒤 다시 그린다 — 지금 보고 있는 화면만 */
function charRedraw(){
  charXHide();
  if (!fsNode && TABS.print[1].classList.contains('on')) posterRefresh();
  else drawScreen();
}

/* ══ 지우기 단추 ══════════════════════════════════════════════
   SVG 안에 넣으면 끌 때마다 같이 옮겨야 하고 터치 타겟도 작아진다.
   화면 위에 뜬 HTML 단추 하나를 캐릭터 오른쪽 위로 옮겨 다니게 한다.
   단추는 SVG 밖이라 charmove 로 잡히지 않는다 — 눌러도 끌기가 시작되지 않는다. */
let charXBtn = null, charXFor = null;

function charXEl(){
  if (charXBtn) return charXBtn;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'char-x';
  b.setAttribute('aria-label', '이 캐릭터 지우기');
  b.innerHTML = '<i aria-hidden="true">✕</i>';
  b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const im = charXFor;
    charXHide();
    if (!im || !im.dataset.ck) return;
    const key = im.dataset.ck;
    im.remove();                        // 다시 그리기 전에 눈에서 먼저 사라지게
    charRemove(key);
    charToast('캐릭터를 삭제했어요 · 빈 곳을 꾹 누르면 다시 추가');
    charRedraw();
  });
  document.body.appendChild(b);
  return (charXBtn = b);
}

function charXShow(im){
  if (charPickNode) return;
  const r = im.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const b = charXEl();
  charXFor = im;
  b.dataset.ck = im.dataset.ck;
  b.style.left = Math.max(2, Math.min(innerWidth  - 46, r.right - 30)) + 'px';
  b.style.top  = Math.max(2, Math.min(innerHeight - 46, r.top   - 12)) + 'px';
  b.classList.add('on');
}
function charXHide(){
  charXFor = null;
  if (charXBtn) charXBtn.classList.remove('on');
}

/* 마우스는 얹으면, 손가락은 대면 뜬다 — 둘 다 pointerover 하나로 받는다 */
document.addEventListener('pointerover', e => {
  if (!e.target || !e.target.closest) return;
  const im = e.target.closest('image.charmove');
  if (im){ charXShow(im); return; }
  if (e.target.closest('.char-x')) return;        // 단추 위로 건너간 것뿐이다
  charXHide();
}, true);
document.addEventListener('pointerdown', e => {   // 딴 데를 누르면 접는다
  if (e.target && e.target.closest &&
      (e.target.closest('.char-x') || e.target.closest('image.charmove'))) return;
  charXHide();
}, true);
addEventListener('scroll', charXHide, true);
addEventListener('resize', charXHide);

/* ══ 캐릭터 고르기 팝업 ════════════════════════════════════════
   빈 곳을 꾹 누르면 「추가」, 캐릭터를 꾹 누르면 「변경」으로 열린다.
   SVG 안에 그리면 크기·글꼴이 지도 배율에 끌려 다닌다 — 화면 위에 얹는 HTML 로 둔다. */
let charPickNode = null;

function closeCharPicker(){
  if (!charPickNode) return;
  document.removeEventListener('keydown', charPickNode._key, true);
  charPickNode.remove();
  charPickNode = null;
}

function openCharPicker(o){
  closeCharPicker();
  charXHide();
  if (typeof SPRITES === 'undefined') return;
  const add  = o.mode === 'add';
  const here = charPlacedSprites(o.where, o.region);
  /* 추가는 그 지역 소품 목록이 기본이다. 주인공·얼굴 컷도 뒤에 붙여
     한 번 지운 뒤에도 다시 불러올 수 있게 한다. 변경은 전체 목록. */
  const keys = (add ? (EXTRA_CHARS[o.region] || []).concat([CHAR_OF[o.region], FACE_OF[o.region]])
                    : CHAR_PICK_ALL)
    .filter((k, i, a) => k && SPRITES[k] && a.indexOf(k) === i);
  if (!keys.length) return;

  const items = keys.map(k => {
    const on  = !add && k === o.current;
    const dim = add && here.indexOf(k) >= 0;
    return `<button type="button" class="cpick-it${on ? ' on' : ''}${dim ? ' dim' : ''}"
        data-k="${k}" aria-pressed="${on}">
        <img src="${charSrc(k)}" alt=""><span>${charName(k)}</span></button>`;
  }).join('');

  const el = document.createElement('div');
  el.className = 'char-pick';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', add ? '추가할 캐릭터 선택' : '캐릭터 변경');
  el.innerHTML =
    `<div class="cpick-back"></div>
     <div class="cpick-panel">
       <div class="cpick-head">
         <b>${add ? '추가할 캐릭터 선택' : '캐릭터 변경'}</b>
         <button type="button" class="cpick-close" aria-label="닫기">✕</button>
       </div>
       <div class="cpick-grid">${items}</div>
       <p class="cpick-note">${add
          ? '이미 서 있는 캐릭터는 흐리게 보여요 — 눌러서 하나 더 세울 수도 있어요'
          : '고른 컷이 같은 자리에 대신 섭니다'}</p>
     </div>`;
  document.body.appendChild(el);
  charPickNode = el;

  el.addEventListener('click', e => {
    if (e.target.closest('.cpick-close') || e.target.classList.contains('cpick-back')){
      closeCharPicker(); return;
    }
    const b = e.target.closest('.cpick-it');
    if (!b) return;
    const k = b.dataset.k;
    closeCharPicker();
    if (add){
      charPutNear(o.where, o.region, k, o.at);
    } else {
      charSwap(o.key, k);
      charToast(`${charName(k)} 캐릭터로 바꿨어요`);
      charRedraw();
    }
  });
  el._key = ev => {
    if (ev.key === 'Escape'){ ev.stopPropagation(); closeCharPicker(); }
  };
  document.addEventListener('keydown', el._key, true);   // 시트 닫기보다 먼저 잡는다
  requestAnimationFrame(() => el.classList.add('on'));
}

/* 지금 그려져 있는 지도의 장애물 — 꾹 눌러 캐릭터를 더할 때 다시 잰다 */
function charObsNow(){
  const R = REGIONS[current];
  const v = mapover.viewBox.baseVal;
  const vb = [v.x, v.y, v.width, v.height];
  return placesOf(current).map(({p}) => { const q = R.px(p.lat, p.lon); return [q[0]-vb[0], q[1]-vb[1]]; })
    .concat(R.marks.map(m => { const q = R.px(m.lat, m.lon); return [q[0]-vb[0], q[1]-vb[1]]; }))
    .concat(overlayObs(vb));
}
/* 이미 서 있는 캐릭터 자리 — 그려진 것에서 그대로 읽는다 */
function charTakenNow(){
  return [...mapillust.querySelectorAll('image.charmove')].map(im => ({
    x: parseFloat(im.getAttribute('x')), y: parseFloat(im.getAttribute('y')),
    w: parseFloat(im.dataset.w),         h: parseFloat(im.dataset.h) }));
}

/** 꾹 누른 자리에서 가장 가까운 빈 자리에 세운다 (빈 자리 고르기는 freeSpots 그대로) */
function charPutNear(where, region, sprite, at){
  const s = (typeof SPRITES !== 'undefined') && SPRITES[sprite];
  if (!s) return;
  const v = mapillust.viewBox.baseVal;
  const box = [0, 0, v.width, v.height];
  const h = v.width * 0.125, w = h * s.w / s.h;   // 소품과 같은 눈높이
  /* 자리 고르기는 세 걸음이다.
     ① 꾹 누른 그 자리 — 거기 세우려고 거기를 눌렀다.
     ② 거기가 이미 찼으면 둘레를 한 바퀴씩 넓혀 가며 바로 옆의 빈 자리.
     ③ 그래도 없으면 freeSpots() 에게 물어 지도에서 가장 빈 자리를 받되,
        누른 곳에서 먼 만큼을 점수에 더해 그중 가까운 쪽을 고른다.
        (상자를 가로지르는 거리가 40점 — 겹침 100점보다는 싸고 이름표 몇 개보다는 비싸다) */
  const taken = charTakenNow();
  const fit  = (x, y) => ({ x: Math.max(box[0], Math.min(box[0] + box[2] - w, x)),
                            y: Math.max(box[1], Math.min(box[1] + box[3] - h, y)) });
  const clash = c => c && taken.some(u =>
    Math.abs((c.x + w/2) - (u.x + u.w/2)) < (w + u.w)/2 &&
    Math.abs((c.y + h/2) - (u.y + u.h/2)) < (h + u.h)/2);

  let best = at ? fit(at[0] - w/2, at[1] - h/2) : null;
  if (at && clash(best)){
    best = null;
    for (const r of [0.75, 1.1, 1.6]){                       // 캐릭터 크기의 몇 배만큼 벌린다
      for (let i = 0; i < 8 && !best; i++){
        const th = i * Math.PI / 4;
        const c = fit(at[0] - w/2 + Math.cos(th)*w*r, at[1] - h/2 + Math.sin(th)*h*r);
        if (!clash(c)) best = c;
      }
      if (best) break;
    }
  }
  if (!best){
    const cands = freeSpots(box, w, h, charObsNow(), 999, taken);
    best = cands[0];
    if (at && cands.length){
      const diag = Math.hypot(box[2], box[3]) || 1;
      const cost = c => c.score + 40 * Math.hypot(c.x + w/2 - at[0], c.y + h/2 - at[1]) / diag;
      cands.forEach(c => { if (cost(c) < cost(best)) best = c; });
    }
  }
  const key = charAdd(where, region, sprite);
  if (best){
    const fx = box[2] - w > 0 ? (best.x - box[0]) / (box[2] - w) : 0;
    const fy = box[3] - h > 0 ? (best.y - box[1]) / (box[3] - h) : 0;
    saveCharPos(key, Math.max(0, Math.min(1, fx)), Math.max(0, Math.min(1, fy)));
  }
  charToast(`${charName(sprite)} 캐릭터를 세웠어요`);
  charRedraw();
}

/* ══ 인쇄본 크게 보기 — 확대·이동 ══════════════════════════════
   지도 탭을 끌어오지 않는다. 인쇄 탭에 이미 그려진 패널(대표 사진·연결선까지)을
   그대로 옮겨 와 확대해 본다. 지역 하나만(key) 또는 세 지역 전체(null).
   복제하지 않고 「옮겼다가 되돌린다」 — clipPath·그라데이션 id 가 겹치면 원본이 깨진다. */
let pvNode = null;

function openPosterView(key){
  if (pvNode) return;
  const src = key ? document.querySelector(`.p-panel[data-region="${key}"]`)
                  : document.querySelector('.poster');
  if (!src) return;

  const pv = document.createElement('div');
  pv.className = 'poster-view' + (key ? ' one' : ' all');
  pv.setAttribute('role', 'dialog');
  pv.setAttribute('aria-label', key ? '지도 크게 보기' : '인쇄본 크게 보기');
  pv.innerHTML =
      `<div class="pv-bar">
         <span class="pv-title">${key ? (REGIONS[key] ? REGIONS[key].name || key : key) : '인쇄본 전체'}</span>
         <button class="pv-zoom" data-z="out" aria-label="축소">−</button>
         <button class="pv-zoom" data-z="reset" aria-label="원래 크기">100%</button>
         <button class="pv-zoom" data-z="in" aria-label="확대">＋</button>
         <button class="pv-close" aria-label="닫기">✕</button>
       </div>
       <div class="pv-wrap"><div class="pv-stage"></div></div>
       <p class="pv-hint">두 손가락으로 확대 · 끌어서 이동 · 두 번 누르면 확대/축소</p>`;
  document.body.appendChild(pv);

  pv._at = [src.parentNode, src.nextSibling];
  pv._src = src;
  pv.querySelector('.pv-stage').appendChild(src);

  pv._prevOv = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  pv._key = e => {
    if (e.key !== 'Escape' || lbNode) return;
    e.stopPropagation(); closePosterView();
  };
  document.addEventListener('keydown', pv._key, true);
  pv.querySelector('.pv-close').addEventListener('click', closePosterView);
  pv.addEventListener('click', e => {
    const z = e.target.closest('.pv-zoom');
    if (z){ zoomBy(z.dataset.z); return; }
    if (pv._moved) return;                       // 끌고 나서의 클릭은 무시
    const im = e.target.closest('image[data-pi]');
    if (im) openPlacePhotos(+im.dataset.pi);
  });

  pvNode = pv;
  setupPanZoom(pv);
  // 새 상자 크기에 맞춰 다시 잰다 — 한 지역만 열어도 레터박스가 안 생기게
  requestAnimationFrame(posterRefresh);
}

function closePosterView(){
  if (!pvNode) return;
  const pv = pvNode; pvNode = null;
  closeLightbox();
  document.removeEventListener('keydown', pv._key, true);
  document.documentElement.style.overflow = pv._prevOv;
  pv._at[0].insertBefore(pv._src, pv._at[1]);
  pv.remove();
  posterRefresh();                               // 원래 상자 크기로 다시 잰다
}

/* 확대·이동 — 휠·핀치·드래그·더블탭 */
let PV = { s:1, x:0, y:0 };
function pvApply(){
  if (!pvNode) return;
  const st = pvNode.querySelector('.pv-stage');
  st.style.transform = `translate(${PV.x}px,${PV.y}px) scale(${PV.s})`;
  const b = pvNode.querySelector('.pv-zoom[data-z="reset"]');
  if (b) b.textContent = Math.round(PV.s*100) + '%';
}
function pvClamp(){ PV.s = Math.min(6, Math.max(0.5, PV.s)); }
function zoomBy(kind){
  if (kind === 'reset'){ PV = {s:1,x:0,y:0}; }
  else { PV.s *= (kind === 'in' ? 1.35 : 1/1.35); pvClamp(); }
  pvApply();
}

function setupPanZoom(pv){
  PV = { s:1, x:0, y:0 }; pvApply();
  const wrap = pv.querySelector('.pv-wrap');
  const pts = new Map();
  let start = null, lastTap = 0;

  /* 손가락 한 개면 그 점, 두 개면 가운데 점과 두 점 사이 거리 */
  function gesture(){
    const a = [...pts.values()];
    if (!a.length) return null;
    if (a.length === 1) return { cx:a[0].x, cy:a[0].y, d:0 };
    return { cx:(a[0].x+a[1].x)/2, cy:(a[0].y+a[1].y)/2,
             d: Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y) };
  }
  function anchor(){
    const g = gesture();
    if (!g) return;
    start = { cx:g.cx, cy:g.cy, d:g.d, s:PV.s, x:PV.x, y:PV.y };
  }

  wrap.addEventListener('pointerdown', e => {
    pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (pts.size === 1) pv._moved = false;
    anchor();
    wrap.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const g = gesture();
    if (!g) return;

    if (pts.size >= 2 && start.d > 0){
      PV.s = start.s * (g.d / start.d);
      pvClamp();
    }
    PV.x = start.x + (g.cx - start.cx);
    PV.y = start.y + (g.cy - start.cy);

    if (Math.abs(g.cx - start.cx) > 4 || Math.abs(g.cy - start.cy) > 4) pv._moved = true;
    pvApply();
    e.preventDefault();
  }, {passive:false});

  function up(e){
    pts.delete(e.pointerId);
    if (pts.size){ anchor(); return; }
    start = null;
    const now = Date.now();
    if (!pv._moved && now - lastTap < 320){        // 두 번 누르면 확대/축소
      PV.s = PV.s > 1.6 ? 1 : 2.4; PV.x = PV.y = 0; pvApply();
      lastTap = 0;
      return;
    }
    lastTap = now;
  }
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);

  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    PV.s *= (e.deltaY < 0 ? 1.12 : 1/1.12); pvClamp(); pvApply();
  }, {passive:false});
}


/* 지도 탭 — 핀을 눌러 열린 시트의 썸네일 (별표·「모두 보기」 버튼은 그대로 둔다) */
document.getElementById('sheet').addEventListener('click', e => {
  if (e.target.closest('button')) return;
  const ph = e.target.closest('.photos .ph');
  if (!ph || !ph.querySelector('img')) return;
  const all = [...ph.parentElement.children];
  openPlacePhotos(openIdx, all.indexOf(ph));
});

/* ══════════ 화면 상태 (불러오는 중 · 없음 · 실패) ══════════ */
const mapstate = document.getElementById('mapstate');

function showState(kind, title, note){
  if (!kind){ mapstate.hidden = true; mapstate.innerHTML = ''; return; }
  mapstate.hidden = false;
  mapstate.className = `mapstate ${kind}`;
  mapstate.innerHTML =
    (kind === 'loading' ? '<div class="spin" aria-hidden="true"></div>' : '')
    + `<p class="st-t">${title}</p>`
    + (note ? `<p class="st-n">${note}</p>` : '');
}

/* ══════════ 화면용 지도 ══════════ */
let current = 'sapporo';
let openIdx = -1;

const mapwrap  = document.querySelector('.mapwrap');
const mapbase  = document.getElementById('mapbase');
const mapover  = document.getElementById('mapover');
const mapillust= document.getElementById('mapillust');

/* 같은 내용이면 innerHTML 을 다시 쓰지 않는다 — 문자열 비교는 SVG 재파싱보다 훨씬 싸다 */
function setSvg(el, html){
  if (el._html === html) return;
  el._html = html;
  el.innerHTML = html;
}

/* 핀 하나 그리기 — 크기는 고정(사진 수와 무관) */
function pinSvg(x, y, ph, color, i, on){
  const r = 8.0;
  return `<g class="pin${on?' on':''}" data-i="${i}" tabindex="0" role="button">`
    + `<circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r*2.4).toFixed(1)}" fill="${color}"/>`
    + `<path class="core" d="M${x.toFixed(1)},${(y+r*0.5).toFixed(1)} c${(-r*1.15).toFixed(1)},${(-r*0.9).toFixed(1)} ${(-r*1.5).toFixed(1)},${(-r*1.5).toFixed(1)} ${(-r*1.5).toFixed(1)},${(-r*2.1).toFixed(1)} a${r.toFixed(1)},${r.toFixed(1)} 0 1 1 ${(r*3).toFixed(1)},0 c0,${(r*0.6).toFixed(1)} ${(-r*0.35).toFixed(1)},${(r*1.2).toFixed(1)} ${(-r*1.5).toFixed(1)},${(r*2.1).toFixed(1)} Z" fill="${color}"/>`
    + `<circle cx="${x.toFixed(1)}" cy="${(y-r*1.6).toFixed(1)}" r="${(r*0.42).toFixed(1)}" fill="#FFFFFF"/></g>`;
}

/* 지도는 남은 화면을 채운다 — 안내를 접으면 그만큼 세로로 커진다.
   문서 기준 top 을 쓰므로 스크롤 위치와 무관하게 같은 값이 나온다. */
function mapRatio(){
  const w = mapwrap.clientWidth;
  if (!w) return 1.15;                                   // 지도 탭이 닫혀 있을 때
  // 전체 화면에서는 지도가 상자를 통째로 쓴다 — 상자 비율 그대로 잡아야 여백이 안 생긴다
  if (fsNode) return Math.max(0.4, Math.min(3, mapwrap.clientHeight / w));
  const top   = mapwrap.getBoundingClientRect().top + scrollY;
  const avail = innerHeight - top - 74;                  // 아래 안내문 한 줄 자리
  return Math.max(1.02, Math.min(1.6, avail / w));
}

function drawScreen(){
  const R = REGIONS[current];
  const vs = placesOf(current);
  const vb = fit(R.map, vs.map(({p})=>R.px(p.lat,p.lon)), R.kind==='rural'?70:90, mapRatio());
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
  // 🔴 innerHTML 은 같은 그림이어도 SVG 를 다시 파싱한다 — 손끝이 걸리는 주범이었다.
  //    그려 넣을 문자열이 지난번과 같으면 건드리지 않는다. (2026-09-09)
  setSvg(mapover, landmarkArt(R,sc) + pins + landmarkLabels(R,sc));

  // 캐릭터 — 지도와 같은 크기의 화면 좌표계(원점 0,0)에 고정
  mapillust.setAttribute('viewBox', `0 0 ${vb[2].toFixed(1)} ${vb[3].toFixed(1)}`);
  // 원본 그림에서 오려 낸 후니·어니를 지도 구석에 세운다 (지역별로 다른 컷)
  // 캐릭터 둘을 핀이 가장 적은 두 구석에 나눠 세운다 (일러스트 레이어는 원점이 0,0)
  // 캐릭터는 base64 스프라이트라 다시 심으면 이미지 디코드까지 새로 한다 — 더 아깝다
  setSvg(mapillust, R.illust(vb[2], vb[3]) + charSpots(R, vs, vb));

  // 축척 바 — 지역마다 실제 거리로
  const barPx = R.scaleMeters / metersPerPx(R.map);
  const bar = document.querySelector('.scalebar');
  bar.style.setProperty('--w', `${(barPx/vb[2]*100).toFixed(1)}%`);
  bar.querySelector('span').textContent = R.scaleLabel;

  document.getElementById('rgname').textContent = R.name;
  document.getElementById('rgjp').textContent = R.jp;

  // 이 지역에만 사진이 없을 때 — 전체가 비었을 때의 안내는 06-load.js 가 띄운다
  if (PLACES.length && !vs.length)
    showState('none', `${R.name}에서 찍은 사진이 아직 없어요.`,
              '이 지역 사진을 드라이브에 올리면 핀이 생깁니다.');
  else if (PLACES.length)
    showState(null);
}

/* ── 지역 전환 ── */
function setRegion(g){
  if (g === current || !REGIONS[g]) return;
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

/* 지역별 사진 수를 전환 버튼에 붙인다 — 어디에 뭐가 쌓였는지 바로 보이게 */
function markRegionCounts(){
  document.querySelectorAll('.regionsw button[data-g]').forEach(b => {
    const n = placesOf(b.dataset.g).length;
    b.classList.toggle('bare', n === 0);
    const c = b.querySelector('.rc');
    if (c) c.textContent = n ? n : '';
  });
}

/* ══════════ 하단 시트 ══════════ */
const sheet = document.getElementById('sheet');
let allPhotos = false;
function openPin(i){
  const p = PLACES[i]; if(!p) return;
  if (p.g !== current) current = p.g;
  openIdx = i;
  const day = dayOf(p.d);
  const c = `var(${day.c})`;
  const shown = allPhotos ? p.ph : Math.min(p.ph, 8);
  let ph = '';
  for (let k=0;k<shown;k++)
    ph += `<div class="ph">${shotImg(p,k,i*7+k,400)}<button class="star" aria-pressed="${k===p.hero}" aria-label="대표 사진">★</button></div>`;
  document.getElementById('sheetin').innerHTML =
    `<div class="sheet-head">
       <div class="day" style="color:${c}"><i style="background:${c}"></i>${day.label} · ${p.t}</div>
       <h2>${p.n}</h2>${p.j ? `<div class="jp">${p.j}</div>` : ''}
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
document.addEventListener('keydown', e => { if(e.key==='Escape' && !lbNode) closeSheet(); });
sheet.addEventListener('click', e => {
  if (e.target.closest('#more')){ allPhotos = !allPhotos; openPin(openIdx); return; }
  const b = e.target.closest('.star');
  if (!b) return;
  const stars = [...sheet.querySelectorAll('.star')];
  stars.forEach(s => s.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true');
  if (openIdx >= 0){
    const p = PLACES[openIdx];
    p.hero = stars.indexOf(b);
    saveHero(p);                 // 웹앱에도 알려 다음에 열 때 유지되게
    posterRefresh(); buildExpand();
  }
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

/* 지도 위에 얹은 HTML(지역 전환 칩·축척 바)도 장애물이다 —
   SVG 아래 깔리므로 그 자리에 세우면 캐릭터 머리가 잘린 것처럼 보인다.
   화면 픽셀을 지도 좌표로 바꿔, 상자를 촘촘한 점으로 깔아 넘긴다. */
function overlayObs(vb){
  const obs = [];
  const cw = mapwrap.clientWidth, ch = mapwrap.clientHeight;
  if (!cw || !ch) return obs;
  const sx = vb[2] / cw, sy = vb[3] / ch;
  const step = Math.min(vb[2], vb[3]) * 0.03;
  ['.regionsw', '.scalebar'].forEach(sel => {
    const el = mapwrap.querySelector(sel);
    if (!el) return;
    const x0 = el.offsetLeft * sx, y0 = el.offsetTop * sy;
    const x1 = x0 + el.offsetWidth * sx, y1 = y0 + el.offsetHeight * sy;
    for (let x = x0; x <= x1; x += step)
      for (let y = y0; y <= y1; y += step) obs.push([x, y]);
  });
  return obs;
}

/* 지도 탭 캐릭터 — 핀이 비는 구석에 주인공·얼굴·소품 커플을 나눠 세운다.
   누가 서는지는 charRoster() 가 정한다 (기본 목록 + 손으로 지우거나 바꾸거나 더한 것).
   소품은 주인공보다 작게 세워 지도를 덮지 않게 한다. */
function charSpots(R, vs, vb){
  if (typeof SPRITES === 'undefined') return '';
  const W = vb[2], H = vb[3];
  const obs = vs.map(({p}) => { const q = R.px(p.lat, p.lon); return [q[0]-vb[0], q[1]-vb[1]]; })
    .concat(R.marks.map(m => { const q = R.px(m.lat, m.lon); return [q[0]-vb[0], q[1]-vb[1]]; }))
    .concat(overlayObs(vb));

  return charPlace(charRoster('map', R.key), 'map', R.key, [0, 0, W, H],
                   { main: W*0.225, face: W*0.20, prop: W*0.20 }, obs);
}

/* ══ 지도 전체 화면 — 인쇄 탭의 지도 패널을 누르면 열린다 ══
   지도를 새로 그리지 않고 지도 탭의 .mapwrap 과 하단 시트를 통째로 옮겨 온다.
   그래야 핀 클릭 → 시트 → 라이트박스, 지역 전환, 축척까지
   지도 탭에서 하던 동작이 하나도 빠지지 않고 그대로 따라온다. */
let fsNode = null;

function openMapFullscreen(key){
  if (fsNode) return;
  const g = REGIONS[key] ? key : current;

  const fs = document.createElement('div');
  fs.className = 'map-fullscreen';
  fs.setAttribute('role', 'dialog');
  fs.setAttribute('aria-label', '지도 크게 보기');
  fs.innerHTML = `<button class="map-fs-close" aria-label="닫기">✕</button>`
    + `<div class="map-fs-inner"></div>`
    + `<p class="map-fs-hint">핀을 누르면 그곳에서 찍은 사진이 열려요</p>`;
  document.body.appendChild(fs);

  // 돌아갈 자리를 기억해 둔다 — 닫을 때 원래 순서 그대로 되돌린다
  fs._mapAt   = [mapwrap.parentNode, mapwrap.nextSibling];
  fs._sheetAt = [sheet.parentNode,   sheet.nextSibling];
  closeSheet(true);
  fs.querySelector('.map-fs-inner').appendChild(mapwrap);
  fs.appendChild(sheet);                       // 시트가 모달 위에 뜨도록 안쪽으로

  fs._prevOv = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  // 라이트박스·시트가 열려 있으면 ESC 는 그쪽 몫 — 캡처로 먼저 받아 판단한다
  fs._key = e => {
    if (e.key !== 'Escape' || lbNode || sheet.classList.contains('open')) return;
    e.stopPropagation();
    closeMapFullscreen();
  };
  document.addEventListener('keydown', fs._key, true);
  fs.querySelector('.map-fs-close').addEventListener('click', closeMapFullscreen);

  fsNode = fs;

  if (g !== current){                          // 누른 패널의 지역으로 맞춘다
    current = g;
    document.querySelectorAll('.regionsw button[data-g]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.g === g)));
  }
  requestAnimationFrame(drawScreen);           // 상자 크기가 잡힌 뒤에 다시 재고 그린다
}

function closeMapFullscreen(){
  if (!fsNode) return;
  const fs = fsNode;
  fsNode = null;                               // mapRatio 가 다시 지도 탭 기준으로 재도록
  closeLightbox();
  closeSheet(true);
  document.removeEventListener('keydown', fs._key, true);
  document.documentElement.style.overflow = fs._prevOv;
  fs._mapAt[0].insertBefore(mapwrap, fs._mapAt[1]);
  fs._sheetAt[0].insertBefore(sheet, fs._sheetAt[1]);
  fs.remove();
  if (!TABS.screen[1].classList.contains('off')) drawScreen();
}

/* ══════════ 인쇄 포스터 — 삿포로 + 오타루 + 비에이 한 장 ══════════
   홋카이도 실제 지형 배치(배치 자체는 .p-body 격자가 잡는다):
   삿포로는 왼쪽 열 전체에 크게, 오타루는 북서쪽이라 우상단, 비에이는 북동 내륙이라 우하단.
   max 는 그 패널에 세울 사진 카드 정원 — 패널이 높을수록 여유가 있다. */
const PANELS = [
  {key:'sapporo', side:'L', max:7, base:'pbase-s', over:'pover-s'},
  {key:'otaru',   side:'R', max:3, base:'pbase-o', over:'pover-o'},
  {key:'biei',    side:'R', max:5, base:'pbase-b', over:'pover-b'}
];

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

function drawPanel(R, side, baseEl, overEl, maxCard){
  const spots = mergeSpots(R);
  // 카드는 사진 많은 곳 우선 — 자리 이상으로는 세우지 않는다
  const rank = [...spots].sort((a,b)=>b.ph-a.ph).slice(0, maxCard);
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

  let grads = '', clips = '', g = '';
  // 카드 없는 곳도 핀은 찍는다
  spots.filter(s => !carded.includes(s)).forEach(s => {
    g += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(bh*0.0058).toFixed(2)}"
            fill="var(${CAT[s.k].c})" stroke="var(--pin-stroke)" stroke-width="${(bh*0.0022).toFixed(2)}"/>`;
  });
  carded.forEach((s,n) => {
    const c = `var(${CAT[s.k].c})`;
    const gid = `pg-${R.key}-${n}`, cid = `pc-${R.key}-${n}`;

    // 핀 → 사진 모서리로 잇는 실
    const ax = side==='L' ? s.cx + CW : s.cx;
    const ay = s.cy + CW/2;
    g += `<path class="leader" d="M${s.x.toFixed(1)},${s.y.toFixed(1)} L${((s.x+ax)/2).toFixed(1)},${ay.toFixed(1)} L${ax.toFixed(1)},${ay.toFixed(1)}"/>`;
    g += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(bh*0.0072).toFixed(2)}" fill="${c}" stroke="var(--pin-stroke)" stroke-width="${(bh*0.0026).toFixed(2)}"/>`;

    // 대표 사진 — 드라이브 썸네일이 있으면 그걸, 없으면 색 타일
    const X = s.cx.toFixed(1), Y = s.cy.toFixed(1), S = CW.toFixed(1), RX = (CW*0.06).toFixed(1);
    const shot = heroShot(PLACES[s.src]), shotHref = shotUrl(shot, 900);
    if (shotHref){
      clips += `<clipPath id="${cid}"><rect x="${X}" y="${Y}" width="${S}" height="${S}" rx="${RX}"/></clipPath>`;
      g += `<image class="p-shot" data-pi="${s.src}" href="${shotHref}" x="${X}" y="${Y}" width="${S}" height="${S}"
              preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"/>`;
    } else {
      const [h1,h2] = hue(s.src*7 + (PLACES[s.src].hero||0));
      grads += `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${h1} 34% 62%)"/><stop offset="1" stop-color="hsl(${h2} 30% 41%)"/></linearGradient>`;
      g += `<rect x="${X}" y="${Y}" width="${S}" height="${S}" rx="${RX}" fill="url(#${gid})"/>`;
    }
    g += `<rect x="${X}" y="${(s.cy+CW-CW*0.13).toFixed(1)}" width="${(CW*0.13).toFixed(1)}" height="${(CW*0.13).toFixed(1)}" fill="${c}"/>`;

    // 이름 · 날짜
    const tx = (s.cx + CW/2).toFixed(1);
    g += `<text class="lbl" x="${tx}" y="${(s.cy+CW+FS*1.35).toFixed(1)}" font-size="${FS.toFixed(1)}" text-anchor="middle">${s.n}</text>`;
    g += `<text class="lbl-sub" x="${tx}" y="${(s.cy+CW+FS*2.55).toFixed(1)}" font-size="${(FS*0.8).toFixed(1)}" text-anchor="middle">${[...s.days].join(' · ')}</text>`;
  });

  const vx = side==='L' ? bx - M : bx;
  const vy = by - bh*0.02, vw = bw + M, vh = bh*1.04;
  const pvb = `${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
  baseEl.setAttribute('viewBox', pvb); overEl.setAttribute('viewBox', pvb);
  // 🔴 사진 카드가 놓이는 여백(M)은 지형 데이터 밖이라, 지도가 좁은 지역(비에이)에서는
  //    그 자리에 페이지 배경이 그대로 비쳤다. 뷰박스 전체를 덮는 땅 색을 맨 아래 깔아
  //    카드가 언제나 「지도 안」에 놓이게 한다. (2026-09-09)
  if (baseEl.dataset.g !== R.key){
    baseEl.innerHTML = `<rect class="pbg" fill="url(#bm-land)"/>` + terrainOf(R);
    baseEl.dataset.g = R.key;
  }
  const pbg = baseEl.querySelector('.pbg');
  if (pbg){
    pbg.setAttribute('x', (vx - vw*0.02).toFixed(1));
    pbg.setAttribute('y', (vy - vh*0.02).toFixed(1));
    pbg.setAttribute('width',  (vw*1.04).toFixed(1));
    pbg.setAttribute('height', (vh*1.04).toFixed(1));
  }
  const psc = Math.max(0.6, bw/430);
  // 캐릭터는 핀·이름표가 가장 적은 구석에 세운다 (고정하면 니조시장처럼 가린다)
  const chW = bw * 0.245;
  const roster = (typeof SPRITES === 'undefined') ? [] : charRoster('print', R.key);
  let char = '';
  if (roster.length){
    const obs = spots.map(o => [o.x, o.y])
      .concat(R.marks.map(m => R.px(m.lat, m.lon)))
      .concat(carded.map(o => [o.cx + CW/2, o.cy + CW/2]));
    char = charPlace(roster, 'print', R.key, [bx, by, bw, bh],
                     { main: chW, face: chW*0.89, prop: chW*0.89 }, obs);
  }
  overEl.innerHTML = `<defs>${grads}${clips}</defs>${landmarkArt(R,psc)}${g}${landmarkLabels(R,psc)}${char}`;
  overEl.parentElement.classList.toggle('nospot', !spots.length);
  const panelEl = overEl.closest('.p-panel');
  if (panelEl) panelEl.dataset.cards = side;      // 힌트를 카드 반대편에 둔다
  return spots;
}

function drawPoster(){
  const spots = PANELS.flatMap(pn => drawPanel(
    REGIONS[pn.key], pn.side,
    document.getElementById(pn.base), document.getElementById(pn.over), pn.max));

  const used = new Set(spots.map(s => s.k));
  let leg = Object.entries(CAT).filter(([k]) => used.has(k))
    .map(([,v]) => `<div><i style="background:var(${v.c})"></i><b>${v.n}</b></div>`).join('');
  leg += ['밀','라벤더','감자'].map((n,i) =>
    `<div><i class="sq" style="background:var(--${['wheat','lav','potato'][i]})"></i><b>${n}밭</b></div>`).join('');
  document.getElementById('plegend').innerHTML = leg;
}

/* 포스터 패널 머리글의 날짜 — 실제로 사진이 있는 날로 채운다 */
/* 포스터 제목 옆 커플 이미지 — 한 번만 넣는다 */
function stampCouple(){
  if (typeof SPRITES === 'undefined') return;
  const put = (id, key) => {
    const el = document.getElementById(id);
    if (el && !el.src) { const u = charSrc(key); if (u) el.src = u; }
  };
  put('pCouple',    'couple');       // 인쇄본 제목 옆
  put('pFootFace',  'ramen');        // 인쇄본 범례 옆
  put('exHeadFace', 'couple');       // 펼쳐보기 머리글
  put('capS', FACE_OF.sapporo);      // 인쇄 패널 머리글 — 지역별 표정
  put('capO', FACE_OF.otaru);
  put('capB', FACE_OF.biei);
}

function stampPosterDays(){
  PANELS.forEach(pn => {
    const el = document.querySelector(`#${pn.over}`).closest('.p-panel').querySelector('.cap span');
    if (!el) return;
    const days = [...new Set(placesOf(pn.key).map(p => p.p.d))].sort(dayCmp);
    el.textContent = days.length ? days.join(' · ') : '';
  });
}

/* ══════════ 펼쳐보기 — 날짜순, 지역 섞어서 ══════════
   🔴 예전에는 샘플 데이터(isLive === false)면 통째로 비워 두었다 —
      가짜 일정이 진짜 기록처럼 보이면 안 된다는 이유였다. 그런데 지도에는
      삿포로·비에이·오타루 핀이 다 떠 있는데 「펼쳐보기」만 비어 있으니
      「비에이가 안 나온다」로 보였다. 사진이 오기 전에도 일정은 펼치되,
      맨 위에 예시라고 먼저 밝혀 오해를 막는다. (2026-09-10) */
function buildExpand(){
  let html = '';
  if (!isLive && PLACES.length)
    html += `<div class="ex-sample">아직 드라이브 사진이 없어 <b>예시 일정</b>을 보여주고 있어요 —
               사진을 올리면 이 자리가 우리 기록으로 바뀝니다.</div>`;
  DAYS.forEach((d, di) => {
    const list = PLACES.map((p,i)=>({p,i})).filter(o => o.p.d === d.id)
      .sort((x,y) => x.p.t.localeCompare(y.p.t));
    if (!list.length) return;
    const c = `var(${d.c})`;
    // 날짜마다 표정 하나씩 — 원본 그림에서 오려 낸 얼굴을 돌려 쓴다
    const faceKey = FACE_CYCLE[di % FACE_CYCLE.length];
    const faceSrc = charSrc(faceKey);
    html += `<section class="daysec"><div class="daybar">
        <i style="background:${c}"></i><b>${d.label}</b><span>${d.note}</span>
        <em>${list.length}곳 · 사진 ${list.reduce((a,o)=>a+o.p.ph,0)}</em>
        ${faceSrc ? `<img class="dayface" src="${faceSrc}" alt="" aria-hidden="true">` : ''}</div>`;
    list.forEach(({p,i}) => {
      const shown = Math.min(p.ph, 6);
      let ph = '';
      for (let k=0;k<shown;k++)
        ph += `<div class="ph${k===p.hero?' hero':''}">${shotImg(p,k,i*7+k,320)}</div>`;
      if (p.ph > shown) ph += `<div class="count">+${p.ph-shown}</div>`;
      html += `<article class="spot">
          <div class="top"><span class="tm">${p.t}</span>
            <div><h3>${p.n}</h3>${p.j ? `<div class="jp">${p.j}</div>` : ''}</div>
            <span class="rg">${REGIONS[p.g].name}</span></div>
          ${p.ph ? `<div class="exphotos">${ph}</div>` : ''}
        </article>`;
    });
    html += `</section>`;
  });
  document.getElementById('exbody').innerHTML =
    html || `<div class="ex-empty">${charSrc('couple') ? `<img class="empty-couple" src="${charSrc('couple')}" alt="" aria-hidden="true">` : ''}
       <p>아직 사진이 없어요.<br>드라이브 「삿포로여행_사진」 폴더에 사진을 올려주세요.</p></div>`;
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
  if (which === 'print')  requestAnimationFrame(drawPoster);   // 패널 크기 잡힌 뒤에
  if (which === 'screen') requestAnimationFrame(drawScreen);   // 남은 높이 다시 재고
}
for (const k of Object.keys(TABS)) TABS[k][0].onclick = () => tab(k);

/* ══════════ 사용 안내 접기/펼치기 ══════════ */
const guideToggle = document.getElementById('guideToggle');
guideToggle.addEventListener('click', function(){
  const open = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', String(!open));
  document.getElementById('guideBody').hidden = open;
  this.querySelector('.guide-toggle-icon').textContent = open ? '▾' : '▴';
  drawScreen();   // 안내가 여닫힌 만큼 지도 비율을 다시 잡는다
});

/* 인쇄 탭이 열려 있을 때만 포스터를 다시 그린다 (패널 크기를 재야 하므로) */
function posterRefresh(){
  if (TABS.print[1].classList.contains('on')) drawPoster();
}

/* ── 주소로 바로 열기 — #otaru · #biei · #print · #expand ── */
function applyHash(){
  const h = (location.hash || '').replace('#','');
  if (REGIONS[h]) setRegion(h);
  else if (h === 'print' || h === 'expand') tab(h);
}
addEventListener('hashchange', applyHash);

/* 창 크기가 바뀌면 포스터 패널 비율도, 지도에 남는 높이도 달라진다.
   🔴 모바일은 손가락으로 화면을 밀 때 주소창이 접히며 resize 가 계속 온다.
      지도 높이는 innerHeight 로 재므로 그때마다 상자 비율이 바뀌고 지도를 다시 그렸다 —
      손끝 아래에서 화면이 튀어 「이동이 버벅인다」로 느껴진 원인.
      가로가 그대로면서 세로만 조금 달라진 건(=주소창) 무시한다. (2026-09-09)
   화면 회전·창 크기 조절은 가로가 같이 바뀌거나 세로가 크게 달라지므로 그대로 반응한다. */
const BAR_SLOP = 180;                       // 주소창·툴바가 접힐 때 달라지는 세로 폭
let rt, lastVW = innerWidth, lastVH = innerHeight;
addEventListener('resize', () => {
  const dw = Math.abs(innerWidth - lastVW), dh = Math.abs(innerHeight - lastVH);
  if (!dw && dh < BAR_SLOP) return;         // 주소창이 접힌 것뿐 — 다시 그릴 일이 아니다
  lastVW = innerWidth; lastVH = innerHeight;
  clearTimeout(rt);
  rt = setTimeout(() => {
    if (fsNode) drawScreen();                  // 전체 화면 지도가 우선 — 뒤 포스터는 닫을 때 다시 그린다
    else if (TABS.print[1].classList.contains('on')) drawPoster();
    else if (!TABS.screen[1].classList.contains('off')) drawScreen();
  }, 160);
});

/* 데이터가 채워지거나 바뀌면 화면 전체를 다시 만든다 */
function refreshAll(){
  buildDays();
  markRegionCounts();
  stampPosterDays();
  stampCouple();
  drawScreen();
  buildExpand();
  posterRefresh();
}
