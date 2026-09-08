#!/usr/bin/env python3
"""비에이 언덕을 진짜 고도로 그리기 위한 DEM 격자 수집.
opentopodata 공개 API (SRTM 30m) — 100점/요청, 1초 간격.
출력: {"nx":..,"ny":..,"bbox":[s,w,n,e],"z":[[...]]}  (미터, 정수)
"""
import json, sys, time, urllib.request, urllib.parse

S, W, N, E = 43.40, 142.38, 43.64, 142.66
NX, NY = 36, 42
URL = "https://api.opentopodata.org/v1/srtm30m"

pts = []
for iy in range(NY):
    lat = N - (N - S) * (iy + 0.5) / NY
    for ix in range(NX):
        lon = W + (E - W) * (ix + 0.5) / NX
        pts.append((lat, lon))

def batch(chunk):
    loc = "|".join(f"{a:.5f},{b:.5f}" for a, b in chunk)
    req = urllib.request.Request(
        URL, data=urllib.parse.urlencode({"locations": loc}).encode(),
        headers={"User-Agent": "sapporo-trip-map/1.0 (personal trip poster)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())["results"]

z = []
for i in range(0, len(pts), 100):
    chunk = pts[i:i + 100]
    for attempt in range(4):
        try:
            res = batch(chunk)
            z += [int(round(x["elevation"])) if x.get("elevation") is not None else 0
                  for x in res]
            break
        except Exception as ex:
            sys.stderr.write(f"  retry {i} #{attempt+1}: {ex}\n")
            time.sleep(6 * (attempt + 1))
    else:
        raise SystemExit(f"DEM 실패 @ {i}")
    sys.stderr.write(f"  {len(z)}/{len(pts)}\n")
    time.sleep(1.2)

grid = [z[r * NX:(r + 1) * NX] for r in range(NY)]
out = {"nx": NX, "ny": NY, "bbox": [S, W, N, E], "z": grid}
json.dump(out, open("/Users/seunghunji/sapporo-trip-map/tools/biei_dem.json", "w"),
          separators=(",", ":"))
flat = [v for row in grid for v in row]
sys.stderr.write(f"DEM ok  min={min(flat)} max={max(flat)}\n")
