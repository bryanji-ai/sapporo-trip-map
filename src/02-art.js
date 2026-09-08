/* ══ 일러스트 공통 색 ══ */
const IB='#FFFBF2', IK='#4A3B32', ICH='#F6C7B4';
const f1 = n => (+n).toFixed(1);
/* 한글·가나·한자는 1em, 나머지는 0.56em으로 어림한 글자 폭 */
function tw(s){ let w=0; for(const c of String(s)) w += /[가-힣぀-ヿ一-鿿]/.test(c) ? 1 : 0.56; return w; }

/* ── 작은 장식 ── */
function snowflake(x,y,r,o){
  return `<g transform="translate(${f1(x)},${f1(y)})" opacity="${o}" fill="none"
    stroke="#7CC6DE" stroke-width="${f1(r*.27)}" stroke-linecap="round">
    <path d="M0,${f1(-r)} V${f1(r)} M${f1(-r*.87)},${f1(-r*.5)} L${f1(r*.87)},${f1(r*.5)} M${f1(-r*.87)},${f1(r*.5)} L${f1(r*.87)},${f1(-r*.5)}"/>
    <path d="M0,${f1(-r*.55)} l${f1(-r*.3)},${f1(-r*.3)} M0,${f1(-r*.55)} l${f1(r*.3)},${f1(-r*.3)}
             M0,${f1(r*.55)} l${f1(-r*.3)},${f1(r*.3)} M0,${f1(r*.55)} l${f1(r*.3)},${f1(r*.3)}"/></g>`;
}
function heart(x,y,r,c){
  return `<path transform="translate(${f1(x)},${f1(y)})" fill="${c}"
    d="M0,${f1(r*.85)} C${f1(-r*1.5)},${f1(-r*.1)} ${f1(-r*.85)},${f1(-r*1.3)} 0,${f1(-r*.45)}
       C${f1(r*.85)},${f1(-r*1.3)} ${f1(r*1.5)},${f1(-r*.1)} 0,${f1(r*.85)} Z"/>`;
}
function conifer(x,y,k,c){
  return `<g transform="translate(${f1(x)},${f1(y)})">
    <rect x="${-1.4*k}" y="${-2.4*k}" width="${2.8*k}" height="${4.4*k}" fill="#8C6239"/>
    <path d="M0,${-21*k} L${6.2*k},${-9.5*k} L${-6.2*k},${-9.5*k} Z" fill="${c}"/>
    <path d="M0,${-15*k} L${8*k},${-2*k} L${-8*k},${-2*k} Z" fill="${c}"/></g>`;
}
/* 비에이 들꽃 한 포기 */
function sprig(x,y,k,c){
  return `<g transform="translate(${f1(x)},${f1(y)})">
    <path d="M0,0 v${-7*k}" stroke="#7FA06C" stroke-width="${1.3*k}" stroke-linecap="round" fill="none"/>
    <circle cx="0" cy="${-8.4*k}" r="${2.3*k}" fill="${c}"/>
    <circle cx="${-2.6*k}" cy="${-6*k}" r="${1.7*k}" fill="${c}"/>
    <circle cx="${2.6*k}" cy="${-6.2*k}" r="${1.7*k}" fill="${c}"/></g>`;
}
/* 나비 */
function butterfly(x,y,k,c){
  return `<g transform="translate(${f1(x)},${f1(y)})">
    <path d="M0,0 q${-5.4*k},${-6*k} ${-7.4*k},${-1.6*k} q${-1.2*k},${4.4*k} ${7.4*k},${1.6*k} Z" fill="${c}" opacity=".9"/>
    <path d="M0,0 q${5.4*k},${-6*k} ${7.4*k},${-1.6*k} q${1.2*k},${4.4*k} ${-7.4*k},${1.6*k} Z" fill="${c}" opacity=".9"/>
    <path d="M0,${-2.4*k} v${5*k}" stroke="${IK}" stroke-width="${1.1*k}" stroke-linecap="round"/></g>`;
}

/* ══ 랜드마크 삽화 — 아래 가운데(0,0)를 기준으로 위로 자란다 ══ */
/* 갈매기 — 오타루 항구 하늘에 흩뿌린다 */
function gull(x,y,k){
  return `<g transform="translate(${f1(x)},${f1(y)})">
    <path d="M${-9*k},0 q${4.4*k},${-5.2*k} ${9*k},${-.6*k} q${4.6*k},${-4.6*k} ${9*k},${.6*k}"
          fill="none" stroke="${IK}" stroke-width="${1.9*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-.2*k}" r="${1.5*k}" fill="${IK}"/></g>`;
}

/* 운하 가스등 — 저녁의 오타루 */
function gasLamp(k){
  return `<g>
    <path d="M0,0 v${-19*k}" stroke="${IK}" stroke-width="${2*k}" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="${4.2*k}" ry="${1.5*k}" fill="${IK}" opacity=".2"/>
    <circle cx="0" cy="${-22.4*k}" r="${6.4*k}" fill="#F6D98A" opacity=".38"/>
    <path d="M${-3.4*k},${-19*k} l${1.2*k},${-6*k} h${4.4*k} l${1.2*k},${6*k} Z"
          fill="#FFE9A8" stroke="${IK}" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-4*k},${-25*k} h${8*k}" stroke="${IK}" stroke-width="${1.5*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-27*k}" r="${1.3*k}" fill="${IK}"/></g>`;
}

