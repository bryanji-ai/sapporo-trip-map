/* ══════════════════════════════════════════════════════════════
   드라이브 사진 → 지도 핀
   ──────────────────────────────────────────────────────────────
   흐름:  「삿포로여행_사진」 폴더에 사진 업로드
        → Apps Script 가 EXIF GPS 를 읽어 장소로 묶음
        → 이 파일이 웹앱에서 받아 PLACES 를 채움
        → GPS 좌표로 삿포로 · 오타루 · 비에이 중 어디인지 자동 판별

   웹앱이 어떤 모양으로 주든 받아넘긴다:
     · {places:[…], photos:{장소id:[{id,hero}]}}   ← getState() 모양
     · {places:[…]}                                ← getPlaces 모양
     · […]                                         ← 배열만
   ══════════════════════════════════════════════════════════════ */

const WEB_APP = 'https://script.google.com/macros/s/AKfycbxmR5P5NctPx9fnUeFo9ijPBGx7aqkiwt2yoNL8hDKvWyLeyDL0aRtGAQCFNxZucPBQ/exec';

/* 왜 비었는지 화면에 설명하기 위해 이유를 남긴다 */
const LOAD = {error:null, payload:null, stat:null};

async function loadPlaces(){
  try {
    const res = await fetch(WEB_APP + '?action=getPlaces', {redirect:'follow'});
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); }
    catch(_){
      // 지금 배포된 웹앱은 doGet 이 HtmlOutput(관리 화면)을 돌려주고
      // action 파라미터를 보지 않는다 — JSON 분기를 배포해야 핀이 올라온다.
      LOAD.error = 'NOT_JSON';
      console.warn('웹앱이 JSON 대신 HTML을 반환했습니다. doGet 의 getPlaces 분기를 배포해 주세요.');
      return [];
    }
    LOAD.payload = data;
    return Array.isArray(data) ? data : (data.places || []);
  } catch(e){
    LOAD.error = 'NETWORK';
    console.warn('드라이브 연동 실패:', e && e.message ? e.message : e);
    return [];
  }
}

