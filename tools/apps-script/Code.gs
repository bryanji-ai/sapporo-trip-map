/* ══════════════════════════════════════════════════════════════
   삿포로 여행 지도 — 웹앱에 JSON 출구 붙이기
   ──────────────────────────────────────────────────────────────
   왜 필요한가
     지금 배포된 웹앱(AKfycbxmR5P5Nct…/exec)의 doGet 은 관리 화면을
     HtmlOutput 으로 돌려주고 action 파라미터를 보지 않는다.
     그래서 index.html 이 ?action=getPlaces 를 불러도 JSON 이 아니라
     HTML 이 와서 핀을 만들 수 없다.

   붙이는 방법 (3단계)
     1) 기존 스크립트의  function doGet(e) { … }  이름을
        function doGetPanel(e) { … }  로 바꾼다. (내용은 그대로)
     2) 이 파일 내용을 스크립트에 추가한다.
     3) 배포 → 배포 관리 → 편집(연필) → 버전 「새 버전」 → 배포.
        「액세스 권한이 있는 사용자」는 반드시 <모든 사용자>여야 한다.
        (URL 은 그대로 유지되므로 index.html 은 고칠 필요 없다)

   핀 종류(k)는 시트에 안 적어도 된다 — 파일 뒤쪽의 classifyPlace() 가
   GPS · 찍은 시각 · 파일명으로 자동 분류한다. Places API 를 쓰려면
   스크립트 속성에 PLACES_API_KEY 를 넣는다 (없어도 동작한다).

   확인
     브라우저에서  …/exec?action=getPlaces  를 열면 JSON 이 보여야 한다.
     좌표가 안 보이면  …/exec?action=fields  로 장소 레코드의 필드 이름을
     먼저 확인한다 (아래 fields 액션 참고).
   ══════════════════════════════════════════════════════════════ */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';

  try {
    if (action === 'getPlaces') return _json(apiPlaces());

    // 지도 우상단 「갱신」 버튼 — 드라이브를 다시 훑어 오늘치 사진을 반영한다.
    // 수집 함수 이름이 스크립트마다 달라서 있는 것을 골라 부른다.
    // (이 분기가 없으면 ?action=updateToday 가 관리 화면 HTML 로 흘러가 아무것도 돌지 않는다)
    if (action === 'updateToday') {
      var ran = '';
      if (typeof updateToday === 'function')      { updateToday();  ran = 'updateToday'; }
      else if (typeof scanToday === 'function')   { scanToday();    ran = 'scanToday'; }
      else if (typeof scanPhotos === 'function')  { scanPhotos();   ran = 'scanPhotos'; }
      else if (typeof rebuildAll === 'function')  { rebuildAll();   ran = 'rebuildAll'; }
      return _json({ ok: !!ran, ran: ran || null });
    }

    if (action === 'setHero') {
      setHero(e.parameter.place, e.parameter.photo);
      return _json({ ok: true });
    }

    // 드라이브 사진 공개 공유 — 이미지가 지도에서 안 보일 때 실행
    if (action === 'sharePhotos') {
      var shared = 0, failed = 0;
      try {
        var st = getState();
        var allIds = [];
        // photos 맵에서 파일 ID 수집
        if (st && st.photos) {
          var pmap = st.photos;
          var pkeys = Object.keys(pmap);
          for (var pi = 0; pi < pkeys.length; pi++) {
            var arr = pmap[pkeys[pi]];
            if (!Array.isArray(arr)) continue;
            for (var ai = 0; ai < arr.length; ai++) {
              if (arr[ai] && arr[ai].id) allIds.push(arr[ai].id);
            }
          }
        }
        for (var fi = 0; fi < allIds.length; fi++) {
          try {
            var file = DriveApp.getFileById(allIds[fi]);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            shared++;
          } catch(fe) { failed++; }
          if (fi > 0 && fi % 100 === 0) Utilities.sleep(200); // 속도 제한 방지
        }
      } catch(se) { return _json({ ok: false, error: String(se.message || se) }); }
      return _json({ ok: true, shared: shared, failed: failed });
    }

    // 진단용 — 좌표·시각·파일명을 넣어 분류 결과를 바로 확인한다
    //   …/exec?action=classify&lat=43.0595&lon=141.3510&t=09:40&f=receipt_01.jpg
    if (action === 'classify') {
      var la = e.parameter.lat === undefined ? null : parseFloat(e.parameter.lat);
      var lo = e.parameter.lon === undefined ? null : parseFloat(e.parameter.lon);
      return _json(classifyPlaceDetail(
        (la === null || isNaN(la)) ? null : la,
        (lo === null || isNaN(lo)) ? null : lo,
        e.parameter.t || '', e.parameter.f || ''));
    }

    // 진단용 — getState() 가 장소마다 어떤 필드를 담고 있는지 본다
    if (action === 'fields') {
      var st = getState();
      var first = (st && st.places && st.places[0]) || null;
      return _json({
        ready: !!(st && st.ready),
        count: st && st.places ? st.places.length : 0,
        placeFields: first ? Object.keys(first) : [],
        sample: first
      });
    }
  } catch (err) {
    return _json({ ready: false, error: String((err && err.message) || err), places: [] });
  }

  // action 이 없으면 종전처럼 관리 화면 (1단계에서 이름을 바꿔둔 함수)
  return doGetPanel(e);
}