const ICON = {
  station: k=>`<rect x="${-18*k}" y="${-16*k}" width="${36*k}" height="${16*k}" rx="${2*k}" fill="#EFDCBB" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <rect x="${-20*k}" y="${-20*k}" width="${40*k}" height="${4.4*k}" rx="${1.8*k}" fill="#D9B98C" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <rect x="${-6.5*k}" y="${-27*k}" width="${13*k}" height="${7.4*k}" rx="${1.8*k}" fill="#EFDCBB" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <circle cx="0" cy="${-23.3*k}" r="${2.3*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.2*k}"/>
    <path d="M0,${-24.6*k} V${-23.3*k} L${1.6*k},${-22.4*k}" fill="none" stroke="var(--icon)" stroke-width="${1*k}" stroke-linecap="round"/>
    <g fill="var(--water)" stroke="var(--icon)" stroke-width="${1.1*k}">
      <path d="M${-15*k},${-4.6*k} v${-5*k} a${2.2*k},${2.2*k} 0 0 1 ${4.4*k},0 v${5*k} Z"/>
      <path d="M${-8.6*k},${-4.6*k} v${-5*k} a${2.2*k},${2.2*k} 0 0 1 ${4.4*k},0 v${5*k} Z"/>
      <path d="M${4.2*k},${-4.6*k} v${-5*k} a${2.2*k},${2.2*k} 0 0 1 ${4.4*k},0 v${5*k} Z"/>
      <path d="M${10.6*k},${-4.6*k} v${-5*k} a${2.2*k},${2.2*k} 0 0 1 ${4.4*k},0 v${5*k} Z"/></g>
    <path d="M${-3.4*k},0 v${-6.4*k} a${3.4*k},${3.4*k} 0 0 1 ${6.8*k},0 v${6.4*k} Z" fill="#C9A87C" stroke="var(--icon)" stroke-width="${1.3*k}"/>`,

  clocktower: k=>`<rect x="${-11*k}" y="${-14*k}" width="${22*k}" height="${14*k}" rx="${1.8*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <path d="M${-13*k},${-14*k} L0,${-19.6*k} L${13*k},${-14*k} Z" fill="var(--roof)" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <rect x="${-5.2*k}" y="${-30*k}" width="${10.4*k}" height="${11.4*k}" rx="${1.6*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <path d="M${-7*k},${-30*k} q${7*k},${-6.4*k} ${14*k},0 Z" fill="var(--roof)" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M0,${-33.4*k} v${-3.6*k}" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-24.6*k}" r="${3.5*k}" fill="#FFF6E0" stroke="var(--icon)" stroke-width="${1.4*k}"/>
    <path d="M0,${-26.8*k} V${-24.6*k} L${2*k},${-23.3*k}" fill="none" stroke="var(--icon)" stroke-width="${1.1*k}" stroke-linecap="round"/>
    <g fill="var(--water)" stroke="var(--icon)" stroke-width="${1.1*k}">
      <rect x="${-8.6*k}" y="${-11.2*k}" width="${4.2*k}" height="${5.4*k}" rx="${1.5*k}"/>
      <rect x="${-2.1*k}" y="${-11.2*k}" width="${4.2*k}" height="${5.4*k}" rx="${1.5*k}"/>
      <rect x="${4.4*k}" y="${-11.2*k}" width="${4.2*k}" height="${5.4*k}" rx="${1.5*k}"/></g>
    <path d="M${-2.8*k},0 v${-3*k} a${2.8*k},${2.8*k} 0 0 1 ${5.6*k},0 v${3*k} Z" fill="#C9A87C" stroke="var(--icon)" stroke-width="${1.2*k}"/>`,

  tvtower: k=>`<path d="M${-9*k},0 L${-3.4*k},${-18*k} L${3.4*k},${-18*k} L${9*k},0 Z" fill="#FBE9E2" stroke="#D8503F" stroke-width="${2*k}" stroke-linejoin="round"/>
    <path d="M${-7.2*k},${-6.4*k} h${14.4*k} M${-5.4*k},${-12.2*k} h${10.8*k}" stroke="#D8503F" stroke-width="${1.5*k}"/>
    <path d="M${-9*k},0 L${3.4*k},${-18*k} M${9*k},0 L${-3.4*k},${-18*k}" stroke="#E8785F" stroke-width="${1.2*k}"/>
    <rect x="${-6.2*k}" y="${-24.4*k}" width="${12.4*k}" height="${6.6*k}" rx="${1.8*k}" fill="#E8785F" stroke="var(--icon)" stroke-width="${1.4*k}"/>
    <rect x="${-3.6*k}" y="${-22.8*k}" width="${7.2*k}" height="${3.2*k}" rx="${1*k}" fill="#FFF6E0"/>
    <path d="M${-2.6*k},${-24.4*k} L${-1.8*k},${-31*k} h${3.6*k} l${0.8*k},${6.6*k}" fill="none" stroke="#D8503F" stroke-width="${1.7*k}" stroke-linejoin="round"/>
    <path d="M0,${-31*k} v${-4.6*k}" stroke="#D8503F" stroke-width="${1.6*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-36.8*k}" r="${1.9*k}" fill="var(--d14)"/>`,

  brick: k=>`<rect x="${-16*k}" y="${-15*k}" width="${32*k}" height="${15*k}" rx="${1.6*k}" fill="#B75B4A" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <path d="M${-17.6*k},${-15*k} L${-13*k},${-20.2*k} L${13*k},${-20.2*k} L${17.6*k},${-15*k} Z" fill="#8E4133" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <rect x="${-5.6*k}" y="${-28.4*k}" width="${11.2*k}" height="${9.2*k}" rx="${1.6*k}" fill="#B75B4A" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <path d="M${-7.4*k},${-28.4*k} L0,${-35.2*k} L${7.4*k},${-28.4*k} Z" fill="#8E4133" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M0,${-35.2*k} v${-3.6*k}" stroke="var(--icon)" stroke-width="${1.3*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-39.4*k}" r="${1.6*k}" fill="var(--d14)"/>
    <g fill="#FFF1D8" stroke="var(--icon)" stroke-width="${1.1*k}">
      <rect x="${-2.3*k}" y="${-25.8*k}" width="${4.6*k}" height="${4.2*k}" rx="${1.2*k}"/>
      <rect x="${-13.6*k}" y="${-11.6*k}" width="${4.2*k}" height="${5.2*k}" rx="${1.4*k}"/>
      <rect x="${-7.6*k}" y="${-11.6*k}" width="${4.2*k}" height="${5.2*k}" rx="${1.4*k}"/>
      <rect x="${3.4*k}" y="${-11.6*k}" width="${4.2*k}" height="${5.2*k}" rx="${1.4*k}"/>
      <rect x="${9.4*k}" y="${-11.6*k}" width="${4.2*k}" height="${5.2*k}" rx="${1.4*k}"/></g>
    <path d="M${-3.2*k},0 v${-3.4*k} a${3.2*k},${3.2*k} 0 0 1 ${6.4*k},0 v${3.4*k} Z" fill="#F6E3C4" stroke="var(--icon)" stroke-width="${1.3*k}"/>`,

  fountain: k=>`<ellipse cx="0" cy="${-2*k}" rx="${15*k}" ry="${6.2*k}" fill="var(--water)" stroke="var(--water-line)" stroke-width="${1.7*k}"/>
    <ellipse cx="0" cy="${-3.4*k}" rx="${10*k}" ry="${3.8*k}" fill="#BEE9F5"/>
    <ellipse cx="0" cy="${-6.4*k}" rx="${4.8*k}" ry="${2.1*k}" fill="#FFFDF6" stroke="var(--water-line)" stroke-width="${1.3*k}"/>
    <path d="M0,${-7.4*k} v${-8.6*k}" stroke="#FFFDF6" stroke-width="${2.3*k}" stroke-linecap="round"/>
    <path d="M0,${-16*k} q${-6.4*k},${3.4*k} ${-8.4*k},${9.4*k} M0,${-16*k} q${6.4*k},${3.4*k} ${8.4*k},${9.4*k}
             M0,${-17.4*k} q${-2.8*k},${4.4*k} ${-2.8*k},${9.6*k} M0,${-17.4*k} q${2.8*k},${4.4*k} ${2.8*k},${9.6*k}"
          fill="none" stroke="#9FDCEC" stroke-width="${1.6*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-18.4*k}" r="${2.3*k}" fill="#DAF3FA" stroke="var(--water-line)" stroke-width="${1.2*k}"/>`,

  tram: k=>`<ellipse cx="0" cy="${3.2*k}" rx="${15*k}" ry="${2.6*k}" fill="var(--icon)" opacity=".12"/>
    <rect x="${-14*k}" y="${-13.4*k}" width="${28*k}" height="${12*k}" rx="${3.6*k}" fill="#6FA98A" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <rect x="${-13.4*k}" y="${-6.6*k}" width="${26.8*k}" height="${4.6*k}" fill="#E2856B"/>
    <g fill="#DFF2F7" stroke="var(--icon)" stroke-width="${1.1*k}">
      <rect x="${-11.6*k}" y="${-11.4*k}" width="${6.4*k}" height="${4.6*k}" rx="${1.3*k}"/>
      <rect x="${-3.2*k}" y="${-11.4*k}" width="${6.4*k}" height="${4.6*k}" rx="${1.3*k}"/>
      <rect x="${5.2*k}" y="${-11.4*k}" width="${6.4*k}" height="${4.6*k}" rx="${1.3*k}"/></g>
    <circle cx="${-7*k}" cy="${-0.4*k}" r="${2.2*k}" fill="var(--icon)"/>
    <circle cx="${7*k}" cy="${-0.4*k}" r="${2.2*k}" fill="var(--icon)"/>
    <path d="M${-15.4*k},${-1.4*k} h${30.8*k}" stroke="var(--icon)" stroke-width="${1.6*k}" stroke-linecap="round"/>
    <path d="M${-2*k},${-13.4*k} l${-3.4*k},${-4.8*k} h${8.6*k}" fill="none" stroke="var(--icon)" stroke-width="${1.3*k}" stroke-linecap="round"/>`,

  neon: k=>`<rect x="${-9*k}" y="${-21*k}" width="${18*k}" height="${13*k}" rx="${2.4*k}" fill="var(--roof)" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <path d="M${-4.5*k},${-17*k} h${9*k} M${-4.5*k},${-13.5*k} h${6*k}" stroke="var(--icon-2)" stroke-width="${1.7*k}" stroke-linecap="round"/>
    <path d="M0,${-8*k} L0,0" stroke="var(--icon)" stroke-width="${1.9*k}" stroke-linecap="round"/>
    <circle cx="${-11.5*k}" cy="${-23*k}" r="${1.7*k}" fill="var(--d14)"/><circle cx="${11.5*k}" cy="${-19*k}" r="${1.4*k}" fill="var(--d14)"/>`,

  tent: k=>`<path d="M${-13*k},${-8*k} L${-10*k},${-15*k} L${10*k},${-15*k} L${13*k},${-8*k} Z" fill="var(--roof)" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-6.5*k},${-15*k} L${-4*k},${-8*k} M${1*k},${-15*k} L${1*k},${-8*k} M${7*k},${-15*k} L${8.5*k},${-8*k}" stroke="var(--icon-2)" stroke-width="${1.5*k}"/>
    <rect x="${-11*k}" y="${-8*k}" width="${22*k}" height="${8*k}" rx="${1.6*k}" fill="var(--icon-2)" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <circle cx="${-4*k}" cy="${-4*k}" r="${1.6*k}" fill="var(--roof-2)"/><circle cx="${2*k}" cy="${-4*k}" r="${1.6*k}" fill="var(--green-2)"/>`,

  beer: k=>`<path d="M${-6.5*k},${-16*k} h${11*k} l${-1*k},${16*k} h${-9*k} Z" fill="var(--roof-2)" stroke="var(--icon)" stroke-width="${1.6*k}" stroke-linejoin="round"/>
    <path d="M${-6.8*k},${-16*k} q${5*k},${-5*k} ${11.6*k},0 Z" fill="var(--icon-2)" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${5*k},${-13*k} q${5*k},${1*k} ${0},${7*k}" fill="none" stroke="var(--icon)" stroke-width="${1.6*k}" stroke-linecap="round"/>`,

  pond: k=>`<ellipse cx="0" cy="${-6*k}" rx="${13*k}" ry="${6.5*k}" fill="var(--water)" stroke="var(--water-line)" stroke-width="${1.6*k}"/>
    <path d="M${-7*k},${-6*k} q${2.5*k},${-2*k} ${5*k},0 M${1*k},${-3*k} q${2.5*k},${-2*k} ${5*k},0" stroke="var(--icon-2)" stroke-width="${1.3*k}" fill="none" stroke-linecap="round"/>
    <path d="M${-13*k},${-9*k} q${-1*k},${-6*k} ${3*k},${-7*k}" stroke="var(--green-line)" stroke-width="${1.6*k}" fill="none" stroke-linecap="round"/>
    <circle cx="${-10.5*k}" cy="${-16.5*k}" r="${3*k}" fill="var(--green)" stroke="var(--icon)" stroke-width="${1.3*k}"/>`,

  /* ══ 오타루 전용 ══ */
  /* 운하 석조창고 — 물 위에 비친 그림자까지 */
  warehouse: k=>`<path d="M${-17*k},${-3*k} h${34*k} v${3*k} h${-34*k} Z" fill="var(--water)" stroke="var(--water-line)" stroke-width="${1.2*k}"/>
    <rect x="${-15*k}" y="${-17*k}" width="${30*k}" height="${14*k}" rx="${1.4*k}" fill="#C9B79A" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <path d="M${-16.6*k},${-17*k} L${-12*k},${-23.4*k} L${12*k},${-23.4*k} L${16.6*k},${-17*k} Z" fill="var(--roof-2)" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <g fill="#FFF1D8" stroke="var(--icon)" stroke-width="${1.1*k}">
      <rect x="${-11.4*k}" y="${-13.6*k}" width="${4.6*k}" height="${5.6*k}" rx="${1.3*k}"/>
      <rect x="${-2.3*k}" y="${-13.6*k}" width="${4.6*k}" height="${5.6*k}" rx="${1.3*k}"/>
      <rect x="${6.8*k}" y="${-13.6*k}" width="${4.6*k}" height="${5.6*k}" rx="${1.3*k}"/></g>
    <path d="M${-13*k},${-21*k} h${26*k}" stroke="var(--icon-2)" stroke-width="${1.2*k}" opacity=".7"/>
    <path d="M${-8*k},0 q${2.6*k},${-1.6*k} ${5.2*k},0 M${3*k},${-1*k} q${2.6*k},${-1.6*k} ${5.2*k},0"
          fill="none" stroke="var(--water-line)" stroke-width="${1.1*k}" stroke-linecap="round"/>`,

  /* 어선 — 항구와 바다 장식에 함께 쓴다 */
  boat: k=>`<path d="M${-13*k},${-5.6*k} h${26*k} l${-4.4*k},${5.6*k} h${-17.2*k} Z" fill="#E9E2D2" stroke="var(--icon)" stroke-width="${1.6*k}" stroke-linejoin="round"/>
    <path d="M${-13*k},${-5.6*k} h${26*k}" stroke="#C05B4A" stroke-width="${1.8*k}"/>
    <rect x="${-5*k}" y="${-12.4*k}" width="${9.4*k}" height="${6.8*k}" rx="${1.4*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.4*k}"/>
    <path d="M${6.6*k},${-5.6*k} v${-11*k}" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linecap="round"/>
    <path d="M${6.6*k},${-16*k} L${13*k},${-11.6*k} L${6.6*k},${-9.6*k} Z" fill="#D8503F" stroke="var(--icon)" stroke-width="${1.2*k}" stroke-linejoin="round"/>
    <path d="M${-14*k},${1.4*k} q${3*k},${-1.9*k} ${6*k},0 t${6*k},0 t${6*k},0"
          fill="none" stroke="var(--water-line)" stroke-width="${1.3*k}" stroke-linecap="round"/>`,

  /* 스시야도리 — 접시에 올린 초밥 두 점 */
  sushi: k=>`<ellipse cx="0" cy="${-1.4*k}" rx="${15*k}" ry="${4.6*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <g stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linejoin="round">
      <rect x="${-12*k}" y="${-8.6*k}" width="${11*k}" height="${6.2*k}" rx="${2.6*k}" fill="#FFF6E4"/>
      <path d="M${-12.6*k},${-8.6*k} q${6.1*k},${-4.2*k} ${12.2*k},0 Z" fill="#E4785C"/>
      <rect x="${1.4*k}" y="${-8.6*k}" width="${11*k}" height="${6.2*k}" rx="${2.6*k}" fill="#FFF6E4"/>
      <path d="M${0.8*k},${-8.6*k} q${6.1*k},${-4.2*k} ${12.2*k},0 Z" fill="#EFA860"/></g>
    <path d="M${-9*k},${-11.4*k} q${3*k},${-1.8*k} ${6*k},0" fill="none" stroke="#7FA05E" stroke-width="${1.3*k}" stroke-linecap="round"/>`,

  /* ══ 비에이 전용 ══ */
  /* 사계채의 언덕 — 색색 이랑이 그려진 언덕 */
  stripehill: k=>`<path d="M${-22*k},0 q${8*k},${-14*k} ${22*k},${-13*k} q${13*k},${1*k} ${22*k},${13*k} Z"
      fill="#EADFBE" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <g stroke-width="${2.6*k}" stroke-linecap="round" fill="none">
      <path d="M${-17*k},${-3.4*k} q${8*k},${-6*k} ${17*k},${-6.6*k}" stroke="var(--lav)"/>
      <path d="M${-14*k},${-7*k} q${7*k},${-4.4*k} ${15*k},${-4.6*k}" stroke="var(--wheat)"/>
      <path d="M${0*k},${-11.4*k} q${9*k},${1*k} ${16*k},${6.4*k}" stroke="#E9857A"/>
      <path d="M${2*k},${-7.4*k} q${9*k},${1.4*k} ${15*k},${5.6*k}" stroke="var(--potato)"/></g>
    ${conifer(-19*k, -1*k, .62*k, '#3F6B52')}
    ${conifer(19*k, -.5*k, .58*k, '#33604A')}`,

  /* 청의 호수 — 물에 잠긴 마른 나무 */
  bluepond: k=>`<ellipse cx="0" cy="${-4*k}" rx="${16*k}" ry="${7.4*k}" fill="#7FC8DC" stroke="#4E9FB8" stroke-width="${1.7*k}"/>
    <ellipse cx="${-1*k}" cy="${-5*k}" rx="${11*k}" ry="${4.4*k}" fill="#A5DCEA" opacity=".85"/>
    <g stroke="#8C7B6A" stroke-width="${1.5*k}" stroke-linecap="round" fill="none">
      <path d="M${-8*k},${-6*k} v${-11*k} m0,${3.4*k} l${-3.4*k},${-2.6*k} m0,${4*k} l${3.4*k},${-1.4*k}"/>
      <path d="M${-1*k},${-7*k} v${-15*k} m0,${4*k} l${3.6*k},${-3*k} m${-3.6*k},${6.4*k} l${-3.4*k},${-2.2*k}"/>
      <path d="M${7.4*k},${-5.6*k} v${-9.4*k} m0,${3*k} l${3*k},${-2.4*k}"/></g>
    <path d="M${-11*k},${-3*k} q${3.4*k},${-1.8*k} ${6.8*k},0 M${2*k},${-1.4*k} q${3.4*k},${-1.8*k} ${6.8*k},0"
          stroke="#FFFFFF" stroke-width="${1.3*k}" fill="none" stroke-linecap="round" opacity=".75"/>`,

  /* 흰수염폭포 — 절벽에서 흘러내리는 흰 물줄기 */
  waterfall: k=>`<path d="M${-14*k},${-6*k} L${-11*k},${-22*k} L${12*k},${-22*k} L${14*k},${-6*k} Z"
      fill="#C9BE94" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-11*k},${-19*k} h${23*k}" stroke="#3F6B52" stroke-width="${2.4*k}" stroke-linecap="round"/>
    <g stroke="#FFFFFF" stroke-width="${1.9*k}" stroke-linecap="round" fill="none" opacity=".95">
      <path d="M${-7*k},${-18*k} q${-1.4*k},${7*k} ${-.6*k},${12*k}"/>
      <path d="M${-1.4*k},${-18*k} v${12.6*k}"/>
      <path d="M${5*k},${-18*k} q${1.4*k},${7*k} ${.6*k},${12*k}"/></g>
    <ellipse cx="${-1*k}" cy="${-4*k}" rx="${13*k}" ry="${4.2*k}" fill="#7FC8DC" stroke="#4E9FB8" stroke-width="${1.5*k}"/>
    <ellipse cx="${-1*k}" cy="${-4.8*k}" rx="${7.4*k}" ry="${2.2*k}" fill="#FFFFFF" opacity=".7"/>`,

  /* 팜 도미타 — 라벤더 이랑 */
  lavender: k=>`<path d="M${-20*k},0 q${10*k},${-5.4*k} ${20*k},${-5*k} q${11*k},${.4*k} ${20*k},${5*k} Z"
      fill="#DDD2B0" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <g stroke-width="${3.2*k}" stroke-linecap="round" fill="none">
      <path d="M${-16*k},${-2.6*k} q${16*k},${-4.4*k} ${32*k},0" stroke="var(--lav)"/>
      <path d="M${-14*k},${-7*k} q${14*k},${-4.2*k} ${28*k},0" stroke="#B9A4D8"/>
      <path d="M${-11*k},${-11.2*k} q${11*k},${-3.6*k} ${22*k},0" stroke="var(--lav)"/>
      <path d="M${-8*k},${-15*k} q${8*k},${-3*k} ${16*k},0" stroke="#B9A4D8"/></g>
    ${sprig(-19*k, -1*k, .8*k, '#9B86C4')}
    ${sprig(19*k, -.6*k, .75*k, '#9B86C4')}`,

  /* 세븐스타 · 켄과 메리 — 언덕 위 큰 나무 한 그루 */
  bigtree: k=>`<ellipse cx="0" cy="${1.4*k}" rx="${15*k}" ry="${3.4*k}" fill="#D9CBA6"/>
    <path d="M${-2.6*k},${2*k} v${-13*k} h${5.2*k} v${13*k} Z" fill="#8C6239" stroke="var(--icon)" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M0,${-10*k} l${-6*k},${-5*k} M0,${-13*k} l${6.4*k},${-4.4*k}" stroke="#8C6239" stroke-width="${1.7*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-21*k}" r="${11.4*k}" fill="#5E8B6A" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <circle cx="${-7.4*k}" cy="${-16*k}" r="${6.6*k}" fill="#5E8B6A" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <circle cx="${7.6*k}" cy="${-16.4*k}" r="${6.2*k}" fill="#5E8B6A" stroke="var(--icon)" stroke-width="${1.5*k}"/>
    <circle cx="${-3.4*k}" cy="${-24*k}" r="${5.4*k}" fill="#7BA886" opacity=".65"/>
    <circle cx="${4.6*k}" cy="${-21*k}" r="${4.2*k}" fill="#7BA886" opacity=".55"/>`,

  /* 크리스마스 나무 — 홀로 선 가문비 */
  xmas: k=>`<ellipse cx="0" cy="${1.2*k}" rx="${12*k}" ry="${3*k}" fill="#D9CBA6"/>
    <rect x="${-2*k}" y="${-4*k}" width="${4*k}" height="${5.4*k}" fill="#8C6239" stroke="var(--icon)" stroke-width="${1.2*k}"/>
    <path d="M0,${-32*k} L${8.4*k},${-19*k} L${-8.4*k},${-19*k} Z" fill="#3F6B52" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M0,${-25*k} L${10.6*k},${-11*k} L${-10.6*k},${-11*k} Z" fill="#33604A" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M0,${-17*k} L${12.4*k},${-3.4*k} L${-12.4*k},${-3.4*k} Z" fill="#2C5641" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M0,${-32*k} v${-3.6*k}" stroke="var(--icon)" stroke-width="${1.3*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${-36.8*k}" r="${2.2*k}" fill="var(--d14)" stroke="var(--icon)" stroke-width="${1.1*k}"/>`,

  /* 패치워크 로드 — 빨간 지붕 농가 */
  barn: k=>`<ellipse cx="0" cy="${1.6*k}" rx="${16*k}" ry="${3.2*k}" fill="var(--icon)" opacity=".1"/>
    <rect x="${-13*k}" y="${-11*k}" width="${26*k}" height="${12*k}" rx="${1.4*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.6*k}"/>
    <path d="M${-15*k},${-11*k} L${-9*k},${-20*k} L${9*k},${-20*k} L${15*k},${-11*k} Z" fill="#C4574A" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <g fill="#FFF1D8" stroke="var(--icon)" stroke-width="${1.1*k}">
      <rect x="${-9.4*k}" y="${-8*k}" width="${5*k}" height="${5*k}" rx="${1.2*k}"/>
      <rect x="${4.4*k}" y="${-8*k}" width="${5*k}" height="${5*k}" rx="${1.2*k}"/></g>
    <path d="M${-2.8*k},${1*k} v${-5.4*k} h${5.6*k} v${5.4*k} Z" fill="#A9866A" stroke="var(--icon)" stroke-width="${1.3*k}"/>
    ${conifer(-16*k, 0, .6*k, '#3F6B52')}`,

  /* 사일로 */
  silo: k=>`<ellipse cx="0" cy="${1.4*k}" rx="${11*k}" ry="${2.6*k}" fill="var(--icon)" opacity=".1"/>
    <path d="M${-5.4*k},${1*k} v${-16*k} a${5.4*k},${5.4*k} 0 0 1 ${10.8*k},0 v${16*k} Z"
      fill="#E6DAC0" stroke="var(--icon)" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-5.4*k},${-11*k} h${10.8*k} M${-5.4*k},${-6*k} h${10.8*k}" stroke="#C0AE86" stroke-width="${1.2*k}"/>
    <rect x="${4*k}" y="${-8*k}" width="${11*k}" height="${9*k}" rx="${1.3*k}" fill="#FFFDF6" stroke="var(--icon)" stroke-width="${1.4*k}"/>
    <path d="M${3*k},${-8*k} L${9.5*k},${-13.4*k} L${16*k},${-8*k} Z" fill="#C4574A" stroke="var(--icon)" stroke-width="${1.3*k}" stroke-linejoin="round"/>`,

  /* 도카치다케 연봉 — 눈 얹은 산 */
  mount: k=>`<path d="M${-26*k},0 L${-9*k},${-21*k} L${-2*k},${-13*k} L${8*k},${-27*k} L${26*k},0 Z"
      fill="#B3A98A" stroke="var(--icon)" stroke-width="${1.6*k}" stroke-linejoin="round"/>
    <path d="M${-9*k},${-21*k} L${-13.6*k},${-15.4*k} q${2.6*k},${1.4*k} ${4.4*k},${-.6*k} q${2*k},${2*k} ${4*k},${.4*k} L${-2*k},${-13*k} L${-5.6*k},${-17*k} Z" fill="#FFFFFF"/>
    <path d="M${8*k},${-27*k} L${2.4*k},${-19*k} q${3*k},${1.6*k} ${5.4*k},${-.8*k} q${2.4*k},${2.4*k} ${5*k},${.6*k} Z" fill="#FFFFFF"/>
    <path d="M${13*k},${-19*k} q${4*k},${-3.4*k} ${7*k},${-1*k}" fill="none" stroke="#FFFFFF" stroke-width="${1.8*k}" stroke-linecap="round" opacity=".8"/>
    ${conifer(-21*k, 0, .68*k, '#33604A')}
    ${conifer(21*k, -.4*k, .62*k, '#3F6B52')}`
};

