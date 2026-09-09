/* ══════════════════════════════════════════════════════════════
   후니 & 어니 캐릭터 — 원본 그림에서 오려 낸 스프라이트
   SPRITES 는 tools/sprites.json 에서 빌드 때 박힌다 (WebP + 투명).
   ══════════════════════════════════════════════════════════════ */

/* 지역마다 어울리는 컷 */
/* 9월 중순 홋카이도는 초가을이다 — 목도리·눈 컷은 쓰지 않는다.
   오타루는 계절색이 없는 기본 커플로 둔다. */
const CHAR_OF = { sapporo:'ramen', otaru:'couple', biei:'hat' };

/* 지도 반대 구석·패널 머리글에 세우는 개별 얼굴 (지역마다 다른 표정) */
const FACE_OF = { sapporo:'hooni-a', otaru:'erni-b', biei:'erni-d' };

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

/* ══ 빈 구석 고르기 ══════════════════════════════════════════════
   캐릭터를 구석에 고정해 두면 그 자리에 핀·이름표가 있을 때 가린다.
   (2026-09-09 삿포로 인쇄 패널에서 니조시장을 덮었다)
   핀과 랜드마크가 가장 적은 구석을 골라 세운다.

   좌표계는 호출부가 정한다 — 장애물 목록과 상자를 같은 공간으로 넘긴다. */
function freeCorners(box, w, h, obstacles, n){
  const [bx, by, bw, bh] = box;
  const pad  = Math.min(bw, bh) * 0.025;
  const near = Math.min(bw, bh) * 0.10;      // 이름표가 옆으로 퍼지는 몫

  const cands = [
    { key:'bl', x: bx + pad,          y: by + bh - h - pad },
    { key:'br', x: bx + bw - w - pad, y: by + bh - h - pad },
    { key:'tl', x: bx + pad,          y: by + pad },
    { key:'tr', x: bx + bw - w - pad, y: by + pad }
  ];
  cands.forEach(c => {
    c.n = 0;
    for (let i = 0; i < obstacles.length; i++){
      const o = obstacles[i];
      if (o[0] > c.x - near && o[0] < c.x + w + near &&
          o[1] > c.y - near && o[1] < c.y + h + near) c.n++;
    }
  });
  // 빈 곳 우선, 같으면 아래쪽을 먼저 (지도는 위쪽에 이름표가 몰린다)
  const order = ['bl','br','tl','tr'];
  cands.sort((a, b) => a.n - b.n || order.indexOf(a.key) - order.indexOf(b.key));
  return cands.slice(0, n || 1);
}
