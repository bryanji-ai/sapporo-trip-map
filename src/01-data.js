/* ══════════════════════════════════════════════════════════════
   후니＆어니의 홋카이도 여행 기록 지도
   지역 세 곳(삿포로 · 오타루 · 비에이)을 한 파일에서 전환한다.
   지형은 OSM Overpass, 비에이 언덕은 SRTM 30m DEM에서 받아 굳혔다.

   장소는 하드코딩하지 않는다. 드라이브 「삿포로여행_사진」 폴더의
   사진에서 Apps Script 가 EXIF GPS 를 읽어 넘겨준 것을 06-load.js 가
   받아 PLACES 에 채운다. 이 파일은 그릇과 규칙만 정의한다.
   ══════════════════════════════════════════════════════════════ */

/* ── 장소 — 웹앱에서 채운다 (06-load.js) ── */
let PLACES = [];

/* 지금 보이는 PLACES 가 드라이브에서 온 실데이터인지 (false 면 아래 샘플).
   지도 핀은 샘플이라도 위치 참고용으로 보여주지만,
   「펼쳐보기」는 실데이터가 올 때까지 비워둔다 — 05-render.js buildExpand(). */
let isLive = false;

/* ── 샘플 일정 — 드라이브에서 받은 사진이 하나도 없을 때만 쓴다 ──
   좌표는 실제, 시간 · 사진 수 · 금액은 지도가 어떻게 보이는지 미리
   확인하기 위한 가짜 값이다. 사진이 한 장이라도 올라오면 전부 밀린다. */