/* ── 값 꺼내기 (필드 이름이 조금씩 달라도 받아준다) ── */
function num(o, keys){
  for (const k of keys){
    if (o[k] == null) continue;
    const v = typeof o[k] === 'string' ? parseFloat(o[k]) : o[k];
    if (typeof v === 'number' && isFinite(v)) return v;
  }
  return null;
}
function str(o, keys){
  for (const k of keys){
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

/* "2026-09-11T16:40" · "9/11 · 9/12" · "9/11" → "9/11" */
function dayId(raw){
  const s = String(raw || '');
  let m = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${+m[2]}/${+m[3]}`;
  m = /(\d{1,2})\s*\/\s*(\d{1,2})/.exec(s);
  if (m) return `${+m[1]}/${+m[2]}`;
  m = /(\d{1,2})월\s*(\d{1,2})/.exec(s);
  if (m) return `${+m[1]}/${+m[2]}`;
  return NO_DAY;
}
function timeOf(raw){
  const m = /(\d{1,2}):(\d{2})/.exec(String(raw || ''));
  return m ? `${m[1].padStart(2,'0')}:${m[2]}` : '--:--';
}

/* 사진 목록 — 장소 안에 들어 있거나, 별도 photos 맵에 들어 있다 */
function shotsOf(rec, photoMap){
  let raw = rec.shots || rec.photoList || rec.files;
  if (!Array.isArray(raw) && photoMap){
    const key = str(rec, ['id','pid','key','placeId']);
    if (key && Array.isArray(photoMap[key])) raw = photoMap[key];
  }
  if (!Array.isArray(raw) && Array.isArray(rec.photos)) raw = rec.photos;
  if (!Array.isArray(raw)) return [];
  return raw
    .map(s => typeof s === 'string'
      ? {id:s, hero:false}
      : {id: str(s, ['id','fileId','file','thumb']), hero: !!(s.hero || s.isHero || s.rep)})
    .filter(s => s.id);
}
/* 사진 장수 — 목록이 없으면 숫자 필드에서 */
function countOf(rec, shots){
  if (shots.length) return shots.length;
  if (Array.isArray(rec.photos)) return rec.photos.length;
  const n = num(rec, ['photos','ph','shots','count','n']);
  return n && n > 0 ? Math.round(n) : 0;
}

/* 결제 — [[이름,금액]] 배열이거나, 영수증 장수 숫자다 */
function payOf(rec){
  const raw = rec.pay != null ? rec.pay
            : rec.pays != null ? rec.pays
            : rec.receipts != null ? rec.receipts : rec.payments;
  if (Array.isArray(raw))
    return raw
      .map(r => Array.isArray(r)
        ? [String(r[0] == null ? '' : r[0]), String(r[1] == null ? '' : r[1])]
        : [str(r, ['label','n','name','item','memo']) || '결제',
           str(r, ['amount','v','amt','price','sum','total'])])
      .filter(r => r[0] || r[1]);
  const n = typeof raw === 'number' ? raw
          : (typeof raw === 'string' && isFinite(+raw) ? +raw : 0);
  return n > 0 ? [['영수증', `${n}건`]] : [];
}

/* ── 받은 장소를 지도가 쓸 모양으로 ── */
function adoptPlaces(rows){
  const p = LOAD.payload;
  const photoMap = (p && !Array.isArray(p) && p.photos && !Array.isArray(p.photos))
                   ? p.photos : null;
  const stat = {rows:0, kept:0, noGeo:0, offMap:0, offList:[]};
  const out = [];

  (Array.isArray(rows) ? rows : []).forEach(rec => {
    if (!rec || typeof rec !== 'object') return;
    stat.rows++;
    const lat = num(rec, ['lat','latitude','la','y']);
    const lon = num(rec, ['lon','lng','long','longitude','ln','x']);
    if (lat == null || lon == null){ stat.noGeo++; return; }

    const g = regionOf(lat, lon);
    const name = str(rec, ['n','name','title','place']) || '이름 없는 장소';
    // 세 지역 상자 밖이거나, 상자 안이어도 지형 데이터 밖이면 지도에 찍을 수 없다
    if (!g || !inMap(g, lat, lon)){
      stat.offMap++;
      if (stat.offList.length < 4) stat.offList.push(name);
      return;
    }

    const shots = shotsOf(rec, photoMap);
    const kRaw = str(rec, ['k','cat','category','kind']);
    const heroAt = shots.findIndex(s => s.hero);
    out.push({
      g, lat, lon,
      d: dayId(str(rec, ['d','days','day','date','when'])),
      t: timeOf(str(rec, ['t','first','time','at'])),
      n: name,
      j: str(rec, ['j','jp','nameJa','ja']),
      k: CAT[kRaw] ? kRaw : guessCat(name),
      ph: countOf(rec, shots),
      pay: payOf(rec),
      shots,
      hero: heroAt < 0 ? 0 : heroAt,
      rid: str(rec, ['id','pid','key','placeId'])
    });
    stat.kept++;
  });

  // 간 순서대로 — 펼쳐보기와 포스터가 이 순서를 그대로 쓴다
  out.sort((a,b) => dayCmp(a.d, b.d) || a.t.localeCompare(b.t) || a.n.localeCompare(b.n));
  PLACES = out;
  LOAD.stat = stat;
  return stat;
}

/* ── 대표 사진 선택을 웹앱에도 알린다 (되면 좋고, 안 되면 이번 세션만 유지) ── */
function saveHero(p){
  const shot = heroShot(p);
  if (!p.rid || !shot || !shot.id) return;
  const url = `${WEB_APP}?action=setHero&place=${encodeURIComponent(p.rid)}&photo=${encodeURIComponent(shot.id)}`;
  try { fetch(url, {method:'GET', mode:'no-cors', keepalive:true}); }
  catch(_){ /* 실패해도 화면 동작에는 지장 없다 */ }
}

/* ══ 시작 ══ */
async function boot(){
  // 지형은 먼저 깔아둔다 — 스피너가 빈 상자 위에 뜨지 않게
  showState('loading', '사진에서 위치를 읽고 있어요…',
            '드라이브에 올린 사진의 GPS 좌표로 핀을 꽂습니다.');
  buildDays(); markRegionCounts(); drawScreen();

  const rows = await loadPlaces();
  const stat = adoptPlaces(rows);
  const p = LOAD.payload;

  // 드라이브에서 건진 장소가 하나도 없으면 샘플 일정으로 채운다 —
  // 빈 지도보다 "사진을 올리면 이렇게 된다"를 먼저 보여주는 편이 낫다.
  const sample = !stat.kept;
  isLive = !sample;                    // 펼쳐보기는 실데이터일 때만 채운다
  if (sample){ LOAD.payload = null; adoptPlaces(SAMPLE_PLACES); }
  refreshAll();

  // 지도 위에는 안내를 띄우지 않는다 — 상태 표시는 drawScreen() 이 지역별로만 처리하고,
  // 샘플/연결 진단은 콘솔로 남긴다 (지도가 가려지지 않게).
  if (sample){
    const why =
      LOAD.error === 'NOT_JSON'
        ? '웹앱이 JSON 대신 관리 화면(HTML)을 돌려줍니다. tools/apps-script/Code.gs 의 doGet 을 붙여 다시 배포하세요.'
      : LOAD.error === 'NETWORK'
        ? '웹앱에 연결하지 못했습니다. 배포 설정의 「액세스 권한이 있는 사용자」를 확인하세요.'
      : (p && p.ready === false)
        ? '시트 준비 전입니다. 스프레드시트에서 mapSetup() 을 한 번 실행하세요.'
      : stat.offMap
        ? `사진 ${stat.offMap}곳이 세 지도 범위 밖에서 찍혔습니다 (${stat.offList.join(', ')}).`
      : stat.noGeo
        ? `위치 정보가 없는 사진 ${stat.noGeo}장은 지도에 올리지 못했습니다.`
      : '드라이브 「삿포로여행_사진」 폴더에 사진이 아직 없습니다.';
    console.info('샘플 일정을 표시 중입니다 —', why);
  } else {
    if (stat.offMap)
      console.warn(`지도 밖 장소 ${stat.offMap}곳을 건너뛰었습니다:`, stat.offList.join(', '));
    // 첫 핀을 열어 어떻게 쓰는지 바로 보이게
    const first = PLACES.findIndex(x => x.g === current);
    openPin(first < 0 ? 0 : first);
  }

  applyHash();
}

boot();
