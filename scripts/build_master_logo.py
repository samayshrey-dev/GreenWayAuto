from PIL import Image, ImageDraw, ImageFont
import math

def render_master_logo(size=512):
    # Create 512x512 canvas for buttery smooth anti-aliased rendering
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Gradient background squircle
    # We create a subtle vertical metallic graphite gradient: #1e2b30 to #111a1d
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)

    # Draw rounded squircle
    radius = int(size * 0.22)
    pad = int(size * 0.04)
    squircle_box = [pad, pad, size - pad, size - pad]

    # Draw main dark graphite body
    bg_draw.rounded_rectangle(squircle_box, radius=radius, fill=(18, 27, 31, 255))

    # Outer subtle edge ring: #334a52
    bg_draw.rounded_rectangle(squircle_box, radius=radius, outline=(48, 71, 79, 255), width=int(size * 0.015))

    # Inner vibrant electric teal precision ring
    inner_pad = int(pad + size * 0.018)
    inner_box = [inner_pad, inner_pad, size - inner_pad, size - inner_pad]
    bg_draw.rounded_rectangle(inner_box, radius=int(radius * 0.9), outline=(50, 125, 148, 160), width=int(size * 0.012))

    img.paste(bg, (0, 0), bg)

    # Now let's draw the bold aerodynamic "EG" Mark
    # Let's use custom clean geometry for 'E' and 'G'
    # E: (X from 15% to 47%, Y from 24% to 76%)
    # G: (X from 51% to 85%, Y from 24% to 76%)

    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fg_draw = ImageDraw.Draw(fg)

    # Geometry coordinates
    y_top = int(size * 0.25)
    y_bot = int(size * 0.75)
    total_h = y_bot - y_top
    bar_h = int(total_h * 0.20) # thickness of horizontal bars
    stem_w = int(size * 0.11)  # thickness of vertical stems

    # === LETTER 'E' (Crisp Pure White with Speed Slit) ===
    x_e_start = int(size * 0.16)
    x_e_end = int(size * 0.47)
    
    # E Vertical spine
    fg_draw.rectangle([x_e_start, y_top, x_e_start + stem_w, y_bot], fill=(255, 255, 255, 255))
    # E Top bar
    fg_draw.rectangle([x_e_start, y_top, x_e_end, y_top + bar_h], fill=(255, 255, 255, 255))
    # E Mid bar (slightly shorter, speed dynamic)
    fg_draw.rectangle([x_e_start, y_top + int(total_h * 0.41), int(x_e_end * 0.94), y_top + int(total_h * 0.41) + bar_h], fill=(255, 255, 255, 255))
    # E Bottom bar
    fg_draw.rectangle([x_e_start, y_bot - bar_h, x_e_end, y_bot], fill=(255, 255, 255, 255))

    # === LETTER 'G' (Electric Teal #38bdf8 / #4eaec7) ===
    x_g_start = int(size * 0.52)
    x_g_end = int(size * 0.84)
    g_w = x_g_end - x_g_start

    # G Top bar with chamfered / angled top-right corner
    g_top_pts = [
        (x_g_start, y_top),
        (x_g_end - int(bar_h * 0.8), y_top),
        (x_g_end, y_top + int(bar_h * 0.8)),
        (x_g_end, y_top + bar_h),
        (x_g_start, y_top + bar_h)
    ]
    fg_draw.polygon(g_top_pts, fill=(74, 180, 204, 255))

    # G Left vertical spine
    fg_draw.rectangle([x_g_start, y_top, x_g_start + stem_w, y_bot], fill=(74, 180, 204, 255))

    # G Bottom bar with chamfered bottom-right corner
    g_bot_pts = [
        (x_g_start, y_bot - bar_h),
        (x_g_end, y_bot - bar_h),
        (x_g_end, y_bot - int(bar_h * 0.8)),
        (x_g_end - int(bar_h * 0.8), y_bot),
        (x_g_start, y_bot)
    ]
    fg_draw.polygon(g_bot_pts, fill=(74, 180, 204, 255))

    # G Right lower vertical post
    fg_draw.rectangle([x_g_end - stem_w, y_top + int(total_h * 0.44), x_g_end, y_bot], fill=(74, 180, 204, 255))

    # G Inward crossbar
    fg_draw.rectangle([x_g_start + int(g_w * 0.38), y_top + int(total_h * 0.44), x_g_end, y_top + int(total_h * 0.44) + bar_h], fill=(74, 180, 204, 255))

    # Speed Spark Dot in Electric Cyan #38bdf8 (at the apex of G)
    spark_rad = int(size * 0.038)
    spark_cx = x_g_end - int(bar_h * 0.5)
    spark_cy = y_top + int(bar_h * 0.5)
    fg_draw.ellipse([spark_cx - spark_rad, spark_cy - spark_rad, spark_cx + spark_rad, spark_cy + spark_rad], fill=(56, 189, 248, 255))

    # Paste foreground on background
    img.alpha_composite(fg)

    return img

# Render master image at 512x512
master_512 = render_master_logo(512)
master_512.save("client/public/favicon_master_512.png")

# Downsample with Lanczos for crystal-clear antialiasing at all icon sizes
sizes = [16, 32, 48, 64, 128, 192, 256]
scaled_images = {sz: master_512.resize((sz, sz), Image.Resampling.LANCZOS) for sz in sizes}

for sz, im in scaled_images.items():
    im.save(f"client/public/favicon_{sz}.png")

# Save standard 32px as favicon.png
scaled_images[32].save("client/public/favicon.png")
scaled_images[192].save("client/public/apple-touch-icon.png")

# Save multi-resolution ICO file (16, 32, 48, 64)
ico_layers = [scaled_images[16], scaled_images[32], scaled_images[48], scaled_images[64]]
ico_layers[0].save(
    "client/public/favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    append_images=ico_layers[1:]
)

# Also generate corresponding crisp vector SVG
svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- Industrial Squircle Badge -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="#121b1f" stroke="#30474f" stroke-width="1.5" />
  <rect x="4" y="4" width="56" height="56" rx="12" fill="none" stroke="#327d94" stroke-width="1" stroke-opacity="0.6" />

  <!-- Letter 'E' (Crisp White) -->
  <path d="M11 16 H30 V25 H18 V30 H28 V39 H18 V43 H30 V48 H11 Z" fill="#ffffff" />

  <!-- Letter 'G' (Electric Teal) -->
  <path d="M33 16 H48 L53 21 V25 H39 V39 H47 V35 H42 V30 H53 V44 L48 48 H33 Z" fill="#4ab4cc" />

  <!-- Electric Speed Spark -->
  <circle cx="49" cy="20" r="2.5" fill="#38bdf8" />
</svg>'''

with open("client/public/favicon.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

print("Generated anti-aliased favicons and vector SVG successfully!")
