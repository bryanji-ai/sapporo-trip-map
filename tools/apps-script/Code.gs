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

   확인
     브라우저에서  …/exec?action=getPlaces  를 열면 JSON 이 보여야 한다.
     좌표가 안 보이면  …/exec?action=fields  로 장소 레코드의 필드 이름을
     먼저 확인한다 (아래 fields 액션 참고).
   ══════════════════════════════════════════════════════════════ */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';

  try {
    if (action === 'getPlaces') return _json(apiPlaces());

    if (action === 'setHero') {
      setHero(e.parameter.place, e.parameter.photo);
      return _json({ ok: true });
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
    // 종류를 시트에 적어두면 핀 색이 그대로 반영된다 (tour/food/stay/move/spec)
    if (p.k || p.cat) out.k = p.k || p.cat;
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