/* 지도가 먹는 모양으로 정리해서 내보낸다 */
function apiPlaces() {
  var st = getState();
  if (!st || !st.ready) return { ready: false, places: [], photos: {} };

  var places = (st.places || []).map(function (p) {
    var out = {
      id:     p.id,
      name:   p.name,
      days:   p.days,
      first:  p.first,
      photos: p.photos,
      pays:   p.pays,
      lat:    _geo(p, ['lat', 'latitude', 'la', 'y']),
      lon:    _geo(p, ['lon', 'lng', 'long', 'longitude', 'ln', 'x'])
    };
    // 종류를 시트에 적어두면 그 값이 그대로 핀 색이 된다 (tour/food/stay/move/spec).
    // 비어 있으면 GPS · 시각 · 파일명으로 자동 분류한다 — classifyPlaceRecord()
    var cat = classifyPlaceRecord(p, st.photos);
    out.k    = cat.k;
    out.kSrc = cat.src;      // 어떤 단계에서 정해졌는지 (진단용, 화면은 무시한다)
    if (p.jp || p.j)  out.j = p.jp || p.j;
    return out;
  });

  return {
    ready:  true,
    shots:  st.shots,
    noGeo:  st.noGeo,
    places: places,
    photos: st.photos || {},
    // 좌표가 하나도 안 실려 나오면 여기서 바로 드러난다
    withGeo: places.filter(function (p) { return p.lat != null && p.lon != null; }).length
  };
}

function _geo(o, keys) {
  for (var i = 0; i < keys.length; i++) {
    var v = o[keys[i]];
    if (v === null || v === undefined || v === '') continue;
    var n = typeof v === 'number' ? v : parseFloat(v);
    if (!isNaN(n)) return n;
  }
  return null;
}

/* 외부 페이지(gist·로컬 파일)에서 fetch 할 수 있게 JSON 으로 내보낸다.
   ContentService 응답은 CORS 가 열려 있어 다른 출처에서도 읽을 수 있다. */
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ══════════════════════════════════════════════════════════════
   핀 카테고리 자동 분류
   ──────────────────────────────────────────────────────────────
   사진에는 「여긴 밥집」 같은 정보가 없다. 그래서 네 단계로 눈치껏 맞춘다.

     0) 시트에 k(또는 cat)를 직접 적어두면 그 값이 언제나 이긴다.
     1) 파일명·폴더가 영수증이면 「돈 쓴 곳」으로 본다 → food (임시값)
     2) GPS → 장소 타입 조회 (Places API 키가 있으면 그걸로, 없으면 Geocoder)
     3) 알려진 명소 좌표와 100m 안이면 그 명소의 종류
     4) 그래도 모르면 찍은 시각으로 추정 (이동 시간대 · 점심 · 저녁)

   순서 규칙 — 1)의 food 는 임시값이라 2)·3)이 답을 내면 밀린다.
   좌표로 확인된 사실이 파일명 추측보다 정확하기 때문이다.
   2)가 타입을 못 맞히면 「모름」으로 취급해 3)·4)가 말할 기회를 준다.
   최종 기본값은 tour.

   Places API 를 쓰려면
     프로젝트 설정 → 스크립트 속성에  PLACES_API_KEY = <API 키>  를 넣는다.
     키가 없으면 이 단계를 조용히 건너뛰고 Geocoder → 명소표 → 시간대로 내려간다.
     (조회 결과는 좌표를 소수 4자리(약 10m)로 뭉쳐 6시간 캐시한다 —
      같은 장소의 사진 수십 장에 매번 호출이 나가지 않게)

   확인
     …/exec?action=classify&lat=43.0595&lon=141.3510&t=09:40
   ══════════════════════════════════════════════════════════════ */

