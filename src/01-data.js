/* ══════════════════════════════════════════════════════════════
   후니＆어니의 홋카이도 여행 기록 지도
   지역 두 곳(삿포로 · 비에이)을 한 파일에서 전환한다.
   지형은 OSM Overpass, 비에이 언덕은 SRTM 30m DEM에서 받아 굳혔다.
   ══════════════════════════════════════════════════════════════ */

/* ── 날짜 — 「펼쳐보기」 탭에서만 쓴다. 지도는 필터 없이 전체를 보여준다 ── */
const DAYS = [
  {id:'11', label:'9/11 금', note:'도착 · 스스키노',      c:'--d11'},
  {id:'12', label:'9/12 토', note:'비에이 · 후라노',      c:'--d12'},
  {id:'13', label:'9/13 일', note:'홋카이도대 · 니조시장', c:'--d13'},
  {id:'14', label:'9/14 월', note:'오도리공원 · 귀국',    c:'--d14'}
];

/* ── 핀 색 = 장소 종류 ── */
const CAT = {
  tour: {c:'--tourist',      n:'주요 관광지'},
  food: {c:'--food',         n:'맛집 · 쇼핑'},
  stay: {c:'--hotel',        n:'숙소'},
  move: {c:'--sapporo-blue', n:'시장 · 교통'},
  spec: {c:'--accent',       n:'특별 일정'}
};

/* ── 장소 (좌표는 실제, 방문 기록·사진 수·금액은 샘플) ──
   g: 어느 지도에 찍히는 핀인지 */
