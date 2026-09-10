/* ══════════════════════════════════════════════════════════════
   후니 & 어니 캐릭터 — 원본 그림에서 오려 낸 스프라이트
   SPRITES 는 tools/sprites.json 에서 빌드 때 박힌다 (WebP + 투명).
   ══════════════════════════════════════════════════════════════ */

/* 지역마다 어울리는 컷 */
/* 9월 중순 홋카이도는 초가을이다 — 목도리·눈 컷은 쓰지 않는다.
   오타루는 계절색이 없는 기본 커플로 둔다. */
/* 삿포로 주인공은 「SAPPORO 모자 + 지도」 컷이다 — 라멘 컷은 소품(cp-ramen)으로
   같은 지도에 서므로, 주인공까지 라멘이면 같은 그림이 두 번 보인다. */
const CHAR_OF = { sapporo:'cp-guide', otaru:'couple', biei:'hat' };

/* 지도 반대 구석·패널 머리글에 세우는 개별 얼굴 (지역마다 다른 표정) */
const FACE_OF = { sapporo:'hooni-a', otaru:'erni-b', biei:'erni-d' };

/* 지역마다 곁들이는 소품 커플들 — 그 지역에서 할 일이 그림으로 보이게 한다.
   여기도 초가을 컷만 쓴다 — 눈꽃 타워·눈사람 컷은 골라 쓸 수만 있게 두고 기본엔 안 세운다.
   앞의 두 컷은 인쇄 패널에도 그대로 실린다 (05-render.js 에서 slice(0,2)) —
   그 지역을 한 장으로 대표하는 컷을 앞에 둔다. */
const EXTRA_CHARS = {
  sapporo: ['cp-ramen', 'cp-beer', 'cp-susukino', 'cp-night', 'cp-onsen'],
  otaru:   ['cp-yakiniku', 'cp-icecream', 'cp-parfait'],
  biei:    ['cp-autumn', 'cp-fall-hat', 'cp-lavender', 'cp-camera'],
};

/* 날짜별로 돌려 쓰는 표정 — 펼쳐보기 머리글에 붙는다 */
const FACE_CYCLE = ['erni-a','hooni-a','erni-b','hooni-b','erni-d','hooni-d','erni-c','hooni-c'];

/* 고르기 팝업에 붙는 한글 이름 — 그림만 늘어놓으면 뭐가 뭔지 모른다 */
const CHAR_NAMES = {
  'cp-guide':'가이드',      'cp-ramen':'라멘',        'cp-beer':'맥주',
  'cp-susukino':'스스키노', 'cp-night':'야경',        'cp-onsen':'온천',
  'cp-yakiniku':'야키니쿠', 'cp-icecream':'아이스크림','cp-parfait':'파르페',
  'cp-autumn':'단풍',       'cp-fall-hat':'단풍비니',  'cp-lavender':'라벤더',
  'cp-camera':'카메라',
  'cp-hi':'반가워요',    'cp-couple-scarf':'목도리커플', 'cp-tower':'타워뷰',
  'cp-snowman':'눈사람', 'cp-cocoa':'핫코코아',          'cp-map':'지도보기',
  'cp-tower-b':'타워눈꽃', 'cp-snowman-b':'눈사람2',
  'couple':'둘이서', 'ramen':'라멘 한 그릇', 'hat':'모자', 'scarf':'목도리',
  'erni-a':'어니 ①','erni-b':'어니 ②','erni-c':'어니 ③','erni-d':'어니 ④',
  'hooni-a':'후니 ①','hooni-b':'후니 ②','hooni-c':'후니 ③','hooni-d':'후니 ④',
};
function charName(key){ return CHAR_NAMES[key] || key; }

/* 「캐릭터 변경」 팝업에 뜨는 전체 목록 — 커플 컷 먼저, 개별 얼굴은 뒤로.
   기본 배치에는 안 쓰는 컷(목도리 등)도 여기서는 고를 수 있다 — 고르는 건 사람 몫이다. */
const CHAR_PICK_ALL = [
  'cp-guide','cp-ramen','cp-beer','cp-susukino','cp-night','cp-onsen',
  'cp-yakiniku','cp-icecream','cp-parfait',
  'cp-autumn','cp-fall-hat','cp-lavender','cp-camera',
  'cp-hi','cp-couple-scarf','cp-tower','cp-snowman','cp-cocoa','cp-map',
  'cp-tower-b','cp-snowman-b',
  'couple','ramen','hat','scarf',
  'erni-a','erni-b','erni-c','erni-d','hooni-a','hooni-b','hooni-c','hooni-d',
];