/* ══ 소품 ══ */
function beerMug(k){
  return `<g>
    <path d="M${-4.6*k},${-8*k} h${9.2*k} l${-.9*k},${13*k} h${-7.4*k} Z" fill="#F2C14E" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M${-5.2*k},${-8*k} q${5.2*k},${-4.8*k} ${10.4*k},0 Z" fill="#FFFDF7" stroke="${IK}" stroke-width="${1.3*k}" stroke-linejoin="round"/>
    <path d="M${4.4*k},${-5*k} q${4.8*k},${1.4*k} ${-.2*k},${6.4*k}" fill="none" stroke="${IK}" stroke-width="${1.4*k}" stroke-linecap="round"/>
    <path d="M${-2.2*k},${-4.4*k} v${8*k}" stroke="#FFFFFF" stroke-width="${1.3*k}" opacity=".6" stroke-linecap="round"/></g>`;
}
function ramenBowl(k){
  return `<g>
    <ellipse cx="0" cy="${11.5*k}" rx="${17*k}" ry="${3.4*k}" fill="${IK}" opacity=".12"/>
    <path d="M${-9*k},${-13*k} q${3.4*k},${-3.6*k} 0,${-7.2*k} M${1*k},${-14.5*k} q${3.4*k},${-3.6*k} 0,${-7.2*k}"
          fill="none" stroke="#BFCECC" stroke-width="${1.6*k}" stroke-linecap="round"/>
    <path d="M${-18*k},${-4*k} q${18*k},${21*k} ${36*k},0 Z" fill="#FFFDF6" stroke="${IK}" stroke-width="${1.8*k}" stroke-linejoin="round"/>
    <path d="M${-16*k},${1.5*k} q${16*k},${8*k} ${32*k},0" fill="none" stroke="#E2856B" stroke-width="${1.8*k}"/>
    <ellipse cx="0" cy="${-4*k}" rx="${18*k}" ry="${5.6*k}" fill="#F6D9A8" stroke="${IK}" stroke-width="${1.8*k}"/>
    <ellipse cx="0" cy="${-3.6*k}" rx="${13.6*k}" ry="${3.6*k}" fill="#E8B96E"/>
    <ellipse cx="${-7*k}" cy="${-5.6*k}" rx="${4.2*k}" ry="${3*k}" fill="#FFF6E4" stroke="${IK}" stroke-width="${1.2*k}"/>
    <ellipse cx="${-7*k}" cy="${-5.6*k}" rx="${2*k}" ry="${1.5*k}" fill="#F2A93B"/>
    <path d="M${2.6*k},${-9*k} h${7.4*k} v${6*k} h${-7.4*k} Z" fill="#3D4A46" stroke="${IK}" stroke-width="${1.1*k}"/>
    <circle cx="${-.6*k}" cy="${-2.2*k}" r="${1.4*k}" fill="#7FB069"/>
    <circle cx="${6.4*k}" cy="${-1.6*k}" r="${1.3*k}" fill="#7FB069"/>
    <path d="M${8*k},${-16*k} L${19*k},${-3.4*k} M${11*k},${-17.6*k} L${21.4*k},${-5.4*k}"
          stroke="#C08A52" stroke-width="${1.7*k}" stroke-linecap="round"/></g>`;
}
function seafoodBowl(k){
  return `<g>
    <ellipse cx="0" cy="${9.4*k}" rx="${15*k}" ry="${3*k}" fill="${IK}" opacity=".12"/>
    <path d="M${-15*k},${-3*k} q${15*k},${17*k} ${30*k},0 Z" fill="#FFFDF6" stroke="${IK}" stroke-width="${1.7*k}" stroke-linejoin="round"/>
    <ellipse cx="0" cy="${-3*k}" rx="${15*k}" ry="${4.8*k}" fill="#FFF0D6" stroke="${IK}" stroke-width="${1.7*k}"/>
    <path d="M${-10*k},${-5.4*k} q${-5.4*k},${-4*k} ${-1*k},${-7.4*k}" fill="none" stroke="#F09A6E" stroke-width="${3.2*k}" stroke-linecap="round"/>
    <circle cx="${-8.4*k}" cy="${-3.6*k}" r="${1.7*k}" fill="#7FB069"/>
    <g transform="translate(${4.2*k},${-8.4*k})">
      <path d="M${-7.4*k},${-3*k} q${-5.2*k},${-2*k} ${-4.2*k},${-5.2*k} M${7.4*k},${-3*k} q${5.2*k},${-2*k} ${4.2*k},${-5.2*k}"
            fill="none" stroke="#EE7B5B" stroke-width="${2.3*k}" stroke-linecap="round"/>
      <path d="M${-6.2*k},${3.2*k} l${-4.2*k},${3.2*k} M${6.2*k},${3.2*k} l${4.2*k},${3.2*k}"
            stroke="#EE7B5B" stroke-width="${2.1*k}" stroke-linecap="round"/>
      <ellipse cx="0" cy="0" rx="${7.2*k}" ry="${5.2*k}" fill="#EE7B5B" stroke="${IK}" stroke-width="${1.3*k}"/>
      <circle cx="${-2.4*k}" cy="${-1*k}" r="${1.1*k}" fill="${IK}"/>
      <circle cx="${2.4*k}" cy="${-1*k}" r="${1.1*k}" fill="${IK}"/>
      <path d="M${-1.8*k},${2*k} q${1.8*k},${1.6*k} ${3.6*k},0" fill="none" stroke="${IK}" stroke-width="${1.1*k}" stroke-linecap="round"/>
    </g></g>`;
}
/* 후라노 멜론 반쪽 */
function melon(k){
  return `<g>
    <ellipse cx="0" cy="${6.4*k}" rx="${12*k}" ry="${2.6*k}" fill="${IK}" opacity=".12"/>
    <path d="M${-11*k},${1*k} a${11*k},${11*k} 0 0 1 ${22*k},0 Z" fill="#F3A85E" stroke="${IK}" stroke-width="${1.6*k}" stroke-linejoin="round"/>
    <path d="M${-11*k},${1*k} h${22*k} l${-1.6*k},${4.4*k} h${-18.8*k} Z" fill="#8FBE72" stroke="${IK}" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-6.4*k},${-2.6*k} q${6.4*k},${-3.4*k} ${12.8*k},0" fill="none" stroke="#E08C42" stroke-width="${1.3*k}" stroke-linecap="round"/>
    <circle cx="${-2.4*k}" cy="${-4.6*k}" r="${1.2*k}" fill="#FFF1D8"/>
    <circle cx="${2.6*k}" cy="${-3.4*k}" r="${1.1*k}" fill="#FFF1D8"/></g>`;
}
/* 라벤더 소프트아이스크림 */
function softCream(k){
  return `<g>
    <path d="M${-4.4*k},${1*k} L0,${13*k} L${4.4*k},${1*k} Z" fill="#E0B57A" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M${-4.6*k},${1*k} q${4.6*k},${3*k} ${9.2*k},0" fill="none" stroke="${IK}" stroke-width="${1.2*k}"/>
    <path d="M${-5.4*k},${.6*k} q${-1*k},${-6.4*k} ${5.4*k},${-7*k} q${6.4*k},${.6*k} ${5.4*k},${7*k} Z"
          fill="#C3AEE0" stroke="${IK}" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-3.4*k},${-6.4*k} q${3.4*k},${-4.4*k} ${6.8*k},0" fill="#D2C2E9" stroke="${IK}" stroke-width="${1.3*k}" stroke-linejoin="round"/>
    <path d="M0,${-10.4*k} q${-2.4*k},${-3.4*k} ${1.4*k},${-4.2*k} q${3.4*k},${1.4*k} ${1*k},${4.2*k} Z" fill="#C3AEE0" stroke="${IK}" stroke-width="${1.2*k}"/></g>`;
}

