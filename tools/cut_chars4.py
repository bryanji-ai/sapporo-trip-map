#!/usr/bin/env python3
"""4x4 커플 일러스트 시트  →  assets/chars/*.png + tools/sprites.json

cut_chars.py 와 하는 일은 같다. 다른 점 하나: 이 시트는 투명 배경이 아니라
**투명을 흉내 낸 체커보드가 픽셀로 구워져** 들어와 있다 (RGB, 알파 없음).
그래서 먼저 체커를 걷어 알파를 되돌린 다음, 알파 투영으로 셀을 잡는다.

체커를 걷는 방법: 「밝고 무채색」인 픽셀을 배경 후보로 두고 테두리에서
물을 채운다(flood fill). 그림 안쪽의 흰 니트모자·생크림·눈사람은 검은 윤곽선이
물을 막아 주므로 불투명하게 남는다 — 밝기만으로 자르면 구멍이 뚫린다.

사용법:  python3 tools/cut_chars4.py <시트.png>
"""
import base64, io, json, pathlib, sys
from collections import deque
from PIL import Image, ImageChops, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "chars"
SPRITES = ROOT / "tools" / "sprites.json"

BG_MIN  = 226      # 이보다 밝고
BG_SAT  = 10       # 이보다 무채색이면 배경 후보 (체커의 흰칸·회색칸 + 계단 픽셀)
SOLID   = 200      # 그림 덩어리로 볼 알파
FAINT   = 40       # 이보다 옅으면 완전 투명 — 잔여물 정리
GAP     = 10       # 이만큼 비면 다른 셀 (칸이 4개로 안 갈리면 아래로 조인다)
FLOOR   = 3        # 투영에서 이 정도 픽셀은 없는 셈 친다 — 삐져나온 김·눈송이 한 점
PAD     = 6        # 잘라 낸 그림 주위 숨통
TARGET_H = 210     # 기존 커플 컷과 같은 눈높이
MAX_W    = 300

# [행, 열] → 스프라이트 키 / 파일명. 없는 칸은 버린다(겨울 컷·이미 있는 컷).
CELLS = {
    (0, 0): ("cp-c-passport",  "char_c-passport"),
    (0, 1): ("cp-c-kaminari",  "char_c-kaminari"),
    (0, 2): ("cp-c-icebar",    "char_c-icebar"),
    (0, 3): ("cp-c-momiji",    "char_c-momiji"),
    (1, 0): ("cp-c-fuji",      "char_c-fuji"),
    (1, 1): ("cp-c-yukata",    "char_c-yukata"),
    (1, 2): ("cp-c-neko",      "char_c-neko"),
    (1, 3): ("cp-c-softcream", "char_c-softcream"),
    (2, 0): ("cp-c-tower",     "char_c-tower"),
    (2, 1): ("cp-c-onsen",     "char_c-onsen"),
    (2, 2): ("cp-c-sunflower", "char_c-sunflower"),
    (2, 3): ("cp-c-harbor",    "char_c-harbor"),
    (3, 0): ("cp-c-tako",      "char_c-tako"),
    (3, 1): ("cp-c-snowman",   "char_c-snowman"),
    (3, 2): ("cp-c-sushi",     "char_c-sushi"),
    (3, 3): ("cp-c-otaru",     "char_c-otaru"),
}