/* <img> 태그로 쓸 data URI */
function charSrc(key){
  const s = (typeof SPRITES !== 'undefined') && SPRITES[key];
  return s ? `data:${s.mime};base64,${s.b64}` : '';
}

/* 좌상단 (x,y) 에 폭 w 로 그린다. 높이는 원본 비율대로. */
function charImg(key, x, y, w, opacity){
  const s = (typeof SPRITES !== 'undefined') && SPRITES[key];
  if (!s) return '';
  const h = w * s.h / s.w;
  return `<image href="data:${s.mime};base64,${s.b64}"
    x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
    opacity="${opacity == null ? 1 : opacity}" preserveAspectRatio="xMidYMid meet"/>`;
}

/* ══ 빈 자리 찾기 ══════════════════════════════════════════════
   캐릭터를 구석에 고정해 두면 그 자리에 핀·이름표가 있을 때 가린다.
   (2026-09-09 삿포로 인쇄 패널에서 니조시장을 덮었다)

   네 구석 중에서만 고르면 사진이 쌓여 네 구석이 다 찼을 때 답이 없다.
   여행 중엔 핀이 수십 개가 되므로, 가장자리를 따라 촘촘히 후보를 놓고
   그중 가장 빈 자리를 고른다. 가운데로는 가지 않게 가장자리를 선호한다.

   좌표계는 호출부가 정한다 — 장애물 목록과 상자를 같은 공간으로 넘긴다. */
function freeSpots(box, w, h, obstacles, n, taken){
  const [bx, by, bw, bh] = box;
  const pad  = Math.min(bw, bh) * 0.02;
  const near = Math.min(bw, bh) * 0.09;      // 이름표가 옆으로 퍼지는 몫
  const used = taken || [];

  /* 가장자리를 따라 후보를 깐다 — 위·아래는 가로로, 좌·우는 세로로 */
  const cands = [];
  const STEPS = 7;
  for (let i = 0; i < STEPS; i++){
    const fx = i / (STEPS - 1);
    const x = bx + pad + fx * (bw - w - pad*2);
    cands.push({ x: x, y: by + pad });                    // 위
    cands.push({ x: x, y: by + bh - h - pad });           // 아래
  }
  for (let i = 1; i < STEPS - 1; i++){
    const fy = i / (STEPS - 1);
    const y = by + pad + fy * (bh - h - pad*2);
    cands.push({ x: bx + pad,          y: y });           // 왼
    cands.push({ x: bx + bw - w - pad, y: y });           // 오른
  }

  const cx0 = bx + bw/2, cy0 = by + bh/2;
  cands.forEach(c => {
    let hard = 0, soft = 0;
    for (let i = 0; i < obstacles.length; i++){
      const ox = obstacles[i][0], oy = obstacles[i][1];
      if (ox > c.x && ox < c.x + w && oy > c.y && oy < c.y + h) hard++;
      else if (ox > c.x - near && ox < c.x + w + near &&
               oy > c.y - near && oy < c.y + h + near) soft++;
    }
    // 이미 세운 캐릭터와 겹치면 크게 깎는다
    let clash = 0;
    used.forEach(u => {
      if (Math.abs((c.x + w/2) - (u.x + u.w/2)) < (w + u.w)/2 &&
          Math.abs((c.y + h/2) - (u.y + u.h/2)) < (h + u.h)/2) clash++;
    });
    // 가운데로 갈수록 손해 — 지도 한복판에 서지 않게
    const mid = 1 - (Math.abs(c.x + w/2 - cx0)/(bw/2) + Math.abs(c.y + h/2 - cy0)/(bh/2)) / 2;
    c.score = hard*10 + soft*3 + clash*100 + mid*2;
    c.hard = hard; c.soft = soft;
  });
  cands.sort((a, b) => a.score - b.score);
  return cands.slice(0, n || 1);
}