/* ══ 캐릭터 ══ */
/* 곰 — 원점은 목 부근. o.scarf 스카프색, 오른손 소품은 호출부에서 붙인다 */
function bear(k,o){
  o = o || {};
  let g = `<ellipse cx="0" cy="${21.5*k}" rx="${16*k}" ry="${3.6*k}" fill="${IK}" opacity=".12"/>
    <ellipse cx="${-6*k}" cy="${19.6*k}" rx="${4.6*k}" ry="${3.2*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.5*k}"/>
    <ellipse cx="${6*k}" cy="${19.6*k}" rx="${4.6*k}" ry="${3.2*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.5*k}"/>
    <ellipse cx="0" cy="${10*k}" rx="${12.6*k}" ry="${11.2*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.7*k}"/>
    <ellipse cx="${-12.6*k}" cy="${8*k}" rx="${4.4*k}" ry="${6.2*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.5*k}"
             transform="rotate(-16 ${-12.6*k} ${8*k})"/>
    <ellipse cx="${12.6*k}" cy="${8*k}" rx="${4.4*k}" ry="${6.2*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.5*k}"
             transform="rotate(16 ${12.6*k} ${8*k})"/>`;
  if (o.scarf) g += `
    <path d="M${-11.6*k},${1*k} q${11.6*k},${6.2*k} ${23.2*k},0 l0,${4.8*k} q${-11.6*k},${5.4*k} ${-23.2*k},0 Z"
          fill="${o.scarf}" stroke="${IK}" stroke-width="${1.5*k}" stroke-linejoin="round"/>
    <path d="M${-8.4*k},${4.4*k} q${-5.6*k},${3.2*k} ${-4.2*k},${9.6*k} l${5.8*k},${-1.6*k} q${-1.6*k},${-4.4*k} ${2.6*k},${-6.4*k} Z"
          fill="${o.scarf}" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>`;
  g += `
    <circle cx="${-9.6*k}" cy="${-13.6*k}" r="${4.9*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.6*k}"/>
    <circle cx="${9.6*k}" cy="${-13.6*k}" r="${4.9*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.6*k}"/>
    <circle cx="${-9.6*k}" cy="${-13.6*k}" r="${2.2*k}" fill="${ICH}"/>
    <circle cx="${9.6*k}" cy="${-13.6*k}" r="${2.2*k}" fill="${ICH}"/>
    <circle cx="0" cy="${-6*k}" r="${12*k}" fill="${IB}" stroke="${IK}" stroke-width="${1.7*k}"/>
    <circle cx="${-4.5*k}" cy="${-8.2*k}" r="${1.6*k}" fill="${IK}"/>
    <circle cx="${4.5*k}" cy="${-8.2*k}" r="${1.6*k}" fill="${IK}"/>
    <ellipse cx="0" cy="${-2.6*k}" rx="${4.9*k}" ry="${3.6*k}" fill="#FBE7D2"/>
    <ellipse cx="0" cy="${-4.2*k}" rx="${1.7*k}" ry="${1.2*k}" fill="${IK}"/>
    <path d="M${-2.2*k},${-2*k} q${2.2*k},${2.2*k} ${4.4*k},0" fill="none" stroke="${IK}" stroke-width="${1.2*k}" stroke-linecap="round"/>
    <circle cx="${-9.2*k}" cy="${-4*k}" r="${2.1*k}" fill="${ICH}" opacity=".85"/>
    <circle cx="${9.2*k}" cy="${-4*k}" r="${2.1*k}" fill="${ICH}" opacity=".85"/>`;
  return g;
}
/* 빨간 모자 눈사람 */
function snowman(k){
  return `<g>
    <ellipse cx="0" cy="${19.6*k}" rx="${15*k}" ry="${3.4*k}" fill="${IK}" opacity=".1"/>
    <path d="M${-11.6*k},${5*k} l${-7.4*k},${-4.4*k} m${1.6*k},${1*k} l${-2.8*k},${-2.8*k}"
          fill="none" stroke="#A67C52" stroke-width="${1.7*k}" stroke-linecap="round"/>
    <path d="M${11.6*k},${5*k} l${7.4*k},${-4.4*k} m${-1.6*k},${1*k} l${2.8*k},${-2.8*k}"
          fill="none" stroke="#A67C52" stroke-width="${1.7*k}" stroke-linecap="round"/>
    <circle cx="0" cy="${8*k}" r="${12*k}" fill="#FFFFFF" stroke="#C2D5DD" stroke-width="${1.6*k}"/>
    <circle cx="0" cy="${8*k}" r="${1.5*k}" fill="#8FA3A6"/>
    <circle cx="0" cy="${13.4*k}" r="${1.5*k}" fill="#8FA3A6"/>
    <path d="M${-9*k},${-1*k} q${9*k},${5.6*k} ${18*k},0 l0,${4.2*k} q${-9*k},${5*k} ${-18*k},0 Z"
          fill="#4A7FA8" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M${-8*k},${2.4*k} q${-5.6*k},${3*k} ${-4.2*k},${9.4*k} l${5.6*k},${-1.6*k} q${-1.4*k},${-4.2*k} ${2.8*k},${-6.2*k} Z"
          fill="#4A7FA8" stroke="${IK}" stroke-width="${1.3*k}" stroke-linejoin="round"/>
    <circle cx="0" cy="${-7*k}" r="${9.6*k}" fill="#FFFFFF" stroke="#C2D5DD" stroke-width="${1.6*k}"/>
    <path d="M${-7.4*k},${-16.6*k} q${1*k},${-9.4*k} ${7.4*k},${-10*k} q${6.4*k},${.6*k} ${7.4*k},${10*k} Z"
          fill="#E05C4E" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <path d="M${-10.4*k},${-15.8*k} q${10.4*k},${-4.6*k} ${20.8*k},0 l0,${2.6*k} q${-10.4*k},${3.4*k} ${-20.8*k},0 Z"
          fill="#E05C4E" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
    <circle cx="${1*k}" cy="${-27.6*k}" r="${3.3*k}" fill="#FFFFFF" stroke="${IK}" stroke-width="${1.3*k}"/>
    <circle cx="${-3.8*k}" cy="${-7.4*k}" r="${1.6*k}" fill="${IK}"/>
    <circle cx="${3.8*k}" cy="${-7.4*k}" r="${1.6*k}" fill="${IK}"/>
    <path d="M0,${-5.2*k} l${3.8*k},${1.6*k} l${-3.8*k},${1.5*k} Z" fill="#F0954E" stroke="${IK}" stroke-width="${1*k}" stroke-linejoin="round"/>
    <path d="M${-5.6*k},${-2.2*k} q${5.6*k},${3.4*k} ${11.2*k},0" fill="none" stroke="${IK}" stroke-width="${1.2*k}" stroke-linecap="round"/>
    <circle cx="${-7.4*k}" cy="${-4*k}" r="${2*k}" fill="${ICH}" opacity=".85"/>
    <circle cx="${7.4*k}" cy="${-4*k}" r="${2*k}" fill="${ICH}" opacity=".85"/></g>`;
}
/* 배낭 멘 곰 + 카메라 */
function bearHiker(k){
  return `<g>
    <g transform="translate(${14*k},${7*k})">
      <rect x="${-6.4*k}" y="${-8.4*k}" width="${13*k}" height="${16.4*k}" rx="${4.6*k}" fill="#7FA9C4" stroke="${IK}" stroke-width="${1.5*k}"/>
      <path d="M${-6.4*k},${-1*k} h${13*k}" stroke="${IK}" stroke-width="${1.2*k}"/>
      <rect x="${-2.8*k}" y="${1.8*k}" width="${6.2*k}" height="${4.2*k}" rx="${1.3*k}" fill="#F2C14E" stroke="${IK}" stroke-width="${1.1*k}"/>
    </g>
    ${bear(k,{scarf:'#E0A85E'})}
    <g transform="translate(${-.5*k},${9.5*k})">
      <path d="M${-7.6*k},${-4.4*k} q${-5.6*k},${-7.4*k} ${1.4*k},${-10.4*k} M${7.6*k},${-4.4*k} q${5.6*k},${-7.4*k} ${-1.4*k},${-10.4*k}"
            fill="none" stroke="${IK}" stroke-width="${1.3*k}"/>
      <rect x="${-8.2*k}" y="${-5*k}" width="${16.4*k}" height="${11*k}" rx="${2.8*k}" fill="#5C6E70" stroke="${IK}" stroke-width="${1.5*k}"/>
      <rect x="${2.8*k}" y="${-7.2*k}" width="${4.2*k}" height="${2.6*k}" rx="${1*k}" fill="#5C6E70" stroke="${IK}" stroke-width="${1*k}"/>
      <circle cx="0" cy="${.6*k}" r="${3.7*k}" fill="#B8D4E8" stroke="${IK}" stroke-width="${1.4*k}"/>
      <circle cx="${-1.2*k}" cy="${-.6*k}" r="${1.2*k}" fill="#FFFFFF" opacity=".8"/>
    </g></g>`;
}
/* 홋카이도 젖소 — 원점은 발 밑 가운데 */
function cow(k){
  return `<g>
    <ellipse cx="0" cy="${1.4*k}" rx="${20*k}" ry="${3.6*k}" fill="${IK}" opacity=".12"/>
    <g stroke="${IK}" stroke-width="${1.5*k}" stroke-linecap="round">
      <path d="M${-11*k},${-6*k} v${6.6*k}" /><path d="M${-5*k},${-6*k} v${6.6*k}"/>
      <path d="M${7*k},${-6*k} v${6.6*k}" /><path d="M${12.6*k},${-6*k} v${6.6*k}"/></g>
    <path d="M${-16*k},${-14*k} q0,${-8*k} ${8*k},${-8.4*k} h${13*k} q${8*k},${.4*k} ${8*k},${8.4*k} q0,${8*k} ${-8*k},${8*k} h${-13*k} q${-8*k},0 ${-8*k},${-8*k} Z"
          fill="#FFFDF7" stroke="${IK}" stroke-width="${1.8*k}"/>
    <path d="M${-11*k},${-20.4*k} q${6*k},${-2.4*k} ${8*k},${3.4*k} q${1.4*k},${5*k} ${-5*k},${4.4*k} q${-6*k},${-.6*k} ${-3*k},${-7.8*k} Z" fill="#4A4038"/>
    <path d="M${6*k},${-9*k} q${6.4*k},${-1.4*k} ${7*k},${3.4*k} q${.4*k},${3.4*k} ${-4.6*k},${3*k} q${-5.4*k},${-.6*k} ${-2.4*k},${-6.4*k} Z" fill="#4A4038"/>
    <g transform="translate(${-18.6*k},${-16*k})">
      <path d="M${-6.4*k},${-8.4*k} q${-3.4*k},${-4.4*k} ${1.4*k},${-4.6*k} q${2.6*k},${.2*k} ${2.4*k},${3.6*k}" fill="#FFFDF7" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
      <path d="M${4.4*k},${-9*k} q${3.4*k},${-4.4*k} ${-1.4*k},${-4.6*k} q${-2.6*k},${.2*k} ${-2.4*k},${3.6*k}" fill="#FFFDF7" stroke="${IK}" stroke-width="${1.4*k}" stroke-linejoin="round"/>
      <path d="M${-8*k},${-4*k} q0,${-6.4*k} ${7*k},${-6.4*k} q${7*k},0 ${7*k},${6.4*k} q0,${7.4*k} ${-7*k},${7.4*k} q${-7*k},0 ${-7*k},${-7.4*k} Z"
            fill="#FFFDF7" stroke="${IK}" stroke-width="${1.7*k}"/>
      <ellipse cx="${-1*k}" cy="${2.6*k}" rx="${5.4*k}" ry="${3.8*k}" fill="${ICH}" stroke="${IK}" stroke-width="${1.3*k}"/>
      <ellipse cx="${-2.8*k}" cy="${2*k}" rx="${1.1*k}" ry="${.8*k}" fill="${IK}"/>
      <ellipse cx="${1*k}" cy="${2.2*k}" rx="${1.1*k}" ry="${.8*k}" fill="${IK}"/>
      <circle cx="${-3.8*k}" cy="${-3*k}" r="${1.5*k}" fill="${IK}"/>
      <circle cx="${4*k}" cy="${-2.6*k}" r="${1.5*k}" fill="${IK}"/></g>
    <path d="M${17*k},${-19*k} q${5.4*k},${-2*k} ${4.4*k},${5*k}" fill="none" stroke="${IK}" stroke-width="${1.5*k}" stroke-linecap="round"/>
    <path d="M${21.4*k},${-14*k} q${2.4*k},${1.6*k} ${.6*k},${3.6*k}" fill="none" stroke="#4A4038" stroke-width="${2.6*k}" stroke-linecap="round"/></g>`;
}
/* 양 — 원점은 발 밑 가운데 */
function sheep(k){
  return `<g>
    <ellipse cx="0" cy="${1.2*k}" rx="${14*k}" ry="${2.8*k}" fill="${IK}" opacity=".12"/>
    <g stroke="${IK}" stroke-width="${1.4*k}" stroke-linecap="round">
      <path d="M${-7*k},${-5*k} v${5.4*k}"/><path d="M${-2.6*k},${-5*k} v${5.4*k}"/>
      <path d="M${5*k},${-5*k} v${5.4*k}"/><path d="M${9*k},${-5*k} v${5.4*k}"/></g>
    <g fill="#FFFDF7" stroke="${IK}" stroke-width="${1.5*k}">
      <circle cx="${-8*k}" cy="${-12*k}" r="${5.4*k}"/><circle cx="${-1*k}" cy="${-15*k}" r="${5.8*k}"/>
      <circle cx="${6.4*k}" cy="${-13*k}" r="${5.4*k}"/><circle cx="${11*k}" cy="${-9.4*k}" r="${4.4*k}"/>
      <circle cx="${-9.4*k}" cy="${-6.6*k}" r="${4.4*k}"/><circle cx="${-1*k}" cy="${-8*k}" r="${5.4*k}"/>
      <circle cx="${6.4*k}" cy="${-7*k}" r="${4.6*k}"/></g>
    <g transform="translate(${-13.4*k},${-13.4*k})">
      <ellipse cx="${-5.4*k}" cy="${1*k}" rx="${3.4*k}" ry="${2.2*k}" fill="#E8E0D4" stroke="${IK}" stroke-width="${1.3*k}" transform="rotate(-22 ${-5.4*k} ${1*k})"/>
      <ellipse cx="0" cy="0" rx="${5.6*k}" ry="${6.2*k}" fill="#4E453C" stroke="${IK}" stroke-width="${1.5*k}"/>
      <circle cx="${-1.8*k}" cy="${-1.4*k}" r="${1.3*k}" fill="#FFFFFF"/>
      <circle cx="${2.2*k}" cy="${-1.2*k}" r="${1.3*k}" fill="#FFFFFF"/>
      <circle cx="${-1.8*k}" cy="${-1.4*k}" r="${.7*k}" fill="${IK}"/>
      <circle cx="${2.2*k}" cy="${-1.2*k}" r="${.7*k}" fill="${IK}"/>
      <ellipse cx="${.4*k}" cy="${3*k}" rx="${1.8*k}" ry="${1.3*k}" fill="#E8E0D4"/></g></g>`;
}