def strip_checker(im):
    """구워진 체커보드 배경을 걷어 RGBA 로 되돌린다."""
    rgb = im.convert("RGB")
    r, g, b = rgb.split()
    lo = ImageChops.darker(ImageChops.darker(r, g), b)
    hi = ImageChops.lighter(ImageChops.lighter(r, g), b)
    bright = lo.point(lambda v: 255 if v >= BG_MIN else 0)
    flat = ImageChops.subtract(hi, lo).point(lambda v: 255 if v <= BG_SAT else 0)
    cand = ImageChops.multiply(bright, flat).tobytes()

    W, H = im.size
    bg = bytearray(W * H)
    q = deque()

    def push(i):
        if cand[i] and not bg[i]:
            bg[i] = 255
            q.append(i)

    for x in range(W):
        push(x)
        push((H - 1) * W + x)
    for y in range(H):
        push(y * W)
        push(y * W + W - 1)
    while q:
        i = q.popleft()
        y, x = divmod(i, W)
        if x > 0:     push(i - 1)
        if x < W - 1: push(i + 1)
        if y > 0:     push(i - W)
        if y < H - 1: push(i + W)

    bg_img = Image.frombytes("L", (W, H), bytes(bg))
    alpha = bytearray(ImageChops.invert(bg_img).tobytes())

    # 경계 한 겹은 밝을수록 투명하게 — 체커와 섞인 계단 픽셀의 회색 테를 없앤다
    grown = bg_img.filter(ImageFilter.MaxFilter(3)).tobytes()
    lum = rgb.convert("L").tobytes()
    for i in range(W * H):
        if not bg[i] and grown[i]:
            alpha[i] = min(255, max(0, (250 - lum[i]) * 6))

    out = rgb.copy()
    out.putalpha(Image.frombytes("L", (W, H), bytes(alpha)))
    return out


def runs(counts, gap=GAP, minlen=6):
    """빈 줄이 gap 이상 이어지면 끊어, 값이 있는 구간들을 돌려준다."""
    out, start, blank = [], None, 0
    for i, c in enumerate(counts):
        if c > FLOOR:
            if start is None:
                start = i
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap:
                out.append((start, i - blank))
                start, blank = None, 0
    if start is not None:
        out.append((start, len(counts) - 1))
    return [r for r in out if r[1] - r[0] >= minlen]



NOISE = 20         # 이보다 작은 덩어리는 체커 찌꺼기로 본다
JOIN  = 60         # 덩어리가 이만큼 가까우면 그 칸의 소품(하트·비행기·낙엽)으로 붙인다


def blobs(solid, W, H):
    """알파 덩어리를 (넓이, x0, x1, y0, y1) 로 훑는다."""
    seen = bytearray(W * H)
    out = []
    for i in range(W * H):
        if not solid[i] or seen[i]:
            continue
        q = deque([i]); seen[i] = 1
        x0 = x1 = i % W; y0 = y1 = i // W; n = 0
        while q:
            j = q.popleft(); n += 1
            y, x = divmod(j, W)
            if x < x0: x0 = x
            if x > x1: x1 = x
            if y < y0: y0 = y
            if y > y1: y1 = y
            for k, ok in ((j-1, x > 0), (j+1, x < W-1), (j-W, y > 0), (j+W, y < H-1)):
                if solid[k] and ok and not seen[k]:
                    seen[k] = 1; q.append(k)
        out.append((n, x0, x1, y0, y1))
    return out


