#!/usr/bin/env python3
"""OSM Overpass -> 지도 레이어 JSON.

샘플(삿포로)이 쓰던 것과 같은 형태로 뽑는다:
  {w,h,bbox:[S,W,N,E],layers:{green,water,river,road1,road2,road3,rail},bldg:[[d,h,ci]]}
비에이는 밭 패치워크가 주인공이라 farm 레이어를 더 얹는다: [[d, cls]] (0 밀·1 라벤더·2 감자)
"""
import json, math, pathlib, sys, urllib.request, urllib.parse, time

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

def query(q):
    last = None
    for ep in ENDPOINTS:
        for attempt in range(3):
            try:
                req = urllib.request.Request(
                    ep, data=urllib.parse.urlencode({"data": q}).encode(),
                    headers={"User-Agent": "sapporo-trip-map/1.0 (personal trip poster)"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    return json.loads(r.read().decode())
            except Exception as e:
                last = e
                sys.stderr.write(f"  retry {ep} #{attempt+1}: {e}\n")
                time.sleep(8 * (attempt + 1))
    raise SystemExit(f"overpass 실패: {last}")


def build_query(s, w, n, e, coast=False):
    bb = f"{s},{w},{n},{e}"
    sea = (f'  way["natural"="coastline"]({bb});\n'
           f'  way["man_made"~"^(pier|breakwater|groyne)$"]({bb});\n') if coast else ""
    return f"""[out:json][timeout:280];
(
{sea}
  way["highway"~"^(motorway|trunk|primary)$"]({bb});
  way["highway"~"^(secondary|tertiary)$"]({bb});
  way["highway"~"^(unclassified|residential|living_street)$"]({bb});
  way["railway"="rail"]({bb});
  way["waterway"~"^(river|stream)$"]({bb});
  way["natural"="water"]({bb});
  relation["natural"="water"]({bb});
  way["landuse"~"^(forest|farmland|meadow|orchard|vineyard|grass)$"]({bb});
  way["natural"~"^(wood|scrub|grassland)$"]({bb});
  way["leisure"~"^(park|garden|golf_course)$"]({bb});
  way["building"]({bb});
);
out geom;"""


# ══ 해안선 → 바다 폴리곤 ══════════════════════════════════════════
# OSM coastline 은 「진행 방향 왼쪽이 뭍, 오른쪽이 바다」로 그려진다.
# 픽셀 좌표는 y 가 뒤집혀 있으므로 바다 쪽 법선은 (-dy, dx) 가 된다.

EPS = 0.05

def _clip_seg(a, b, w, h):
    """Liang–Barsky — 선분을 [0,w]×[0,h] 로 자른다. 밖이면 None."""
    x0, y0 = a; x1, y1 = b
    dx, dy = x1 - x0, y1 - y0
    t0, t1 = 0.0, 1.0
    for pq in ((-dx, x0), (dx, w - x0), (-dy, y0), (dy, h - y0)):
        pp, qq = pq
        if pp == 0:
            if qq < 0:
                return None
            continue
        r = qq / pp
        if pp < 0:
            if r > t1: return None
            if r > t0: t0 = r
        else:
            if r < t0: return None
            if r < t1: t1 = r
    return ((x0 + t0 * dx, y0 + t0 * dy), (x0 + t1 * dx, y0 + t1 * dy), t0 <= 0, t1 >= 1)


def clip_polyline(pts, w, h):
    """폴리라인을 사각형 안쪽 조각들로 자른다."""
    out, cur = [], None
    for i in range(len(pts) - 1):
        r = _clip_seg(pts[i], pts[i + 1], w, h)
        if r is None:
            if cur and len(cur) > 1: out.append(cur)
            cur = None
            continue
        a, b, entered, exited = r
        if cur is None or math.dist(cur[-1], a) > EPS:
            if cur and len(cur) > 1: out.append(cur)
            cur = [a]
        cur.append(b)
        if not exited:                     # 사각형 밖으로 나갔다 — 조각 끊기
            out.append(cur); cur = None
    if cur and len(cur) > 1: out.append(cur)
    return out


def join_chains(pieces):
    """끝점이 맞닿은 조각들을 이어 붙인다."""
    chains = [list(p) for p in pieces]
    merged = True
    while merged:
        merged = False
        for i in range(len(chains)):
            for j in range(len(chains)):
                if i == j or not chains[i] or not chains[j]:
                    continue
                a, b = chains[i], chains[j]
                if math.dist(a[0], a[-1]) < EPS:      # 이미 닫힌 고리
                    continue
                if math.dist(a[-1], b[0]) < EPS:
                    chains[i] = a + b[1:]; chains[j] = []; merged = True; break
            if merged: break
        chains = [c for c in chains if c]
    return chains


def _shoelace(pts):
    a = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i]; x1, y1 = pts[(i + 1) % len(pts)]
        a += x0 * y1 - x1 * y0
    return a / 2


def _perim_t(p, w, h):
    """사각형 둘레 위 위치 → 0~4 파라미터 (좌상단에서 시계방향). 경계가 아니면 None."""
    x, y = p; e = 0.6
    if y <= e:      return 0 + min(max(x / w, 0), 1)
    if x >= w - e:  return 1 + min(max(y / h, 0), 1)
    if y >= h - e:  return 2 + min(max((w - x) / w, 0), 1)
    if x <= e:      return 3 + min(max((h - y) / h, 0), 1)
    return None


_CORNERS = {1: None, 2: None, 3: None, 0: None}   # t=1 우상 · 2 우하 · 3 좌하 · 0 좌상


def _walk(t0, t1, w, h, forward):
    """사각형 둘레를 t0 → t1 로 따라가며 지나치는 모서리를 순서대로 모은다."""
    C = {1: (w, 0.0), 2: (w, h), 3: (0.0, h), 0: (0.0, 0.0)}
    span = (t1 - t0) % 4 if forward else (t0 - t1) % 4
    out = []
    for k in range(1, 5):
        kk = (math.floor(t0) + k) if forward else (math.ceil(t0) - k)
        d = ((kk - t0) % 4) if forward else ((t0 - kk) % 4)
        if 1e-9 < d < span - 1e-9:
            out.append(C[kk % 4])
    return out


def _inside(poly, pt):
    x, y = pt; c = False
    for i in range(len(poly)):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % len(poly)]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            c = not c
    return c


