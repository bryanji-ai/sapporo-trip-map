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
    // 직접 옮겨 둔 캐릭터 자리 — 브라우저에 남은 값 위에 시트 값을 덮는다.
    // 자리는 두 사람이 같이 보는 값이라 시트가 이긴다. 시트가 모르는 자리(막 더한 캐릭터)는 남는다.
    if (data && data.charPos) Object.assign(CHARPOS, data.charPos);
    // 구성도 시트가 이긴다 — 두 사람이 같은 배치를 본다
    if (data && data.charSet) Object.assign(CHARSET, data.charSet);
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
    // 배열이면 첫 번째 비어있지 않은 문자열을 돌려준다 (days:["9/12","9/13"] 형태)
    if (Array.isArray(v) && v.length) return String(v[0]);
  }
  return '';
}

/* "2026-09-11T16:40" · "9/11 · 9/12" · "9/11" → "9/11" */
function dayId(raw){
  // 배열로 오면 첫 번째 요소를 쓴다 (days:["9/11","9/12"] 형태 대응)
  if (Array.isArray(raw)) raw = raw[0];
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

/* GPS 좌표로 가장 가까운 알려진 장소명을 반환 (반경 600m 이내) */
const GPS_SPOTS = [
  // 삿포로
  {lat:43.0595, lon:141.3510, n:'오도리공원'},
  {lat:43.0627, lon:141.3518, n:'시계탑'},
  {lat:43.0609, lon:141.3565, n:'TV타워'},
  {lat:43.0686, lon:141.3508, n:'삿포로역'},
  {lat:43.0637, lon:141.3900, n:'삿포로역'},
  {lat:43.0553, lon:141.3536, n:'라멘 요코초'},
  {lat:43.0551, lon:141.3525, n:'스스키노'},
  {lat:43.0708, lon:141.3690, n:'맥주박물관'},
  {lat:43.0748, lon:141.3420, n:'홋카이도대'},
  // 오타루
  {lat:43.1985, lon:140.9944, n:'오타루역'},
  {lat:43.1975, lon:140.9995, n:'오타루 운하'},
  {lat:43.1925, lon:140.9958, n:'사카이마치'},
  // 후라노
  {lat:43.1697, lon:141.7576, n:'후라노'},
  {lat:43.1940, lon:141.8040, n:'후라노 근방'},
  // 비에이
  {lat:43.5883, lon:142.4675, n:'비에이역'},
  {lat:43.5920, lon:142.4650, n:'비에이 시내'},
  {lat:43.5272, lon:142.4652, n:'패치워크 로드'},
  {lat:43.5546, lon:142.4638, n:'사계채의 언덕'},
  {lat:43.5766, lon:142.4929, n:'크리스마스 트리 나무'},
  {lat:43.4901, lon:142.4965, n:'사이로 전망대'},
  {lat:43.4923, lon:142.6140, n:'시로가네 온천'},
  {lat:43.4731, lon:142.6390, n:'청의 호수'},
  {lat:43.5169, lon:142.6236, n:'청의 호수'},
  {lat:43.4185, lon:142.4744, n:'팜 도미타'},
  {lat:43.6197, lon:142.4463, n:'켄과 메리의 나무'},
];
function nameByGps(lat, lon){
  if (lat == null || lon == null) return '';
  const R = 600; // 600m 이내
  let best = '', bestD = R;
  for (const s of GPS_SPOTS){
    const kx = Math.cos((lat + s.lat) / 2 * Math.PI / 180);
    const dy = (lat - s.lat) * 111320;
    const dx = (lon - s.lon) * 111320 * kx;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d < bestD){ bestD = d; best = s.n; }
  }
  return best;
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
      ? {id:s, hero:false, est:false}
      : {id:  str(s, ['id','fileId','file','thumb']),
         src: str(s, ['src','url']),               // 샘플 사진은 주소를 직접 들고 온다
         hero: !!(s.hero || s.isHero || s.rep),
         est:  !!s.est,                            // 위치를 이웃에게서 물려받은 사진
         // 웹앱에서 「목록에서 뺀」 사진은 지도에 올리지 않는다.
         // 백엔드는 되돌리기를 위해 뺀 것까지 내려보내므로 여기서 거른다.
         // (keep 필드가 없던 옛 응답은 그대로 통과시킨다)
         keep: s.keep !== false})
    .filter(s => (s.id || s.src) && s.keep !== false);
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

/* ── 받은 장소를 지도가 쓸 모양으로 ──
   live=true 면 드라이브 실데이터를 얹는 중이다. 이때 _sample 로 표시된
   장소가 섞여 들어오면 샘플 사진은 통째로 버린다 — 그 자리는 드라이브
   사진이 채워야 하고, 실물 기록에 남의 사진이 남아 있으면 안 된다. */
function adoptPlaces(rows, live){
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
    const name = str(rec, ['n','name','title','place']) || nameByGps(lat, lon) || '이름 없는 장소';
    // 세 지역 상자 밖이거나, 상자 안이어도 지형 데이터 밖이면 지도에 찍을 수 없다
    if (!g || !inMap(g, lat, lon)){
      stat.offMap++;
      if (stat.offList.length < 4) stat.offList.push(name);
      return;
    }

    const sample = !!rec._sample;
    const shots = (live && sample) ? [] : shotsOf(rec, photoMap);
    const kRaw = str(rec, ['k','cat','category','kind']);
    const heroAt = shots.findIndex(s => s.hero);
    out.push({
      g, lat, lon,
      d: dayId(str(rec, ['d','days','day','date','when'])),
      t: timeOf(str(rec, ['t','first','time','at'])),
      n: name,
      j: str(rec, ['j','jp','nameJa','ja']),
      k: CAT[kRaw] ? kRaw : guessCat(name),
      // 샘플은 미리 정해둔 장수를 그대로 쓴다 — 샘플 사진 뒤는 색 타일이 채운다
      ph: sample ? (num(rec, ['ph']) || shots.length) : countOf(rec, shots),
      pay: payOf(rec),
      shots,
      hero: heroAt < 0 ? 0 : heroAt,
      rid: str(rec, ['id','pid','key','placeId']),
      _sample: sample
    });
    stat.kept++;
  });

  // 간 순서대로 — 펼쳐보기와 포스터가 이 순서를 그대로 쓴다
  PLACES = sortPlaces(out);
  LOAD.stat = stat;
  return stat;
}

