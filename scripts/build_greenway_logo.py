from PIL import Image, ImageDraw, ImageFilter
import math

def render_greenway_logo(size=512):
    # Create 512x512 canvas with transparent background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # 1. Base Squircle in Dark Stealth Emerald Graphite
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)

    radius = int(size * 0.22)
    pad = int(size * 0.04)
    squircle_box = [pad, pad, size - pad, size - pad]

    # Main dark emerald graphite body: #0c1815
    bg_draw.rounded_rectangle(squircle_box, radius=radius, fill=(12, 24, 21, 255))

    # Outer metallic rim: #1e382f
    bg_draw.rounded_rectangle(squircle_box, radius=radius, outline=(30, 56, 47, 255), width=int(size * 0.015))

    # Inner vibrant electric emerald precision border ring
    inner_pad = int(pad + size * 0.018)
    inner_box = [inner_pad, inner_pad, size - inner_pad, size - inner_pad]
    bg_draw.rounded_rectangle(inner_box, radius=int(radius * 0.9), outline=(34, 197, 94, 140), width=int(size * 0.012))

    img.paste(bg, (0, 0), bg)

    # 2. Foreground Drawing: G and W
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fg_draw = ImageDraw.Draw(fg)

    y_top = int(size * 0.25)
    y_bot = int(size * 0.75)
    total_h = y_bot - y_top
    bar_h = int(total_h * 0.19)
    stem_w = int(size * 0.095)

    # --- LETTER 'G' (Pure White) ---
    x_g_start = int(size * 0.16)
    x_g_end = int(size * 0.46)
    g_w = x_g_end - x_g_start

    # G Top bar with chamfered top-right
    g_top_pts = [
        (x_g_start, y_top),
        (x_g_end - int(bar_h * 0.7), y_top),
        (x_g_end, y_top + int(bar_h * 0.7)),
        (x_g_end, y_top + bar_h),
        (x_g_start, y_top + bar_h)
    ]
    fg_draw.polygon(g_top_pts, fill=(255, 255, 255, 255))

    # G Left vertical spine
    fg_draw.rectangle([x_g_start, y_top, x_g_start + stem_w, y_bot], fill=(255, 255, 255, 255))

    # G Bottom bar with chamfered bottom-right
    g_bot_pts = [
        (x_g_start, y_bot - bar_h),
        (x_g_end - int(bar_h * 0.7), y_bot - bar_h),
        (x_g_end, y_bot - int(bar_h * 0.7)),
        (x_g_end - int(bar_h * 0.7), y_bot),
        (x_g_start, y_bot)
    ]
    fg_draw.polygon(g_bot_pts, fill=(255, 255, 255, 255))

    # G Right vertical post
    fg_draw.rectangle([x_g_end - stem_w, y_top + int(total_h * 0.44), x_g_end, y_bot], fill=(255, 255, 255, 255))

    # G Inward crossbar
    fg_draw.rectangle([x_g_start + int(g_w * 0.36), y_top + int(total_h * 0.44), x_g_end, y_top + int(total_h * 0.44) + bar_h], fill=(255, 255, 255, 255))

    # --- LETTER 'W' (Electric Emerald #22c55e) ---
    x_w_start = int(size * 0.53)
    x_w_end = int(size * 0.85)
    w_span = x_w_end - x_w_start

    p1 = (x_w_start, y_top)
    p2 = (x_w_start + int(w_span * 0.26), y_bot)
    p3 = (x_w_start + int(w_span * 0.50), y_top + int(total_h * 0.38))
    p4 = (x_w_start + int(w_span * 0.74), y_bot)
    p5 = (x_w_end, y_top)

    line_w = int(size * 0.088)
    fg_draw.line([p1, p2, p3, p4, p5], fill=(34, 197, 94, 255), width=line_w, joint="curve")

    # Speedway / Waypoint Apex Pip at the top-right of 'W' in radiant mint #86efac
    spark_rad = int(size * 0.044)
    fg_draw.ellipse([p5[0] - spark_rad, p5[1] - spark_rad, p5[0] + spark_rad, p5[1] + spark_rad], fill=(134, 239, 172, 255))

    img.alpha_composite(fg)
    return img

if __name__ == "__main__":
    master_512 = render_greenway_logo(512)
    master_512.save("client/public/favicon_master_512.png")

    sizes = [16, 32, 48, 64, 128, 192, 256]
    scaled_images = {sz: master_512.resize((sz, sz), Image.Resampling.LANCZOS) for sz in sizes}

    for sz, im in scaled_images.items():
        im.save(f"client/public/favicon_{sz}.png")

    scaled_images[32].save("client/public/favicon.png")
    scaled_images[32].save("client/public/favicon-32x32.png")
    scaled_images[16].save("client/public/favicon-16x16.png")
    scaled_images[192].save("client/public/apple-touch-icon.png")

    ico_layers = [scaled_images[16], scaled_images[32], scaled_images[48], scaled_images[64]]
    ico_layers[0].save(
        "client/public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=ico_layers[1:]
    )

    # Generate matching SVG vector
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- GreenWay Auto Luxury Squircle -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="#0c1815" stroke="#1e382f" stroke-width="1.5" />
  <rect x="4" y="4" width="56" height="56" rx="12" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.5" />

  <!-- Letter 'G' in Pure White -->
  <path d="M11 16 H29 L31 18 V24 H17 V40 H29 V34 H23 V28 H31 V46 H11 Z" fill="#ffffff" />

  <!-- Letter 'W' in Electric Emerald -->
  <path d="M34 17 L38 47 L43 27 L48 47 L52 17" stroke="#22c55e" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />

  <!-- Speedway / Waypoint Apex Pip -->
  <circle cx="52" cy="17" r="2.8" fill="#86efac" />
</svg>'''

    with open("client/public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)

    print("GreenWay Auto logo and favicons generated successfully!")