def grid_by_blobs(solid, W, H):
    """칸끼리 맞닿아 투영으로 못 자르는 시트용 — 큰 덩어리 16개를 격자에 앉힌다.

    투영(runs)은 「빈 줄」이 있어야 자른다. 그림 넷이 어깨를 맞대고 있으면
    빈 줄이 없어 4칸으로 안 갈린다. 칸마다 덩어리가 하나씩은 크게 있으니
    그 16개를 세로·가로로 줄 세워 (행, 열) 을 매기고, 하트·비행기·낙엽처럼
    떨어져 나온 조각은 가장 가까운 칸에 얹는다."""
    cs = [c for c in blobs(solid, W, H) if c[0] >= NOISE]
    if len(cs) < 16:
        return None
    cs.sort(reverse=True)
    anchors, rest = cs[:16], cs[16:]

    box = {}
    anchors.sort(key=lambda c: c[3] + c[4])                     # 세로 중심 → 4행
    for r in range(4):
        for c, a in enumerate(sorted(anchors[r*4:(r+1)*4],
                                     key=lambda c: c[1] + c[2])):  # 가로 중심 → 4열
            box[(r, c)] = [a[1], a[2], a[3], a[4]]

    for _, x0, x1, y0, y1 in rest:
        near, best = None, None
        for rc, b in box.items():
            dx = max(b[0] - x1, x0 - b[1], 0)
            dy = max(b[2] - y1, y0 - b[3], 0)
            d = dx*dx + dy*dy
            if best is None or d < best:
                near, best = rc, d
        if best > JOIN * JOIN:
            continue
        b = box[near]
        b[0] = min(b[0], x0); b[1] = max(b[1], x1)
        b[2] = min(b[2], y0); b[3] = max(b[3], y1)

    # 숨통(PAD)을 주되 이웃을 물지 않게 — 두 칸 사이 한가운데까지만
    out = {}
    for (r, c), b in box.items():
        l, rt = box.get((r, c-1)), box.get((r, c+1))
        u, d  = box.get((r-1, c)), box.get((r+1, c))
        out[(r, c)] = (max(b[0] - PAD, (l[1] + b[0])//2 + 1 if l else 0),
                       min(b[1] + PAD, (b[1] + rt[0])//2 - 1 if rt else W - 1),
                       max(b[2] - PAD, (u[3] + b[2])//2 + 1 if u else 0),
                       min(b[3] + PAD, (b[3] + d[2])//2 - 1 if d else H - 1))
    return out


def grid_by_bands(solid, W, H):
    """빈 줄이 있는 시트 — 행 투영으로 4줄, 행마다 열 투영으로 4칸."""
    rows = [sum(solid[y*W:(y+1)*W]) for y in range(H)]
    bands = runs(rows)
    print("행 밴드:", bands)
    if len(bands) != 4:
        return None

    out = {}
    for r, (y0, y1) in enumerate(bands):
        # 칸 사이 틈은 행마다 다르다 (옆 칸으로 팔·간판이 삐져나온다) — 좁혀 가며 찾는다
        cols = [sum(solid[y*W + x] for y in range(y0, y1 + 1)) for x in range(W)]
        for gap in (10, 8, 6, 5, 4, 3):
            cells = runs(cols, gap=gap)
            if len(cells) == 4:
                break
        print(f"{r}행 칸(gap={gap}):", cells)
        if len(cells) != 4:
            return None
        for c, (x0, x1) in enumerate(cells):
            out[(r, c)] = (x0, x1, y0, y1)
    return out


def main(src):
    im = strip_checker(Image.open(src))
    W, H = im.size
    solid = im.getchannel("A").point(lambda v: 1 if v > SOLID else 0).tobytes()
    faint = im.getchannel("A").point(lambda v: 1 if v > FAINT else 0).tobytes()

    grid = grid_by_bands(solid, W, H)
    if grid is None:
        print("투영으로 안 갈립니다 — 덩어리로 격자를 잡습니다")
        grid = grid_by_blobs(solid, W, H)
    if grid is None or len(grid) != 16:
        sys.exit("4x4 격자를 잡지 못했습니다")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sprites = json.loads(SPRITES.read_text(encoding="utf-8"))

    for (r, c), (x0, x1, y0, y1) in sorted(grid.items()):
        want = CELLS.get((r, c))
        if not want:
            print(f"  [{r},{c}] 건너뜀")
            continue
        key, name = want

        lx, rx, ty, by = x1, x0, y1, y0
        for y in range(y0, y1 + 1):
            base = y * W
            for x in range(x0, x1 + 1):
                if faint[base + x]:
                    if x < lx: lx = x
                    if x > rx: rx = x
                    if y < ty: ty = y
                    if y > by: by = y
        box = (max(x0, lx - PAD), max(y0, ty - PAD),
               min(x1, rx + PAD) + 1, min(y1, by + PAD) + 1)
        cut = im.crop(box)

        band = cut.getchannel("A").point(lambda v: 0 if v < FAINT else v)
        cut.putalpha(band)
        cut.save(OUT_DIR / f"{name}.png")

        w, h = cut.size
        sc = min(TARGET_H / h, MAX_W / w)
        small = cut.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
        buf = io.BytesIO()
        small.save(buf, "WEBP", quality=82, method=6)
        sprites[key] = {"w": small.width, "h": small.height,
                        "mime": "image/webp",
                        "b64": base64.b64encode(buf.getvalue()).decode()}
        print(f"  [{r},{c}] {name}.png {w}x{h}  →  {key} "
              f"{small.width}x{small.height} {len(buf.getvalue())//1024}KB")

    SPRITES.write_text(json.dumps(sprites, ensure_ascii=False, indent=1) + "\n",
                       encoding="utf-8")
    print(f"sprites.json  {SPRITES.stat().st_size//1024} KB")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__))