def _water_probe(chain, w, h):
    """체인 위 한 점에서 바다 쪽으로 살짝 들어간 시험점."""
    n = len(chain)
    for m in [n // 2] + list(range(1, n)):
        a, b = chain[m - 1], chain[m]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        if L < 1e-6:
            continue
        ux, uy = -dy / L, dx / L                        # 바다 쪽 법선
        px, py = (a[0] + b[0]) / 2 + ux * 1.2, (a[1] + b[1]) / 2 + uy * 1.2
        if 0.5 < px < w - 0.5 and 0.5 < py < h - 0.5:
            return (px, py)
    return None


def sea_polygons(ways, w, h):
    """해안선 way 목록 → (바다 폴리곤, 섬 폴리곤)."""
    pieces = []
    for pts in ways:
        pieces += clip_polyline(pts, w, h)
    sea, isle = [], []
    for ch in join_chains(pieces):
        if len(ch) < 3:
            continue
        if math.dist(ch[0], ch[-1]) < EPS:              # 닫힌 고리 — 섬 또는 호수
            ring = ch[:-1]
            (isle if _shoelace(ring) < 0 else sea).append(ring)
            continue
        # 타일 가장자리를 살짝 스치고 지나가는 부스러기(하구·방파제 조각 등).
        # 둘레를 돌아 닫으면 타일 전체를 바다로 칠해버리니 먼저 버린다.
        if sum(math.dist(ch[i], ch[i + 1]) for i in range(len(ch) - 1)) < 12:
            continue
        t0, t1 = _perim_t(ch[-1], w, h), _perim_t(ch[0], w, h)
        if t0 is None or t1 is None:                    # 양끝이 경계에 안 닿음 — 버린다
            continue
        probe = _water_probe(ch, w, h)
        if probe is None:
            continue
        cands = [ch + _walk(t0, t1, w, h, True), ch + _walk(t0, t1, w, h, False)]
        pick = next((c for c in cands if _inside(c, probe)), None)
        # 타일을 거의 다 덮는 답은 틀린 답이다 — 뭍이 있는 타일에서만 해안선을 뽑으므로.
        if pick and abs(_shoelace(pick)) < w * h * 0.92:
            sea.append(pick)
    return sea, isle


def simplify(pts, tol):
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    den = dx * dx + dy * dy
    worst, wi = -1.0, 0
    for i in range(1, len(pts) - 1):
        px_, py_ = pts[i]
        if den == 0:
            d = math.hypot(px_ - ax, py_ - ay)
        else:
            t = max(0.0, min(1.0, ((px_ - ax) * dx + (py_ - ay) * dy) / den))
            d = math.hypot(px_ - (ax + t * dx), py_ - (ay + t * dy))
        if d > worst:
            worst, wi = d, i
    if worst <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[:wi + 1], tol)[:-1] + simplify(pts[wi:], tol)


def path(pts, close):
    if len(pts) < 2:
        return None
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return d + "Z" if close else d


def area(pts):
    a = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        a += x0 * y1 - x1 * y0
    return abs(a) / 2


