/* ══════════════════════════════════════════════════════════════
   후니 & 어니 캐릭터 — 원본 그림에서 오려 낸 스프라이트
   SPRITES 는 tools/sprites.json 에서 빌드 때 박힌다 (WebP + 투명).
   ══════════════════════════════════════════════════════════════ */

/* 지역마다 어울리는 컷 */
/* 9월 중순 홋카이도는 초가을이다 — 목도리·눈 컷은 쓰지 않는다.
   오타루는 계절색이 없는 기본 커플로 둔다. */
const CHAR_OF = { sapporo:'ramen', otaru:'couple', biei:'hat' };

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

/* 지도 구석에 세우는 지역 커플. frac 은 지도 폭 대비 크기. */
function charCorner(regionKey, W, H, frac, side){
  const k = CHAR_OF[regionKey];
  const s = (typeof SPRITES !== 'undefined') && SPRITES[k];
  if (!s) return '';
  const w = W * (frac || 0.15);
  const h = w * s.h / s.w;
  const x = (side === 'right') ? W - w - W*0.03 : W*0.03;
  return charImg(k, x, H - h - H*0.03, w);
}