/* ── 손글씨 느낌 텍스트 (양옆 작은 강조선) ── */
function handText(cx,cy,lines,fs,rot,ticks){
  const txt = lines.map((t,i)=>
    `<text class="hand" x="0" y="${f1(i*fs*1.36)}" font-size="${f1(fs)}" text-anchor="middle">${t}</text>`).join('');
  const w = Math.max(...lines.map(tw))*fs/2 + fs*.5;
  const tk = ticks ? `<g stroke="#7E8F90" stroke-width="${f1(fs*.13)}" stroke-linecap="round" fill="none">
    <path d="M${f1(-w-fs*.5)},${f1(-fs*.9)} l${f1(-fs*.3)},${f1(fs*.85)} M${f1(-w-fs*.05)},${f1(-fs*1.05)} l${f1(fs*.12)},${f1(-fs*.6)}"/>
    <path d="M${f1(w+fs*.5)},${f1(-fs*.9)} l${f1(fs*.3)},${f1(fs*.85)} M${f1(w+fs*.05)},${f1(-fs*1.05)} l${f1(-fs*.12)},${f1(-fs*.6)}"/></g>` : '';
  return `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${rot||0})">${tk}${txt}</g>`;
}

/* 눈 쌓인 빨간 청사 (삿포로) */
function govBuilding(cx,cy,k){
  return `<g transform="translate(${f1(cx)},${f1(cy)})">
    <path d="M${-34*k},${16*k} q${11*k},${-9*k} ${24*k},${-3.4*k} q${13*k},${5.4*k} ${22*k},${1*k} L${36*k},${24*k} L${-36*k},${24*k} Z" fill="#FFFFFF"/>
    ${conifer(-27*k, 13*k, .8*k, '#3F6B52')}
    ${conifer(27*k, 14*k, .9*k, '#33604A')}
    <rect x="${-20*k}" y="${-6*k}" width="${40*k}" height="${18*k}" rx="${1.8*k}" fill="#B75B4A" stroke="${IK}" stroke-width="${1.5*k}"/>
    <path d="M${-22*k},${-6*k} q${22*k},${-7.4*k} ${44*k},0 Z" fill="#FFFFFF" stroke="#C2D5DD" stroke-width="${1.2*k}"/>
    <rect x="${-6*k}" y="${-19*k}" width="${12*k}" height="${13*k}" rx="${1.8*k}" fill="#B75B4A" stroke="${IK}" stroke-width="${1.4*k}"/>
    <path d="M${-8.4*k},${-19*k} q${8.4*k},${-8.4*k} ${16.8*k},0 Z" fill="#FFFFFF" stroke="#C2D5DD" stroke-width="${1.2*k}"/>
    <path d="M0,${-24.6*k} v${-4.4*k}" stroke="${IK}" stroke-width="${1.3*k}" stroke-linecap="round"/>
    <g fill="#FFF1D8" stroke="${IK}" stroke-width="${1*k}">
      <rect x="${-17*k}" y="${-2.6*k}" width="${4.4*k}" height="${5.4*k}" rx="${1.3*k}"/>
      <rect x="${-10*k}" y="${-2.6*k}" width="${4.4*k}" height="${5.4*k}" rx="${1.3*k}"/>
      <rect x="${5.6*k}" y="${-2.6*k}" width="${4.4*k}" height="${5.4*k}" rx="${1.3*k}"/>
      <rect x="${12.6*k}" y="${-2.6*k}" width="${4.4*k}" height="${5.4*k}" rx="${1.3*k}"/>
      <rect x="${-2.3*k}" y="${-15.6*k}" width="${4.6*k}" height="${4.6*k}" rx="${1.2*k}"/></g>
    <path d="M${-3.4*k},${12*k} v${-4*k} a${3.4*k},${3.4*k} 0 0 1 ${6.8*k},0 v${4*k} Z" fill="#F6E3C4" stroke="${IK}" stroke-width="${1.2*k}"/>
  </g>`;
}