def run(name, s, w, n, e, farm=False, coast=False, out=None):
    W_PX = 1000.0
    kx = math.cos((s + n) / 2 * math.pi / 180)
    spx, spy = (e - w) * kx, (n - s)
    h_px = W_PX * spy / spx

    def proj(lat, lon):
        return ((lon - w) * kx / spx * W_PX, (n - lat) / spy * h_px)

    sys.stderr.write(f"[{name}] overpass 요청 …\n")
    data = query(build_query(s, w, n, e, coast))
    els = data.get("elements", [])
    sys.stderr.write(f"[{name}] {len(els)} elements\n")

    L = {k: [] for k in ("green", "water", "river", "stream", "road1", "road2", "road3", "rail", "pier")}
    farms, bldg, coast_ways = [], [], []
    ROAD1 = {"motorway", "trunk", "primary"}
    ROAD2 = {"secondary", "tertiary"}
    FARM = {"farmland", "meadow", "orchard", "vineyard", "grass"}

    for el in els:
        geom = el.get("geometry") or []
        pts = [proj(g["lat"], g["lon"]) for g in geom if g]
        if len(pts) < 2:
            continue
        t = el.get("tags") or {}

        if coast and t.get("natural") == "coastline":
            coast_ways.append(pts)
            continue
        if coast and t.get("man_made") in ("pier", "breakwater", "groyne"):
            d = path(simplify(pts, 0.8), False)
            if d:
                L["pier"].append(d)
            continue

        if "building" in t:
            p = simplify(pts, 0.7)
            if area(p) < 6:
                continue
            d = path(p, True)
            if d:
                # ci: 파스텔 6색 중 하나 — 위치로 흩뿌린다
                cx = sum(x for x, _ in p) / len(p)
                cy = sum(y for _, y in p) / len(p)
                ci = int(abs(cx * 3.7 + cy * 2.3)) % 6
                bldg.append([d, round(math.sqrt(area(p)) / 4 + 2, 1), ci])
            continue

        if t.get("highway") in ROAD1:
            key = "road1"
        elif t.get("highway") in ROAD2:
            key = "road2"
        elif t.get("highway"):
            key = "road3"
        elif t.get("railway") == "rail":
            key = "rail"
        elif t.get("waterway") == "river":
            key = "river"
        elif t.get("waterway"):
            key = "stream"
        elif t.get("natural") == "water":
            key = "water"
        elif farm and t.get("landuse") in FARM:
            key = "farm"
        elif t.get("landuse") or t.get("natural") or t.get("leisure"):
            key = "green"
        else:
            continue

        closed = key in ("green", "water", "farm")
        p = simplify(pts, 1.1 if closed else 1.4)
        if closed and area(p) < 30:
            continue
        # 실개천이 지도를 덮지 않게 짧은 것은 버린다
        if key == "stream":
            ln = sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))
            if ln < 26:
                continue
        d = path(p, closed)
        if not d:
            continue
        if key == "farm":
            cx = sum(x for x, _ in p) / len(p)
            cy = sum(y for _, y in p) / len(p)
            farms.append([d, int(abs(cx * 1.9 + cy * 3.1)) % 3])
        else:
            L[key].append(d)

    res = {"w": round(W_PX, 1), "h": round(h_px, 1), "bbox": [s, w, n, e],
           "layers": L, "bldg": bldg}
    if farm:
        res["farm"] = farms
    if coast:
        seas, isles = sea_polygons(coast_ways, W_PX, h_px)
        res["sea"]  = [d for d in (path(simplify(q, 0.6), True) for q in seas) if d]
        res["isle"] = [d for d in (path(simplify(q, 0.6), True) for q in isles) if d]
        sys.stderr.write(f"[{name}] coast ways:{len(coast_ways)}  sea:{len(res['sea'])}  isle:{len(res['isle'])}  pier:{len(L['pier'])}\n")
    txt = json.dumps(res, separators=(",", ":"))
    (open(out, "w") if out else sys.stdout).write(txt)
    sys.stderr.write(f"[{name}] {len(txt)//1024} KB  " +
                     "  ".join(f"{k}:{len(v)}" for k, v in L.items()) +
                     f"  bldg:{len(bldg)}  farm:{len(farms)}\n")


TARGETS = {
    # 이름:        (S,      W,       N,      E,      옵션)
    "sapporo": (43.02, 141.28, 43.11, 141.41, {}),
    "otaru":   (43.16, 140.96, 43.24, 141.06, {"coast": True}),
    "biei":    (43.40, 142.38, 43.64, 142.66, {"farm": True}),
}

if __name__ == "__main__":
    here = pathlib.Path(__file__).resolve().parent
    for name in (sys.argv[1:] or ["biei"]):
        S, W, N, E, opt = TARGETS[name]
        run(name, S, W, N, E, out=str(here / f"{name}.json"), **opt)
