from PIL import Image, ImageFilter
import numpy as np

logo = Image.open("logo.png").convert("RGB")
bg = Image.open("bakgrund.png").convert("RGB")

assert logo.size == bg.size

a = np.asarray(logo).astype(int)
b = np.asarray(bg).astype(int)
diff = np.abs(a - b).sum(axis=2)  # per-pixel difference magnitude

# threshold: anything noticeably different from the plain background is "logo"
mask = (diff > 18).astype(np.uint8) * 255

mask_img = Image.fromarray(mask, mode="L")
# clean up speckle noise, then soften edges slightly
mask_img = mask_img.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
mask_img = mask_img.filter(ImageFilter.GaussianBlur(0.6))

out = logo.convert("RGBA")
out.putalpha(mask_img)

# crop tightly to the mask's bounding box with a small margin
bbox = mask_img.getbbox()
if bbox:
    x0, y0, x1, y1 = bbox
    m = 20
    x0 = max(0, x0 - m)
    y0 = max(0, y0 - m)
    x1 = min(out.width, x1 + m)
    y1 = min(out.height, y1 + m)
    out = out.crop((x0, y0, x1, y1))

out.save("logo_transparent.png")
print("saved", out.size)
