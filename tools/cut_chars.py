#!/usr/bin/env python3
"""3x3 격자로 뽑아 온 커플 일러스트 시트  →  assets/chars/*.png + tools/sprites.json

원본은 셀마다 그림 크기가 다르고 격자에 딱 맞지도 않는다. 그래서 산술로 9등분하지
않고, 투명 배경(alpha)의 행·열 투영으로 실제 그림 덩어리를 찾아 셀을 잡는다.
찾은 셀은 다시 알파 경계까지 바짝 잘라 낸다 — 여백이 붙어 있으면 지도 위에서
캐릭터가 실제보다 작아 보인다.

사용법:  python3 tools/cut_chars.py <시트.png>
"""
import base64, io, json, pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "chars"
SPRITES = ROOT / "tools" / "sprites.json"

SOLID = 200        # 그림 덩어리로 볼 알파 (희미한 후광은 셀 탐색에서 뺀다)
FAINT = 40         # 이보다 옅은 픽셀은 완전히 투명하게 — 생성 잔여물 정리
GAP = 10           # 이만큼 비면 다른 셀로 본다
PAD = 6            # 잘라 낸 그림 주위에 남기는 숨통
TARGET_H = 210     # 스프라이트 저장 높이 (기존 커플 컷과 같은 눈높이)
MAX_W = 300

# [행, 열] → 스프라이트 키 / 파일명. 겨울 컷도 그림체가 달라 -b 로 따로 담는다.
CELLS = {
    (0, 0): ("cp-ramen",    "char_ramen"),
    (0, 1): ("cp-tower-b",  "char_tower-b"),   # 삿포로타워 + 눈꽃
    (0, 2): ("cp-beer",     "char_beer"),
    (1, 0): ("cp-autumn",   "char_autumn"),
    (1, 1): ("cp-yakiniku", "char_yakiniku"),
    (1, 2): ("cp-icecream", "char_icecream"),
    (2, 0): ("cp-susukino", "char_susukino"),
    (2, 1): ("cp-snowman-b", "char_snowman-b"), # 눈사람
    (2, 2): ("cp-guide",    "char_guide"),
}


def runs(counts, gap=GAP, minlen=6):
    """0 이 gap 이상 이어지면 끊어, 값이 있는 구간들을 돌려준다."""
    out, start, blank = [], None, 0
    for i, c in enumerate(counts):
        if c:
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


def tight_box(alpha, x0, x1, y0, y1):
    """구간 안에서 알파가 있는 실제 경계 (PAD 만큼 여유를 둔다)"""
    lx, rx, ty, by = x1, x0, y1, y0
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if alpha[x, y] > FAINT:
                if x < lx: lx = x
                if x > rx: rx = x
                if y < ty: ty = y
                if y > by: by = y
    return (max(x0, lx - PAD), max(y0, ty - PAD),
            min(x1, rx + PAD) + 1, min(y1, by + PAD) + 1)


def main(src):
    im = Image.open(src).convert("RGBA")
    W, H = im.size
    alpha = im.getchannel("A").load()

    # 행 밴드 먼저 — 세 줄로 갈린다
    rows = [sum(1 for x in range(W) if alpha[x, y] > SOLID) for y in range(H)]
    bands = runs(rows)
    if len(bands) != 3:
        sys.exit(f"행이 3개로 갈리지 않습니다: {bands}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sprites = json.loads(SPRITES.read_text(encoding="utf-8"))

    for r, (y0, y1) in enumerate(bands):
        cols = [sum(1 for y in range(y0, y1 + 1) if alpha[x, y] > SOLID) for x in range(W)]
        cells = runs(cols)
        if len(cells) != 3:
            sys.exit(f"{r}행이 3칸으로 갈리지 않습니다: {cells}")

        for c, (x0, x1) in enumerate(cells):
            want = CELLS[(r, c)]
            if not want:
                print(f"  [{r},{c}] 건너뜀 (겨울 컷)")
                continue
            key, name = want
            box = tight_box(alpha, x0, x1, y0, y1)
            cut = im.crop(box)

            # 생성 잔여물 — 옅은 후광을 완전히 투명하게
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
