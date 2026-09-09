#!/usr/bin/env python3
"""커플 컷(cp-*)의 그림틀을 하나로 맞춘다 — assets/chars/*.png + tools/sprites.json

컷마다 오려 낸 크기가 제각각이라 (230~267 × 210) 나란히 세우면 폭이 들쭉날쭉하다.
가장 반듯한 cp-lavender 를 기준 삼아 **모두 252 × 210 틀**에 담는다.

담는 법: 비율은 그대로 두고 높이 210 에 맞춘다. 그래도 폭이 252 를 넘으면
(cp-autumn 이 유일하게 267 이다) 폭 252 에 맞춰 줄인다. 남는 자리는 투명으로 둔다.
그림 자체는 커지지도 잘리지도 않고, 틀만 같아진다.

⚠️ assets/chars/*.png 를 제자리에서 덮어쓴다. 원본은 git 이력에 남아 있다.

사용법:  python3 tools/normalize_chars.py
"""
import base64, io, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHARS = ROOT / "assets" / "chars"
SPRITES = ROOT / "tools" / "sprites.json"

TARGET_W, TARGET_H = 252, 210      # cp-lavender 가 기준
QUALITY = 82                       # cut_chars*.py 와 같은 WebP 설정


def main():
    sprites = json.loads(SPRITES.read_text(encoding="utf-8"))
    total = 0

    for png in sorted(CHARS.glob("char_*.png")):
        key = "cp-" + png.stem[len("char_"):]
        if key not in sprites:
            print(f"  {png.name} → {key} 없음, 건너뜀")
            continue

        im = Image.open(png).convert("RGBA")
        w, h = im.size
        sc = min(TARGET_H / h, TARGET_W / w)
        small = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)

        # 틀 가운데에 놓고 나머지는 투명
        canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
        canvas.paste(small, ((TARGET_W - small.width) // 2,
                             (TARGET_H - small.height) // 2))
        canvas.save(png)

        buf = io.BytesIO()
        canvas.save(buf, "WEBP", quality=QUALITY, method=6)
        sprites[key] = {"w": TARGET_W, "h": TARGET_H, "mime": "image/webp",
                        "b64": base64.b64encode(buf.getvalue()).decode()}
        total += 1
        print(f"  {png.name} {w}x{h} → {small.width}x{small.height} "
              f"→ 틀 {TARGET_W}x{TARGET_H}  {key} {len(buf.getvalue())//1024}KB")

    SPRITES.write_text(json.dumps(sprites, ensure_ascii=False, indent=1) + "\n",
                       encoding="utf-8")
    print(f"컷 {total}개 균일화 · sprites.json  {SPRITES.stat().st_size//1024} KB")


if __name__ == "__main__":
    main()