/* 간 순서 — 날짜 → 시각 → 이름 */
function sortPlaces(list){
  return list.sort((a,b) => dayCmp(a.d, b.d) || a.t.localeCompare(b.t) || a.n.localeCompare(b.n));
}

/* ── 빈 지역을 샘플로 채우던 fillEmptyRegions() 는 걷어냈다 ──
   🔴 2026-09-11 오전에는 실데이터가 비에이 한 곳뿐이라 삿포로·오타루 패널이 비는 걸 막으려
      빈 지역을 샘플 일정으로 덧댔다. 그런데 드라이브에 진짜 사진이 올라온 뒤로는
      가 본 적 없는 곳(샘플 장소)의 핀이 진짜 기록에 섞여 보이는 게 더 큰 문제가 됐다.
      실데이터가 한 곳이라도 있으면(isLive) 샘플은 한 건도 얹지 않는다 —
      간 곳에만 핀이 선다. 빈 지역 패널은 「사진이 아직 없어요」로 둔다. (2026-09-11) */

/* ── 대표 사진 선택을 웹앱에도 알린다 (되면 좋고, 안 되면 이번 세션만 유지) ── */
function saveHero(p){
  const shot = heroShot(p);
  if (!p.rid || !shot || !shot.id) return;
  const url = `${WEB_APP}?action=setHero&place=${encodeURIComponent(p.rid)}&photo=${encodeURIComponent(shot.id)}`;
  try { fetch(url, {method:'GET', mode:'no-cors', keepalive:true}); }
  catch(_){ /* 실패해도 화면 동작에는 지장 없다 */ }
}

/* ══════════════════════════════════════════════════════════════
   갱신 버튼 — 웹앱에 오늘치 재수집을 시키고 다시 읽어온다
   ══════════════════════════════════════════════════════════════ */

/* 드라이브에서 다시 읽어 화면 전체를 갱신한다.
   건진 장소가 없으면 boot() 과 같이 샘플 일정으로 되돌린다. */
async function syncFromDrive(){
  LOAD.error = null; LOAD.payload = null;
  const rows = await loadPlaces();
  const stat = adoptPlaces(rows, true);
  isLive = !!stat.kept;
  if (!stat.kept){ LOAD.payload = null; adoptPlaces(SAMPLE_PLACES, false); }
  refreshAll();
  return stat;
}

const syncBtn = document.getElementById('syncBtn');
let syncing = false;

async function triggerUpdate(){
  if (syncing) return;
  syncing = true;
  syncBtn.disabled = true;
  syncBtn.classList.remove('done', 'fail');
  syncBtn.textContent = '갱신 중…';
  try {
    // no-cors 라 응답을 읽을 수 없다 — 수집이 돌 시간을 준 뒤 다시 읽는다
    await fetch(WEB_APP + '?action=updateToday', {mode:'no-cors'}).catch(()=>{});
    await new Promise(r => setTimeout(r, 3000));
    const stat = await syncFromDrive();
    syncBtn.classList.add('done');
    syncBtn.textContent = stat.kept ? `✓ ${stat.kept}곳` : '✓ 완료';
  } catch(e){
    syncBtn.classList.add('fail');
    syncBtn.textContent = '⚠ 실패';
    console.warn('갱신 실패:', e && e.message ? e.message : e);
  } finally {
    setTimeout(() => {
      syncBtn.classList.remove('done', 'fail');
      syncBtn.textContent = '🔄 갱신';
      syncBtn.disabled = false;
      syncing = false;
    }, 1800);
  }
}
syncBtn.onclick = triggerUpdate;

/* ══ 시작 ══ */
async function boot(){
  // 지형은 먼저 깔아둔다 — 스피너가 빈 상자 위에 뜨지 않게
  showState('loading', '사진에서 위치를 읽고 있어요…',
            '드라이브에 올린 사진의 GPS 좌표로 핀을 꽂습니다.');
  buildDays(); markRegionCounts(); drawScreen();

  const rows = await loadPlaces();
  const stat = adoptPlaces(rows, true);
  const p = LOAD.payload;

  // 드라이브에서 건진 장소가 하나도 없으면 샘플 일정으로 채운다 —
  // 빈 지도보다 "사진을 올리면 이렇게 된다"를 먼저 보여주는 편이 낫다.
  const sample = !stat.kept;
  isLive = !sample;                    // 펼쳐보기는 실데이터일 때만 채운다
  if (sample){ LOAD.payload = null; adoptPlaces(SAMPLE_PLACES, false); }
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
    // 첫 핀을 열어 어떻게 쓰는지 바로 보이게 — 예시가 아니라 진짜 기록에서 고른다
    let first = PLACES.findIndex(x => x.g === current && !x._sample);
    if (first < 0) first = PLACES.findIndex(x => !x._sample);
    if (first >= 0) openPin(first);
  }

  applyHash();
}

boot();