const PLACES = [
  /* ── 삿포로 ── */
  {g:'sapporo',d:'11',k:'stay',t:'16:40',n:'숙소 체크인',       j:'ホテル',                  lat:43.0645,lon:141.3520,ph:3, pay:[['숙소 잔금','¥0']]},
  {g:'sapporo',d:'11',k:'food',t:'17:05',n:'후쿠스케',          j:'北海道産羊・野菜ふくすけ',  lat:43.0546,lon:141.3520,ph:14,pay:[['양고기 코스 2인','¥9,800'],['생맥주 3','¥1,800']]},
  {g:'sapporo',d:'11',k:'food',t:'20:14',n:'라멘 요코초',       j:'元祖さっぽろラーメン横丁',  lat:43.0553,lon:141.3536,ph:9, pay:[['미소라멘 2','¥2,400'],['삿포로 클래식','¥800']]},
  {g:'sapporo',d:'11',k:'food',t:'21:30',n:'돈키호테 타누키코지',j:'ドン・キホーテ 狸小路',    lat:43.0570,lon:141.3500,ph:5, pay:[['간식·상비약','¥4,320']]},
  {g:'sapporo',d:'12',k:'move',t:'07:28',n:'삿포로역',          j:'札幌駅',                  lat:43.0686,lon:141.3508,ph:6, pay:[['편의점 커피 2','¥360']]},
  {g:'sapporo',d:'12',k:'food',t:'07:40',n:'세이코마트',        j:'セイコーマート',           lat:43.0670,lon:141.3490,ph:2, pay:[['도시락 2·음료','¥1,180']]},
  {g:'sapporo',d:'12',k:'food',t:'21:05',n:'스스키노 바',       j:'ザ・バー ナノ・フェムト',   lat:43.0555,lon:141.3560,ph:11,pay:[['위스키 2잔','¥3,600']]},
  {g:'sapporo',d:'13',k:'tour',t:'09:12',n:'포플러 가로수길',   j:'北海道大学 ポプラ並木',     lat:43.0760,lon:141.3395,ph:23,pay:[]},
  {g:'sapporo',d:'13',k:'tour',t:'10:05',n:'은행나무길',        j:'北海道大学 イチョウ並木',   lat:43.0730,lon:141.3430,ph:18,pay:[]},
  {g:'sapporo',d:'13',k:'move',t:'12:52',n:'삿포로역',          j:'札幌駅',                  lat:43.0686,lon:141.3508,ph:4, pay:[['JR 승차권 2매','¥1,600']]},
  {g:'sapporo',d:'13',k:'move',t:'19:20',n:'니조시장',          j:'二条市場',                lat:43.0575,lon:141.3563,ph:12,pay:[['성게덮밥·게','¥7,400']]},
  {g:'sapporo',d:'14',k:'tour',t:'09:40',n:'오도리공원',        j:'大通公園',                lat:43.0595,lon:141.3510,ph:16,pay:[['옥수수 2','¥600']]},
  {g:'sapporo',d:'14',k:'food',t:'10:35',n:'롯카테이 본점',     j:'六花亭 札幌本店',          lat:43.0620,lon:141.3548,ph:8, pay:[['마루세이 버터샌드 외','¥6,840']]},
  {g:'sapporo',d:'14',k:'move',t:'12:10',n:'삿포로역',          j:'札幌駅',                  lat:43.0686,lon:141.3508,ph:12,pay:[['공항 특급 2매','¥2,600']]},

  /* ── 비에이 · 후라노 (9/12 하루) ── */
  {g:'biei',d:'12',k:'move',t:'09:35',n:'비에이역',            j:'美瑛駅',                  lat:43.5883,lon:142.4675,ph:5, pay:[['렌터카 인수','¥8,800']]},
  {g:'biei',d:'12',k:'tour',t:'10:00',n:'제루부의 언덕',       j:'ぜるぶの丘',              lat:43.6070,lon:142.4570,ph:9, pay:[['입장·트랙터버스','¥1,000']]},
  {g:'biei',d:'12',k:'tour',t:'10:35',n:'켄과 메리의 나무',    j:'ケンとメリーの木',         lat:43.6197,lon:142.4463,ph:7, pay:[]},
  {g:'biei',d:'12',k:'tour',t:'11:00',n:'패치워크 로드',       j:'パッチワークの路',         lat:43.6120,lon:142.4380,ph:12,pay:[]},
  {g:'biei',d:'12',k:'tour',t:'11:40',n:'크리스마스 나무',     j:'クリスマスツリーの木',      lat:43.5478,lon:142.4356,ph:6, pay:[]},
  {g:'biei',d:'12',k:'tour',t:'12:05',n:'세븐스타 나무',       j:'セブンスターの木',         lat:43.5417,lon:142.4744,ph:8, pay:[]},
  {g:'biei',d:'12',k:'food',t:'12:40',n:'준페이',              j:'洋食とcafe じゅんぺい',    lat:43.5893,lon:142.4640,ph:6, pay:[['새우튀김덮밥 2','¥3,300']]},
  {g:'biei',d:'12',k:'tour',t:'14:00',n:'사계채의 언덕',       j:'四季彩の丘',              lat:43.5546,lon:142.4638,ph:21,pay:[['입장료 2','¥1,000'],['알파카 목장','¥1,000']]},
  {g:'biei',d:'12',k:'tour',t:'15:20',n:'청의 호수',           j:'白金 青い池',             lat:43.5169,lon:142.6236,ph:17,pay:[['주차료','¥500']]},
  {g:'biei',d:'12',k:'tour',t:'16:00',n:'흰수염폭포',          j:'白ひげの滝',              lat:43.4914,lon:142.6414,ph:10,pay:[]},
  {g:'biei',d:'12',k:'tour',t:'17:10',n:'팜 도미타',           j:'ファーム富田',            lat:43.4185,lon:142.4744,ph:15,pay:[['라벤더 소프트 2','¥900'],['기념품','¥3,600']]},
  {g:'biei',d:'12',k:'food',t:'18:05',n:'세이코마트 비에이',   j:'セイコーマート 美瑛店',     lat:43.5905,lon:142.4700,ph:2, pay:[['음료·간식','¥980']]}
];

PLACES.forEach(p => p.hero = 0);   // 별표로 고른 대표 사진

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
      /* 라벨 없는 장식 — 삿포로 시덴(트램) */
      {n:'',            lat:43.0664, lon:141.3428, ic:'tram', s:0.9,  bare:1},
      {n:'',            lat:43.0672, lon:141.3560, ic:'tram', s:0.85, bare:1}
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