/* ══ 캐릭터를 직접 옮기기 ══════════════════════════════════════
   자동 배치가 늘 맞을 수는 없다. 끌어서 옮기면 그 자리를 시트(스크립트 속성)에
   저장해 두 사람이 같은 화면을 본다.
   좌표는 지도 상자 대비 0~1 비율로 저장한다 — 확대·축소해도 자리가 유지된다.

   자리(CHARPOS)와 「누가 서 있는지」(CHARSET)는 브라우저에도 함께 남긴다.
   웹앱이 안 붙는 상황에서도 손댄 결과가 새로고침을 넘겨 살아 있어야 하기 때문이다.
   시트가 살아 있으면 시트 쪽이 이긴다 — 자리는 두 사람이 같이 보는 값이다. */
let CHARPOS = {};                     // 자리      key → {x,y} (0~1 비율)
let CHARSET = {};                     // 구성      'map:sapporo' → {del,swap,add,seq}
const CHAR_LS = 'hokkaido.chars.v1';

function charStoreSave(){
  try { localStorage.setItem(CHAR_LS, JSON.stringify({ pos: CHARPOS, set: CHARSET })); }
  catch (_) {}                        // 사파리 시크릿 모드에서는 쓰기가 막힌다 — 그래도 화면은 돌아야 한다
}
function charStoreLoad(){
  try {
    const j = JSON.parse(localStorage.getItem(CHAR_LS) || '{}');
    if (j && j.pos) CHARPOS = j.pos;
    if (j && j.set) CHARSET = j.set;
  } catch (_) {}
}
charStoreLoad();

function charKey(where, region, slot){ return where + ':' + region + ':' + slot; }
function charKeyParts(key){
  const p = String(key).split(':');
  return { where: p[0], region: p[1], slot: p.slice(2).join(':') };
}

/** 저장된 자리가 있으면 그 좌표를, 없으면 null */
function savedSpot(key, box, w, h){
  const p = CHARPOS[key];
  if (!p) return null;
  const [bx, by, bw, bh] = box;
  return { x: bx + p.x * (bw - w), y: by + p.y * (bh - h) };
}

/** 끌 수 있게 표시해 둔 캐릭터. data-sp 는 지금 서 있는 컷 — 「변경」 팝업이 읽는다. */
function charDraggable(spriteKey, key, box, x, y, w, opacity){
  const s = (typeof SPRITES !== 'undefined') && SPRITES[spriteKey];
  if (!s) return '';
  const h = w * s.h / s.w;
  return `<image class="charmove" data-ck="${key}" data-sp="${spriteKey}"
    data-bx="${box[0]}" data-by="${box[1]}" data-bw="${box[2]}" data-bh="${box[3]}"
    data-w="${w.toFixed(1)}" data-h="${h.toFixed(1)}"
    href="data:${s.mime};base64,${s.b64}"
    x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
    opacity="${opacity == null ? 1 : opacity}"/>`;
}

/* ══ 누가 서 있는지 ════════════════════════════════════════════
   기본은 위의 CHAR_OF · FACE_OF · EXTRA_CHARS 다. 손으로 지운 것(del),
   바꾼 것(swap), 더한 것(add)만 따로 얹는다 — 기본 목록을 고치면 그대로 따라온다.
   크기는 컷이 아니라 「자리(slot)」의 몫이다. 그래서 컷을 바꿔도 키가 그대로다. */
function charsetOf(where, region){
  const k = where + ':' + region;
  const s = CHARSET[k] || (CHARSET[k] = {});
  if (!Array.isArray(s.del)) s.del = [];
  if (!s.swap || typeof s.swap !== 'object') s.swap = {};
  if (!Array.isArray(s.add)) s.add = [];
  if (typeof s.seq !== 'number') s.seq = 0;
  return s;
}

/** 손대지 않았을 때의 기본 배치 */
function charBase(where, region){
  const ex = EXTRA_CHARS[region] || [];
  /* 인쇄 패널은 카드·이름표로 이미 빽빽하다 — 소품 커플은 앞의 둘까지만 */
  if (where === 'print')
    return [{ slot:'a', sprite: CHAR_OF[region], size:'main' }]
      .concat(ex.slice(0, 2).map((s, i) => ({ slot:'x'+i, sprite:s, size:'prop' })));
  return [{ slot:'a', sprite: CHAR_OF[region], size:'main' },
          { slot:'b', sprite: FACE_OF[region], size:'face' }]
    .concat(ex.map((s, i) => ({ slot:'x'+i, sprite:s, size:'prop' })));
}

