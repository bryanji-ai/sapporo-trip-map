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
    (1, 0): ("cp-fall-hat", "char_fall-hat"),
    (1, 3): ("cp-camera",   "char_camera"),
    (2, 2): ("cp-parfait",  "char_parfait"),
    (2, 3): ("cp-lavender", "char_lavender"),
    (3, 0): ("cp-night",    "char_night"),
    (3, 3): ("cp-onsen",    "char_onsen"),
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


def main(src):
    im = strip_checker(Image.open(src))
    W, H = im.size
    solid = im.getchannel("A").point(lambda v: 1 if v > SOLID else 0).tobytes()
    faint = im.getchannel("A").point(lambda v: 1 if v > FAINT else 0).tobytes()

    rows = [sum(solid[y*W:(y+1)*W]) for y in range(H)]
    bands = runs(rows)
    print("행 밴드:", bands)
    if len(bands) != 4:
        sys.exit(f"행이 4개로 갈리지 않습니다: {bands}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sprites = json.loads(SPRITES.read_text(encoding="utf-8"))

    for r, (y0, y1) in enumerate(bands):
        # 칸 사이 틈은 행마다 다르다 (옆 칸으로 팔·간판이 삐져나온다) — 좁혀 가며 찾는다
        cols = [sum(solid[y*W + x] for y in range(y0, y1 + 1)) for x in range(W)]
        for gap in (10, 8, 6, 5, 4, 3):
            cells = runs(cols, gap=gap)
            if len(cells) == 4:
                break
        print(f"{r}행 칸(gap={gap}):", cells)
        if len(cells) != 4:
            sys.exit(f"{r}행이 4칸으로 갈리지 않습니다: {cells}")

        for c, (x0, x1) in enumerate(cells):
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