const SAMPLE_PLACES = [
  /* ── 삿포로 ── */
  {g:'sapporo',d:'9/11',k:'stay',t:'16:40',n:'숙소 체크인',       j:'ホテル',                  lat:43.0645,lon:141.3520,ph:3, pay:[['숙소 잔금','¥0']]},
  {g:'sapporo',d:'9/11',k:'food',t:'17:05',n:'후쿠스케',          j:'北海道産羊・野菜ふくすけ',  lat:43.0546,lon:141.3520,ph:14,pay:[['양고기 코스 2인','¥9,800'],['생맥주 3','¥1,800']]},
  {g:'sapporo',d:'9/11',k:'food',t:'20:14',n:'라멘 요코초',       j:'元祖さっぽろラーメン横丁',  lat:43.0553,lon:141.3536,ph:9, pay:[['미소라멘 2','¥2,400'],['삿포로 클래식','¥800']]},
  {g:'sapporo',d:'9/11',k:'food',t:'21:30',n:'돈키호테 타누키코지',j:'ドン・キホーテ 狸小路',    lat:43.0570,lon:141.3500,ph:5, pay:[['간식·상비약','¥4,320']]},
  {g:'sapporo',d:'9/12',k:'move',t:'07:28',n:'삿포로역',          j:'札幌駅',                  lat:43.0686,lon:141.3508,ph:6, pay:[['편의점 커피 2','¥360']]},
  {g:'sapporo',d:'9/12',k:'food',t:'07:40',n:'세이코마트',        j:'セイコーマート',           lat:43.0670,lon:141.3490,ph:2, pay:[['도시락 2·음료','¥1,180']]},
  {g:'sapporo',d:'9/12',k:'food',t:'21:05',n:'스스키노 바',       j:'ザ・バー ナノ・フェムト',   lat:43.0555,lon:141.3560,ph:11,pay:[['위스키 2잔','¥3,600']]},
  {g:'sapporo',d:'9/13',k:'tour',t:'09:12',n:'포플러 가로수길',   j:'北海道大学 ポプラ並木',     lat:43.0760,lon:141.3395,ph:23,pay:[]},
  {g:'sapporo',d:'9/13',k:'tour',t:'10:05',n:'은행나무길',        j:'北海道大学 イチョウ並木',   lat:43.0730,lon:141.3430,ph:18,pay:[]},
  {g:'sapporo',d:'9/13',k:'move',t:'19:20',n:'니조시장',          j:'二条市場',                lat:43.0575,lon:141.3563,ph:12,pay:[['성게덮밥·게','¥7,400']]},
  {g:'sapporo',d:'9/14',k:'tour',t:'09:40',n:'오도리공원',        j:'大通公園',                lat:43.0595,lon:141.3510,ph:16,pay:[['옥수수 2','¥600']]},
  {g:'sapporo',d:'9/14',k:'food',t:'10:35',n:'롯카테이 본점',     j:'六花亭 札幌本店',          lat:43.0620,lon:141.3548,ph:8, pay:[['마루세이 버터샌드 외','¥6,840']]},
  {g:'sapporo',d:'9/14',k:'move',t:'12:10',n:'삿포로역',          j:'札幌駅',                  lat:43.0686,lon:141.3508,ph:12,pay:[['공항 특급 2매','¥2,600']]},

  /* ── 비에이 · 후라노 (9/12 하루) ── */
  {g:'biei',d:'9/12',k:'move',t:'09:35',n:'비에이역',            j:'美瑛駅',                  lat:43.5883,lon:142.4675,ph:5, pay:[['렌터카 인수','¥8,800']]},
  {g:'biei',d:'9/12',k:'tour',t:'10:00',n:'제루부의 언덕',       j:'ぜるぶの丘',              lat:43.6070,lon:142.4570,ph:9, pay:[['입장·트랙터버스','¥1,000']]},
  {g:'biei',d:'9/12',k:'tour',t:'10:35',n:'켄과 메리의 나무',    j:'ケンとメリーの木',         lat:43.6197,lon:142.4463,ph:7, pay:[]},
  {g:'biei',d:'9/12',k:'tour',t:'11:00',n:'패치워크 로드',       j:'パッチワークの路',         lat:43.6120,lon:142.4380,ph:12,pay:[]},
  {g:'biei',d:'9/12',k:'tour',t:'11:40',n:'크리스마스 나무',     j:'クリスマスツリーの木',      lat:43.5478,lon:142.4356,ph:6, pay:[]},
  {g:'biei',d:'9/12',k:'tour',t:'12:05',n:'세븐스타 나무',       j:'セブンスターの木',         lat:43.5417,lon:142.4744,ph:8, pay:[]},
  {g:'biei',d:'9/12',k:'food',t:'12:40',n:'준페이',              j:'洋食とcafe じゅんぺい',    lat:43.5893,lon:142.4640,ph:6, pay:[['새우튀김덮밥 2','¥3,300']]},
  {g:'biei',d:'9/12',k:'tour',t:'14:00',n:'사계채의 언덕',       j:'四季彩の丘',              lat:43.5546,lon:142.4638,ph:21,pay:[['입장료 2','¥1,000'],['알파카 목장','¥1,000']]},
  {g:'biei',d:'9/12',k:'tour',t:'15:20',n:'청의 호수',           j:'白金 青い池',             lat:43.5169,lon:142.6236,ph:17,pay:[['주차료','¥500']]},
  {g:'biei',d:'9/12',k:'tour',t:'16:00',n:'흰수염폭포',          j:'白ひげの滝',              lat:43.4914,lon:142.6414,ph:10,pay:[]},
  {g:'biei',d:'9/12',k:'tour',t:'17:10',n:'팜 도미타',           j:'ファーム富田',            lat:43.4185,lon:142.4744,ph:15,pay:[['라벤더 소프트 2','¥900'],['기념품','¥3,600']]},
  {g:'biei',d:'9/12',k:'food',t:'18:05',n:'세이코마트 비에이',   j:'セイコーマート 美瑛店',     lat:43.5905,lon:142.4700,ph:2, pay:[['음료·간식','¥980']]},

  /* ── 오타루 (9/13 오후) ── */
  {g:'otaru',d:'9/13',k:'move',t:'13:00',n:'오타루역',           j:'小樽駅',                  lat:43.1985,lon:140.9944,ph:2, pay:[['JR','¥800']]},
  {g:'otaru',d:'9/13',k:'tour',t:'13:30',n:'오타루 운하',        j:'小樽運河',                lat:43.1975,lon:140.9995,ph:6,pay:[]},
  {g:'otaru',d:'9/13',k:'food',t:'14:20',n:'마스야',             j:'政寿司',                  lat:43.1963,lon:140.9930,ph:3, pay:[['초밥 2인','¥12,000']]},
  {g:'otaru',d:'9/13',k:'tour',t:'15:10',n:'사카이마치',         j:'堺町通り商店街',           lat:43.1925,lon:140.9958,ph:5,pay:[['기념품','¥5,200']]},
  {g:'otaru',d:'9/13',k:'tour',t:'16:00',n:'오르골당',           j:'小樽オルゴール堂',         lat:43.1905,lon:140.9972,ph:2, pay:[['오르골','¥3,800']]}
];

