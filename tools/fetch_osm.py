#!/usr/bin/env python3
"""OSM Overpass -> 지도 레이어 JSON.

샘플(삿포로)이 쓰던 것과 같은 형태로 뽑는다:
  {w,h,bbox:[S,W,N,E],layers:{green,water,river,road1,road2,road3,rail},bldg:[[d,h,ci]]}
비에이는 밭 패치워크가 주인공이라 farm 레이어를 더 얹는다: [[d, cls]] (0 밀·1 라벤더·2 감자)
"""
import json, math, sys, urllib.request, urllib.parse, time

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


def build_query(s, w, n, e):
    bb = f"{s},{w},{n},{e}"
    return f"""[out:json][timeout:280];
(
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


def run(name, s, w, n, e, farm=False, out=None):
    W_PX = 1000.0
    kx = math.cos((s + n) / 2 * math.pi / 180)
    spx, spy = (e - w) * kx, (n - s)
    h_px = W_PX * spy / spx

    def proj(lat, lon):
        return ((lon - w) * kx / spx * W_PX, (n - lat) / spy * h_px)

    sys.stderr.write(f"[{name}] overpass 요청 …\n")
    data = query(build_query(s, w, n, e))
    els = data.get("elements", [])
    sys.stderr.write(f"[{name}] {len(els)} elements\n")

    L = {k: [] for k in ("green", "water", "river", "stream", "road1", "road2", "road3", "rail")}
    farms, bldg = [], []
    ROAD1 = {"motorway", "trunk", "primary"}
    ROAD2 = {"secondary", "tertiary"}
    FARM = {"farmland", "meadow", "orchard", "vineyard", "grass"}

    for el in els:
        geom = el.get("geometry") or []
        pts = [proj(g["lat"], g["lon"]) for g in geom if g]
        if len(pts) < 2:
            continue
        t = el.get("tags") or {}

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
    txt = json.dumps(res, separators=(",", ":"))
    (open(out, "w") if out else sys.stdout).write(txt)
    sys.stderr.write(f"[{name}] {len(txt)//1024} KB  " +
                     "  ".join(f"{k}:{len(v)}" for k, v in L.items()) +
                     f"  bldg:{len(bldg)}  farm:{len(farms)}\n")


if __name__ == "__main__":
    run("biei", 43.40, 142.38, 43.64, 142.66, farm=True,
        out="/Users/seunghunji/sapporo-trip-map/tools/biei.json")