/* 핀 색이 정의된 종류만 내보낸다 — 01-data.js 의 CAT 과 같아야 한다 */
var CAT_KEYS = { tour:1, food:1, stay:1, move:1, spec:1 };

/* 알려진 명소 — Places API 가 없을 때의 폴백.
   좌표는 지도 데이터(src/01-data.js)와 같은 값을 쓴다. 화면에 그리는 마크
   좌표는 그림이 겹치지 않게 조금씩 밀어둔 것이므로 여기서는 쓰지 않는다. */
var KNOWN_SPOTS = [
  // 삿포로
  {lat:43.0595, lon:141.3510, k:'tour', n:'오도리공원'},
  {lat:43.0627, lon:141.3518, k:'tour', n:'시계탑'},
  {lat:43.0609, lon:141.3565, k:'tour', n:'TV타워'},
  {lat:43.0686, lon:141.3508, k:'move', n:'삿포로역'},
  {lat:43.0637, lon:141.3900, k:'move', n:'삿포로역'},
  {lat:43.0553, lon:141.3536, k:'food', n:'라멘 요코초'},
  {lat:43.0575, lon:141.3563, k:'food', n:'니조시장'},
  {lat:43.0708, lon:141.3690, k:'tour', n:'맥주박물관'},
  {lat:43.0748, lon:141.3420, k:'tour', n:'홋카이도대'},
  {lat:43.0551, lon:141.3525, k:'food', n:'스스키노'},
  {lat:43.0660, lon:141.3970, k:'tour', n:'오도리공원'},
  // 오타루 — 실제 좌표는 140.99 대다 (141.00 대는 항구 바깥 바다다)
  {lat:43.1985, lon:140.9944, k:'move', n:'오타루역'},
  {lat:43.1975, lon:140.9995, k:'tour', n:'오타루 운하'},
  {lat:43.1925, lon:140.9958, k:'tour', n:'사카이마치'},
  // 후라노
  {lat:43.1697, lon:141.7576, k:'tour', n:'후라노'},
  {lat:43.1940, lon:141.8040, k:'tour', n:'후라노 근방'},
  // 비에이
  {lat:43.5883, lon:142.4675, k:'move', n:'비에이역'},
  {lat:43.5920, lon:142.4650, k:'tour', n:'비에이 시내'},
  {lat:43.5272, lon:142.4652, k:'tour', n:'패치워크 로드'},
  {lat:43.5546, lon:142.4638, k:'tour', n:'사계채의 언덕'},
  {lat:43.5766, lon:142.4929, k:'tour', n:'크리스마스 트리 나무'},
  {lat:43.4901, lon:142.4965, k:'tour', n:'사이로 전망대'},
  {lat:43.4923, lon:142.6140, k:'stay', n:'시로가네 온천'},
  {lat:43.4731, lon:142.6390, k:'tour', n:'청의 호수 (아오이이케)'},
  {lat:43.5169, lon:142.6236, k:'tour', n:'청의 호수'},
  {lat:43.4185, lon:142.4744, k:'tour', n:'팜 도미타'},
  {lat:43.6197, lon:142.4463, k:'tour', n:'켄과 메리의 나무'}
];
var SPOT_RADIUS_M = 600;  // 반경을 600m 로 넓혀 들판 등 광역 명소도 매핑

/* 장소 타입 → 핀 종류.
   위에서부터 먼저 맞는 것을 쓴다. 역·숙소처럼 구체적인 타입을 일반 상점보다
   먼저 보는데, 역 건물 안 매점이 'store' 로 잡혀 이동이 쇼핑으로 바뀌는 것을
   막기 위해서다. */
var TYPE_RULES = [
  ['food', ['restaurant','cafe','bar','food','bakery','meal_takeaway','meal_delivery']],
  ['stay', ['lodging','hotel','guest_house','campground','rv_park']],
  ['move', ['transit_station','train_station','subway_station','light_rail_station',
            'bus_station','airport','taxi_stand','car_rental','parking','ferry_terminal']],
  ['tour', ['tourist_attraction','museum','park','amusement_park','zoo','aquarium',
            'art_gallery','natural_feature','place_of_worship','shrine','church',
            'hindu_temple','campground_scenic','landmark','historical_landmark']],
  ['food', ['store','shopping_mall','convenience_store','supermarket','department_store',
            'liquor_store','grocery_or_supermarket']]
];

/* 영수증 사진 — 파일명이나 폴더 이름으로 가른다 */
var RECEIPT_RE = /receipt|rcpt|영수증|레시트|レシート|領収|明細/i;