/* ── 날짜 — 「펼쳐보기」 탭에서만 쓴다. 지도는 필터 없이 전체를 보여준다 ──
   id 는 "9/11" 처럼 월/일. 사진 날짜에서 만들어지므로 미리 아는 4일은
   설명과 색을 붙여두고, 그 밖의 날은 자동으로 만든다. */
const DAY_META = {
  '9/11': {note:'도착 · 스스키노',      c:'--d11'},
  '9/12': {note:'비에이 · 후라노',      c:'--d12'},
  '9/13': {note:'오타루 · 운하',        c:'--d13'},
  '9/14': {note:'오도리공원 · 귀국',    c:'--d14'}
};
const DAY_C  = ['--d11','--d12','--d13','--d14'];
const WEEKDAY = ['일','월','화','수','목','금','토'];
const NO_DAY = '날짜 미상';

let DAYS = [];

/* "9/11" → 9월 11일이 무슨 요일인지 붙여 라벨을 만든다 (여행 연도 2026) */
function dayLabel(id){
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(id);
  if (!m) return id;
  const w = WEEKDAY[new Date(2026, +m[1]-1, +m[2]).getDay()];
  return `${id} ${w}`;
}
function dayCmp(a,b){
  if (a === NO_DAY) return 1;
  if (b === NO_DAY) return -1;
  const [am,ad] = a.split('/').map(Number), [bm,bd] = b.split('/').map(Number);
  return (am-bm) || (ad-bd);
}
/* 실제로 사진이 있는 날짜만 만든다 — 빈 날은 아예 나오지 않는다 */
function buildDays(){
  const ids = [...new Set(PLACES.map(p => p.d))].sort(dayCmp);
  DAYS = ids.map((id,i) => {
    const m = DAY_META[id] || {};
    return {id, label:dayLabel(id), note:m.note || '', c:m.c || DAY_C[i % DAY_C.length]};
  });
}
/* 날짜를 못 찾아도 절대 터지지 않게 — 없는 날은 회색으로 돌려준다 */
function dayOf(id){
  return DAYS.find(d => d.id === id) || {id, label:dayLabel(id), note:'', c:'--ink-3'};
}

/* ── 핀 색 = 장소 종류 ── */
const CAT = {
  tour: {c:'--tourist',      n:'주요 관광지'},
  food: {c:'--food',         n:'맛집 · 쇼핑'},
  stay: {c:'--hotel',        n:'숙소'},
  move: {c:'--sapporo-blue', n:'시장 · 교통'},
  spec: {c:'--accent',       n:'특별 일정'}
};

/* 사진에는 장소 종류가 없다 — 이름에서 눈치껏 고른다.
   웹앱이 k(또는 cat)를 직접 주면 그걸 그대로 쓴다. */
const CAT_HINT = [
  ['stay', /호텔|숙소|료칸|게스트|hotel|inn|hostel|ホテル|旅館/i],
  ['move', /역$|역\s|공항|터미널|시장|버스|정류|항$|부두|station|airport|市場|駅|港/i],
  ['food', /라멘|스시|초밥|식당|맛집|카페|커피|바$|이자카야|편의점|마트|백화점|상점|빵|디저트|소프트|맥주|고기|국수|우동|카레|ramen|sushi|cafe|coffee|bar|market|ラーメン|寿司|食堂|カフェ/i],
  ['tour', /공원|신사|절|사원|타워|전망|미술관|박물관|수족관|운하|호수|폭포|언덕|나무|정원|park|museum|tower|shrine|canal|公園|神社|寺|美術館|博物館/i]
];
function guessCat(name){
  for (const [k,re] of CAT_HINT) if (re.test(name || '')) return k;
  return 'tour';
}

/* ── 지역 판별 ──
   사진 GPS 좌표가 어느 지역 지도에 찍힐지 정한다. 세 상자는 서로 겹치지 않는다.
   상자는 각 지형 데이터(tools/*.json)의 bbox 를 반드시 덮어야 한다 —
   상자 안이지만 지형 밖인 좌표는 지도 밖에 찍히므로 아래에서 한 번 더 걸러낸다. */
