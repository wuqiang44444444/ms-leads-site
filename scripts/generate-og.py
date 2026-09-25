"""Regenerate public/og.png after a brand change. Requires Pillow and a CJK font."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"
WIDTH, HEIGHT = 1200, 630


def load(size):
    return ImageFont.truetype(FONT, size, index=0)


def main():
    image = Image.new("RGB", (WIDTH, HEIGHT), "#102536")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 18, HEIGHT), fill="#0c6e8a")
    draw.ellipse((860, -180, 1320, 280), outline="#1a4d66", width=2)
    draw.ellipse((980, 360, 1280, 700), outline="#1a4d66", width=2)

    small = load(28)
    title = load(68)
    body = load(32)
    draw.text((72, 78), "云桥  ·  微软云解决方案合作伙伴", font=small, fill="#9fd4e6")
    draw.text((72, 168), "在客户自有订阅中", font=title, fill="#ffffff")
    draw.text((72, 262), "接入 Azure OpenAI", font=title, fill="#ffffff")
    draw.text((72, 400), "实施、运维与额度管理", font=body, fill="#d5e2ec")
    draw.text((72, 452), "不转售 API 密钥，也不提供 API 中转", font=body, fill="#d5e2ec")
    draw.text((72, 548), "本网站不是微软官方网站", font=small, fill="#8aa0b3")

    image.save(ROOT / "public" / "og.png", "PNG")


if __name__ == "__main__":
    main()