/** 기본 + 손댄 것 = 실제로 세울 목록 */
function charRoster(where, region){
  const st = charsetOf(where, region);
  return charBase(where, region)
    .concat(st.add.map(a => ({ slot:a.slot, sprite:a.sprite, size:'prop' })))
    .filter(r => r.sprite && st.del.indexOf(r.slot) < 0)
    .map(r => ({ slot:r.slot, sprite: st.swap[r.slot] || r.sprite, size:r.size }))
    .filter(r => (typeof SPRITES !== 'undefined') && SPRITES[r.sprite]);
}

/** 지금 이 지도에 서 있는 컷들 — 고르기 팝업에서 흐리게 표시할 때 쓴다 */
function charPlacedSprites(where, region){
  return charRoster(where, region).map(r => r.sprite);
}

/** 캐릭터 한 명 더. 새로 만든 자리 열쇠를 돌려준다. */
function charAdd(where, region, sprite){
  const st = charsetOf(where, region);
  const slot = 'u' + (st.seq++);      // 번호는 되쓰지 않는다 — 지운 자리와 겹치면 안 된다
  st.add.push({ slot: slot, sprite: sprite });
  charStoreSave();
  return charKey(where, region, slot);
}

/** 같은 자리에 다른 컷으로 */
function charSwap(key, sprite){
  const p = charKeyParts(key);
  charsetOf(p.where, p.region).swap[p.slot] = sprite;
  charStoreSave();
}

/** 지도에서 내보낸다 — 기억해 둔 자리까지 함께 지운다 */
function charRemove(key){
  const p  = charKeyParts(key), st = charsetOf(p.where, p.region);
  const mine = st.add.some(a => a.slot === p.slot);
  st.add = st.add.filter(a => a.slot !== p.slot);
  delete st.swap[p.slot];
  // 손수 더한 자리는 목록에서 빼면 끝이다. 기본 배치는 「지웠다」고 적어 둬야 안 돌아온다.
  if (!mine && st.del.indexOf(p.slot) < 0) st.del.push(p.slot);
  saveCharPos(key, null);             // charStoreSave 는 여기서 함께 돈다
}

/* ══ 목록대로 세우기 ══════════════════════════════════════════
   커플 컷마다 가로세로 비가 달라서 폭을 맞추면 키가 들쭉날쭉해진다.
   그래서 소품은 목표 '높이'(sizes.prop)로 맞추고 폭을 비율대로 낸다 —
   나란히 서도 눈높이가 같다. 주인공·얼굴은 폭으로 맞춘다.
   저장해 둔 자리가 있으면 그 자리에, 없으면 freeSpots() 가 고른 빈 자리에. */
function charPlace(roster, where, region, box, sizes, obstacles){
  const taken = [];
  let out = '';
  roster.forEach(r => {
    const s = (typeof SPRITES !== 'undefined') && SPRITES[r.sprite];
    if (!s) return;
    let w, h;
    if (r.size === 'prop'){ h = sizes.prop; w = h * s.w / s.h; }
    else { w = r.size === 'face' ? sizes.face : sizes.main; h = w * s.h / s.w; }
    const ck = charKey(where, region, r.slot);
    const p  = savedSpot(ck, box, w, h) || freeSpots(box, w, h, obstacles, 1, taken)[0];
    if (!p) return;
    taken.push({ x: p.x, y: p.y, w: w, h: h });
    out += charDraggable(r.sprite, ck, box, p.x, p.y, w, r.size === 'face' ? 0.95 : null);
  });
  return out;
}

/** 옮긴 자리를 남긴다. x 를 비우면 자동 배치로 되돌린다. */
function saveCharPos(key, fx, fy){
  if (fx == null) delete CHARPOS[key];
  else CHARPOS[key] = { x: fx, y: fy };
  charStoreSave();
  if (typeof WEB_APP === 'undefined') return;
  const u = `${WEB_APP}?action=setCharPos&k=${encodeURIComponent(key)}`
          + (fx == null ? '&x=' : `&x=${fx.toFixed(4)}&y=${fy.toFixed(4)}`);
  fetch(u, { mode: 'no-cors' }).catch(() => {});
}