const REGION_BOUNDS = {
  sapporo: [43.00, 141.20, 43.20, 141.50],
  otaru:   [43.10, 140.90, 43.30, 141.10],
  /* 청의 호수(142.6236)·흰수염폭포(142.6414)가 들어와야 해서 동쪽을 142.70 까지 연다 */
  biei:    [43.40, 142.30, 43.70, 142.70]
};
function regionOf(lat, lon){
  for (const [g,[s,w,n,e]] of Object.entries(REGION_BOUNDS))
    if (lat >= s && lat <= n && lon >= w && lon <= e) return g;
  return null;
}
/* 지형 bbox 안에 실제로 들어오는지 — 지도 밖 핀을 막는다 */
function inMap(g, lat, lon){
  const R = REGIONS[g];
  if (!R) return false;
  const [s,w,n,e] = R.map.bbox;
  return lat >= s && lat <= n && lon >= w && lon <= e;
}

/* ── 지역 ── */
const REGIONS = {
  sapporo: {
    key:'sapporo', name:'삿포로', jp:'札幌', kind:'city', map:MAPS.sapporo,
    scaleLabel:'500 m', scaleMeters:500,
    marks:[
      {n:'삿포로역',    lat:43.0686, lon:141.3478, ic:'station',    s:1.05, dy:1},
      {n:'TV타워',      lat:43.0609, lon:141.3565, ic:'tvtower',    s:1.05, dy:2},
      {n:'시계탑',      lat:43.0627, lon:141.3518, ic:'clocktower', s:1.0,  dy:1},
      {n:'오도리공원',  lat:43.0595, lon:141.3465, ic:'fountain',   s:1.0,  dy:5},
      {n:'스스키노',    lat:43.0548, lon:141.3495, ic:'neon',       s:1.05, dy:6},
      {n:'니조시장',    lat:43.0576, lon:141.3585, ic:'tent',       s:1.0,  dy:6},
      {n:'홋카이도대',  lat:43.0748, lon:141.3420, ic:'brick',      s:1.0,  dy:2},
      {n:'맥주박물관',  lat:43.0708, lon:141.3690, ic:'beer',       s:1.0},
      {n:'나카지마공원',lat:43.0468, lon:141.3540, ic:'pond',       s:1.0},
      /* 모이와야마 정상(43.0264)은 지도 남쪽 경계 밖이라 북사면(로프웨이 산록역 쪽)에 세운다 */
      {n:'모이와야마',  lat:43.0330, lon:141.3238, ic:'mount',      s:1.1,  dy:3},
      /* 라벨 없는 장식 — 삿포로 시덴(트램) */
      {n:'',            lat:43.0664, lon:141.3428, ic:'tram', s:0.9,  bare:1},
      {n:'',            lat:43.0672, lon:141.3560, ic:'tram', s:0.85, bare:1}
    ]
  },
  otaru: {
    key:'otaru', name:'오타루', jp:'小樽', kind:'coast', map:MAPS.otaru,
    scaleLabel:'500 m', scaleMeters:500,
    marks:[
      {n:'오타루역',      lat:43.1985, lon:140.9944, ic:'station',    s:1.0,  dy:1},
      {n:'오타루 운하',   lat:43.1975, lon:140.9995, ic:'warehouse',  s:1.05, dy:2},
      {n:'사카이마치',    lat:43.1925, lon:140.9958, ic:'tent',       s:0.95, dy:5},
      {n:'오르골당',      lat:43.1905, lon:140.9972, ic:'clocktower', s:0.95, dy:2},
      {n:'스시야도리',    lat:43.1972, lon:140.9928, ic:'sushi',      s:0.95, dy:5},
      {n:'미나미오타루역',lat:43.1897, lon:140.9992, ic:'station',    s:0.8,  dy:1},
      {n:'오타루항',      lat:43.2040, lon:141.0040, ic:'boat',       s:1.0,  dy:3},
      {n:'텐구야마',      lat:43.1772, lon:140.9792, ic:'mount',      s:1.1,  dy:3},
      {n:'오타루수족관',  lat:43.2228, lon:140.9758, ic:'pond',       s:0.9,  dy:2},
      /* 라벨 없는 장식 — 바다 위 배 (좌표가 실제로 바다 안인지 확인해 골랐다) */
      {n:'',              lat:43.2085, lon:141.0120, ic:'boat', s:0.7,  bare:1},
      {n:'',              lat:43.2270, lon:141.0250, ic:'boat', s:0.62, bare:1}
    ]
  },
  biei: {
    key:'biei', name:'비에이', jp:'美瑛', kind:'rural', map:MAPS.biei, dem:DEM_BIEI,
    scaleLabel:'5 km', scaleMeters:5000,
    marks:[
      {n:'비에이역',      lat:43.5883, lon:142.4790, ic:'station',   s:0.8,  dy:1},
      {n:'사계채의 언덕', lat:43.5546, lon:142.4560, ic:'stripehill', s:0.95, dy:3},
      {n:'청의 호수',     lat:43.5169, lon:142.6236, ic:'bluepond',  s:0.95, dy:3},
      {n:'흰수염폭포',    lat:43.4880, lon:142.6414, ic:'waterfall', s:0.9,  dy:2},
      {n:'팜 도미타',     lat:43.4185, lon:142.4744, ic:'lavender',  s:0.95, dy:3},
      {n:'켄과 메리의 나무',lat:43.6197,lon:142.4463, ic:'bigtree',   s:0.9,  dy:2},
      {n:'세븐스타 나무', lat:43.5417, lon:142.4744, ic:'bigtree',    s:0.85, dy:2},
      {n:'크리스마스 나무',lat:43.5478,lon:142.4356, ic:'xmas',      s:0.9,  dy:2},
      {n:'패치워크 로드', lat:43.6150, lon:142.4230, ic:'barn',      s:0.9,  dy:3},
      {n:'도카치다케 연봉',lat:43.4560,lon:142.6300, ic:'mount',     s:1.15, dy:3},
      /* 라벨 없는 장식 */
      {n:'',              lat:43.5700, lon:142.4180, ic:'barn', s:0.7, bare:1},
      {n:'',              lat:43.6300, lon:142.5400, ic:'silo', s:0.7, bare:1},
      {n:'',              lat:43.4700, lon:142.4300, ic:'silo', s:0.65,bare:1}
    ]
  }
};