/* 시간대 추정 — GPS 로도 명소표로도 못 맞혔을 때의 마지막 수단 */
function _catByHour(time) {
  var hm = _hourMin(time);
  if (hm == null) return 'tour';
  var m = hm;                                  // 자정부터 분 단위
  if (m >= 7 * 60      && m < 9 * 60 + 30) return 'move';   // 07:00~09:30 이동
  if (m >= 11 * 60     && m < 14 * 60)     return 'food';   // 11:00~14:00 점심
  if (m >= 17 * 60     && m < 21 * 60)     return 'food';   // 17:00~21:00 저녁
  return 'tour';
}

/* "2026-09-11T16:40" · "9/11 16:40" · Date → 자정부터의 분. 못 읽으면 null */
function _hourMin(time) {
  if (time == null || time === '') return null;
  var s = (Object.prototype.toString.call(time) === '[object Date]')
    ? Utilities.formatDate(time, Session.getScriptTimeZone(), 'HH:mm')
    : String(time);
  var m = /(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return null;
  var h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(mi) || h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/* 두 좌표 사이 거리(m) — 100m 판정에는 평면 근사로 충분하다 */
function _distM(lat1, lon1, lat2, lon2) {
  var kx = Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  var dy = (lat1 - lat2) * 111320;
  var dx = (lon1 - lon2) * 111320 * kx;
  return Math.sqrt(dx * dx + dy * dy);
}

/* 100m 안에 알려진 명소가 있으면 가장 가까운 것을 돌려준다 */
function _nearKnownSpot(lat, lon) {
  var best = null, bestD = SPOT_RADIUS_M;
  for (var i = 0; i < KNOWN_SPOTS.length; i++) {
    var s = KNOWN_SPOTS[i];
    var d = _distM(lat, lon, s.lat, s.lon);
    if (d <= bestD) { best = s; bestD = d; }
  }
  return best;
}

/* 타입 목록에서 핀 종류를 고른다. establishment·point_of_interest 처럼
   아무 정보도 없는 타입만 있으면 null(모름)을 돌려준다. */
function _catFromTypes(types) {
  if (!types || !types.length) return null;
  var has = {};
  for (var i = 0; i < types.length; i++) has[String(types[i]).toLowerCase()] = 1;
  for (var r = 0; r < TYPE_RULES.length; r++) {
    var k = TYPE_RULES[r][0], list = TYPE_RULES[r][1];
    for (var j = 0; j < list.length; j++) if (has[list[j]]) return k;
  }
  return null;
}

/* ── GPS → 장소 타입 (Places API 우선, 없으면 Geocoder) ── */

var _GEO_MEMO = {};        // 한 번 실행 안에서의 재조회 방지

function _geoCat(lat, lon) {
  if (lat == null || lon == null) return null;
  var key = 'pincat:' + lat.toFixed(4) + ',' + lon.toFixed(4);
  if (_GEO_MEMO.hasOwnProperty(key)) return _GEO_MEMO[key];

  var cache = null, hit = null;
  try { cache = CacheService.getScriptCache(); hit = cache && cache.get(key); }
  catch (e) { /* 캐시가 없어도 조회는 된다 */ }
  if (hit != null) {                       // '' 는 「조회했지만 모름」이다
    var v = hit || null;
    _GEO_MEMO[key] = v;
    return v;
  }

  var cat = _catByPlacesApi(lat, lon);
  if (!cat) cat = _catByGeocoder(lat, lon);
  _GEO_MEMO[key] = cat;
  try { if (cache) cache.put(key, cat || '', 21600); } catch (e2) { /* 무시 */ }
  return cat;
}

/* Places Nearby Search — 스크립트 속성에 PLACES_API_KEY 가 있을 때만 */
function _catByPlacesApi(lat, lon) {
  var key;
  try { key = PropertiesService.getScriptProperties().getProperty('PLACES_API_KEY'); }
  catch (e) { return null; }
  if (!key) return null;

  try {
    var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
            + '?location=' + lat + ',' + lon
            + '&rankby=distance&language=ja&key=' + encodeURIComponent(key);
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    var body = JSON.parse(res.getContentText());
    if (body.status !== 'OK' || !body.results || !body.results.length) return null;
    // 가까운 순 — 첫 결과가 정보 없는 타입뿐이면 다음 후보를 본다
    var n = Math.min(5, body.results.length);
    for (var i = 0; i < n; i++) {
      var c = _catFromTypes(body.results[i].types);
      if (c) return c;
    }
  } catch (err) { /* 조회가 막혀도 분류는 아래 단계로 계속 간다 */ }
  return null;
}

/* Maps.newGeocoder() 역지오코딩 — 키 없이 쓸 수 있지만 타입이 거칠다
   (대개 street_address·premise 라서 못 맞히고 null 로 내려간다) */
function _catByGeocoder(lat, lon) {
  try {
    var r = Maps.newGeocoder().setLanguage('ja').reverseGeocode(lat, lon);
    if (!r || r.status !== 'OK' || !r.results) return null;
    var n = Math.min(5, r.results.length);
    for (var i = 0; i < n; i++) {
      var c = _catFromTypes(r.results[i].types);
      if (c) return c;
    }
  } catch (err) { /* 쿼터 초과·권한 없음 — 조용히 폴백 */ }
  return null;
}

/* ── 본체 ──
   lat·lon 은 없어도 된다 (GPS 없는 사진). 그때는 파일명·시간대만 본다.
   돌려주는 값은 CAT 에 있는 종류 하나. */
function classifyPlace(lat, lon, time, filename) {
  return classifyPlaceDetail(lat, lon, time, filename).k;
}

/* 어떤 단계에서 정해졌는지까지 알려준다 — 진단·디버깅용 */
function classifyPlaceDetail(lat, lon, time, filename) {
  var receipt = RECEIPT_RE.test(String(filename == null ? '' : filename));

  var byGeo = _geoCat(lat, lon);
  if (byGeo) return { k: byGeo, src: 'places' };

  if (lat != null && lon != null) {
    var spot = _nearKnownSpot(lat, lon);
    if (spot) return { k: spot.k, src: 'spot:' + spot.n };
  }

  if (receipt) return { k: 'food', src: 'receipt' };

  return { k: _catByHour(time), src: 'hour' };
}

/* ── 장소 레코드 한 줄을 분류한다 ──
   시트에 적어둔 k 가 있으면 그것을, 없으면 classifyPlace() 결과를 쓴다.
   파일명은 시트가 어떤 이름으로 담아두든 찾아낸다 (필드 이름이 제각각이라). */
function classifyPlaceRecord(p, photoMap) {
  var sheetK = _catName(p && (p.k || p.cat));
  if (sheetK) return { k: sheetK, src: 'sheet' };

  var lat  = _geo(p, ['lat', 'latitude', 'la', 'y']);
  var lon  = _geo(p, ['lon', 'lng', 'long', 'longitude', 'ln', 'x']);
  var time = p.first || p.t || p.time || p.at || p.days || '';
  return classifyPlaceDetail(lat, lon, time, _fileHint(p, photoMap));
}

/* CAT 에 있는 종류면 소문자로 정리해서, 아니면 '' 를 돌려준다 */
function _catName(v) {
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return CAT_KEYS[s] ? s : '';
}

/* 영수증 판정에 쓸 문자열 모으기 — 파일명·폴더명이 어디에 담겨 있어도 걸리게.
   장소 이름은 넣지 않는다 (「롯카테이」 같은 가게 이름이 영수증으로 오해되면
   안 되고, 이름 기반 추측은 프론트의 guessCat() 이 이미 한다) */
function _fileHint(p, photoMap) {
  var bag = [];
  var direct = ['file', 'fileName', 'filename', 'files', 'photoName', 'src',
                'folder', 'folderName', 'dir', 'path', 'receipt', 'receipts'];
  for (var i = 0; i < direct.length; i++) {
    var v = p[direct[i]];
    if (typeof v === 'string' && v) bag.push(v);
    if (typeof v === 'number' && v > 0 && /receipt/i.test(direct[i])) bag.push('receipt');
  }
  // 영수증이 한 건이라도 붙어 있으면 「돈 쓴 곳」 신호로 본다
  if (Array.isArray(p.pays) ? p.pays.length : (+p.pays > 0)) bag.push('receipt');

  // 사진 목록은 장소 안에 있기도 하고 별도 photos 맵에 있기도 하다 — 둘 다 본다.
  // (장소 쪽은 파일 id 만 담고 파일명은 맵에만 있는 경우가 있어서다)
  var shots = [];
  if (Array.isArray(p.photos)) shots = shots.concat(p.photos);
  if (photoMap && p.id && Array.isArray(photoMap[p.id])) shots = shots.concat(photoMap[p.id]);
  shots.forEach(function (s) {
    if (typeof s === 'string') { bag.push(s); return; }
    if (!s || typeof s !== 'object') return;
    ['name', 'fileName', 'filename', 'title', 'n', 'folder'].forEach(function (f) {
      if (typeof s[f] === 'string' && s[f]) bag.push(s[f]);
    });
  });
  return bag.join(' ');
}
