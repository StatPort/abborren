"""Single trumpet silhouette, cut-out/pasted-paper style, transparent PNG.
Mouthpiece on the left, bell flares out to the right.
"""
from PIL import Image, ImageDraw, ImageFilter

W, H = 700, 300
t = Image.new("RGBA", (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(t)
body_y = H // 2
tube_w = int(H * 0.11)

td.line([(20, body_y), (90, body_y)], fill=(20, 20, 20, 255), width=int(tube_w * 0.55))
td.ellipse([10, body_y - 8, 34, body_y + 8], fill=(20, 20, 20, 255))

x0 = 85
x1 = int(W * 0.60)
top_y = body_y - int(H * 0.17)
bot_y = body_y + int(H * 0.17)
td.line([(x0, body_y), (x1, top_y)], fill=(20, 20, 20, 255), width=tube_w)
td.line([(x0, body_y), (x1, bot_y)], fill=(20, 20, 20, 255), width=tube_w)
td.line([(x1, top_y), (x1 + 30, body_y)], fill=(20, 20, 20, 255), width=tube_w)
td.line([(x1, bot_y), (x1 + 30, body_y)], fill=(20, 20, 20, 255), width=tube_w)

for i in range(3):
    vx = x0 + 55 + i * 46
    vy = top_y - int(H * 0.015)
    td.rectangle([vx, vy - 26, vx + 20, vy + 26], fill=(20, 20, 20, 255))
    td.ellipse([vx - 4, vy - 31, vx + 24, vy - 21], fill=(20, 20, 20, 255))

bell_x0 = x1 + 20
bell_pts = [
    (bell_x0, body_y - tube_w // 2),
    (W - 15, body_y - int(H * 0.40)),
    (W - 15, body_y + int(H * 0.40)),
    (bell_x0, body_y + tube_w // 2),
]
td.polygon(bell_pts, fill=(20, 20, 20, 255))
td.ellipse([W - 65, body_y - int(H * 0.40), W - 8, body_y + int(H * 0.40)],
           outline=(20, 20, 20, 255), width=8)

# cut-paper border: dilate alpha, put white behind
alpha = t.split()[-1]
border = 9
dilated = alpha.filter(ImageFilter.MaxFilter(border * 2 + 1))
white_layer = Image.new("RGBA", t.size, (255, 255, 255, 255))
white_layer.putalpha(dilated)
bordered = Image.alpha_composite(white_layer, t)
a2 = bordered.split()[-1].filter(ImageFilter.GaussianBlur(1.0))
bordered.putalpha(a2)

bbox = bordered.split()[-1].getbbox()
m = 6
x0b, y0b, x1b, y1b = bbox
bordered = bordered.crop((max(0, x0b - m), max(0, y0b - m),
                           min(W, x1b + m), min(H, y1b + m)))

bordered.save("/Users/matildagrahnjansson/Desktop/abborren_app/assets/img/trumpet.png")
print("saved", bordered.size)