/* 화면 왼쪽 위 전환 버튼과 포스터 패널 순서 */
const REGION_ORDER = ['sapporo','biei','otaru'];

/* ── 투영 · 화면 맞추기 ── */
function projector(map){
  const [S,W,N,E] = map.bbox;
  const KX = Math.cos((S+N)/2 * Math.PI/180);
  const SPX = (E-W)*KX, SPY = (N-S);
  return (lat,lon) => [ (lon-W)*KX/SPX*map.w, (N-lat)/SPY*map.h ];
}
Object.values(REGIONS).forEach(R => { R.px = projector(R.map); });

/* 1px 이 실제 몇 m 인지 — 축척 바에 쓴다 */
function metersPerPx(map){
  const [S,W,N,E] = map.bbox;
  return (N-S) * 111320 / map.h;
}

/* 보이는 핀을 다 담되 너무 좁아지지 않게 잡는다 */
function fit(map, pts, padMin, ratio, clamp){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  if (!pts.length){ x0=0; y0=0; x1=map.w; y1=map.h; }   // 핀이 없으면 지도 전체
  pts.forEach(([x,y])=>{ x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y); });
  const pad = Math.max(padMin, (x1-x0)*0.18, (y1-y0)*0.12);
  x0-=pad; y0-=pad; x1+=pad; y1+=pad;
  let w=x1-x0, h=y1-y0;
  // 원하는 세로/가로 비율에 맞춰 짧은 쪽을 넓힌다
  if (h/w < ratio){ const nh=w*ratio; y0-=(nh-h)/2; h=nh; }
  else            { const nw=h/ratio; x0-=(nw-w)/2; w=nw; }
  // 화면용은 지도 밖으로 나가면 안쪽으로 민다.
  // 포스터는 비율을 정확히 맞춰야 해서 clamp=false — 지반을 넉넉히 깔아둔다.
  if (clamp === false) return [x0,y0,w,h];
  if (x0<0){x0=0} if (y0<0){y0=0}
  if (x0+w>map.w) x0=Math.max(0,map.w-w);
  if (y0+h>map.h) y0=Math.max(0,map.h-h);
  return [x0,y0,Math.min(w,map.w),Math.min(h,map.h)];
}

const placesOf = g => PLACES.map((p,i)=>({p,i})).filter(o => o.p.g === g);
