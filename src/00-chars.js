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
   여기도 초가을 컷만 쓴다 (눈꽃 타워·눈사람 컷은 아예 오려 오지 않았다). */
const EXTRA_CHARS = {
  sapporo: ['cp-ramen', 'cp-beer', 'cp-susukino'],
  otaru:   ['cp-yakiniku', 'cp-icecream'],
  biei:    ['cp-autumn'],
};

/* 날짜별로 돌려 쓰는 표정 — 펼쳐보기 머리글에 붙는다 */
const FACE_CYCLE = ['erni-a','hooni-a','erni-b','hooni-b','erni-d','hooni-d','erni-c','hooni-c'];

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
   저장해 두 사람이 같은 화면을 본다. 두 번 누르면 자동 배치로 돌아간다.
   좌표는 지도 상자 대비 0~1 비율로 저장한다 — 확대·축소해도 자리가 유지된다. */
let CHARPOS = {};                     // 서버에서 받아 온 자리들

function charKey(where, region, slot){ return where + ':' + region + ':' + slot; }

/** 저장된 자리가 있으면 그 좌표를, 없으면 null */
function savedSpot(key, box, w, h){
  const p = CHARPOS[key];
  if (!p) return null;
  const [bx, by, bw, bh] = box;
  return { x: bx + p.x * (bw - w), y: by + p.y * (bh - h) };
}

/** 끌 수 있게 표시해 둔 캐릭터 */
function charDraggable(spriteKey, key, box, x, y, w, opacity){
  const s = (typeof SPRITES !== 'undefined') && SPRITES[spriteKey];
  if (!s) return '';
  const h = w * s.h / s.w;
  return `<image class="charmove" data-ck="${key}"
    data-bx="${box[0]}" data-by="${box[1]}" data-bw="${box[2]}" data-bh="${box[3]}"
    data-w="${w.toFixed(1)}" data-h="${h.toFixed(1)}"
    href="data:${s.mime};base64,${s.b64}"
    x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
    opacity="${opacity == null ? 1 : opacity}"/>`;
}

/* ══ 소품 커플 여러 개 세우기 ══════════════════════════════════
   커플 컷마다 가로세로 비가 달라서 폭을 맞추면 키가 들쭉날쭉해진다.
   그래서 목표 '높이'(th)로 맞추고 폭을 비율대로 낸다 — 나란히 서도 눈높이가 같다.
   taken 에는 이미 세운 자리들이 쌓인다 (호출부가 넘긴 배열을 그대로 채운다). */
function charRow(keys, where, region, box, th, obstacles, taken, opacity){
  let out = '';
  (keys || []).forEach((k, i) => {
    const s = (typeof SPRITES !== 'undefined') && SPRITES[k];
    if (!s) return;
    const w = th * s.w / s.h;
    const ck = charKey(where, region, 'x' + i);
    const p = savedSpot(ck, box, w, th) || freeSpots(box, w, th, obstacles, 1, taken)[0];
    if (!p) return;
    taken.push({ x: p.x, y: p.y, w: w, h: th });
    out += charDraggable(k, ck, box, p.x, p.y, w, opacity);
  });
  return out;
}

/** 옮긴 자리를 서버에 남긴다. x 를 비우면 자동 배치로 되돌린다. */
function saveCharPos(key, fx, fy){
  if (fx == null) delete CHARPOS[key];
  else CHARPOS[key] = { x: fx, y: fy };
  if (typeof WEB_APP === 'undefined') return;
  const u = `${WEB_APP}?action=setCharPos&k=${encodeURIComponent(key)}`
          + (fx == null ? '&x=' : `&x=${fx.toFixed(4)}&y=${fy.toFixed(4)}`);
  fetch(u, { mode: 'no-cors' }).catch(() => {});
}
