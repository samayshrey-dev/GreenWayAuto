from PIL import Image, ImageDraw
import math

def create_supercar_garage_icon(size=64):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = size / 32.0

    def s(val):
        return val * scale

    # 1. Background rounded squircle
    bg_box = [s(1), s(1), s(31), s(31)]
    draw.rounded_rectangle(bg_box, radius=s(7), fill=(19, 29, 34, 255), outline=(42, 63, 71, 255), width=max(1, int(round(s(1)))))

    # Inner subtle teal ring
    inner_box = [s(2), s(2), s(30), s(30)]
    draw.rounded_rectangle(inner_box, radius=s(5.5), outline=(50, 125, 148, 140), width=max(1, int(round(s(0.8)))))

    # 2. Garage Roof Gable (Gable Peak at (16, 5), Base at (6, 10.5) and (26, 10.5))
    gable_pts = [
        (s(6), s(10.5)),
        (s(16), s(5)),
        (s(26), s(10.5))
    ]
    draw.line(gable_pts, fill=(72, 169, 197, 255), width=max(2, int(round(s(2)))))

    # 3. Supercar Roof / Windshield (trapezoid)
    windshield = [
        (s(12), s(15)),
        (s(14), s(11)),
        (s(18), s(11)),
        (s(20), s(15))
    ]
    draw.polygon(windshield, fill=(25, 40, 46, 255), outline=(255, 255, 255, 255))

    # 4. Supercar Body / Hood (Solid Crisp White)
    hood = [
        (s(8), s(15.5)),
        (s(12), s(15)),
        (s(20), s(15)),
        (s(24), s(15.5)),
        (s(25.5), s(22)),
        (s(24), s(24)),
        (s(8), s(24)),
        (s(6.5), s(22))
    ]
    draw.polygon(hood, fill=(255, 255, 255, 255))

    # 5. Twin Glowing LED Headlights (Electric Teal)
    left_light = [
        (s(8.5), s(18.5)),
        (s(12), s(19.5)),
        (s(11.5), s(21.2)),
        (s(8), s(20.2))
    ]
    draw.polygon(left_light, fill=(56, 189, 248, 255))

    right_light = [
        (s(23.5), s(18.5)),
        (s(20), s(19.5)),
        (s(20.5), s(21.2)),
        (s(24), s(20.2))
    ]
    draw.polygon(right_light, fill=(56, 189, 248, 255))

    # 6. Lower Intake Grille
    grille_box = [s(13), s(21.5), s(19), s(23.5)]
    draw.rounded_rectangle(grille_box, radius=s(0.75), fill=(19, 29, 34, 255))

    # 7. Aerodynamic Front Splitter
    draw.line([(s(6), s(25.5)), (s(26), s(25.5))], fill=(50, 125, 148, 255), width=max(2, int(round(s(1.8)))))

    return img

def create_racing_eg_icon(size=64):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = size / 32.0

    def s(val):
        return val * scale

    # Background rounded squircle
    bg_box = [s(1), s(1), s(31), s(31)]
    draw.rounded_rectangle(bg_box, radius=s(7), fill=(19, 29, 34, 255), outline=(42, 63, 71, 255), width=max(1, int(round(s(1)))))

    inner_box = [s(2), s(2), s(30), s(30)]
    draw.rounded_rectangle(inner_box, radius=s(5.5), outline=(50, 125, 148, 140), width=max(1, int(round(s(0.8)))))

    # Bold 'E' (Crisp White)
    draw.rectangle([s(6.5), s(8), s(9.5), s(24)], fill=(255, 255, 255, 255)) # vertical spine
    draw.rectangle([s(9.5), s(8), s(15.5), s(11.5)], fill=(255, 255, 255, 255)) # top bar
    draw.rectangle([s(9.5), s(14), s(14), s(17.5)], fill=(255, 255, 255, 255)) # middle bar
    draw.rectangle([s(9.5), s(20.5), s(15.5), s(24)], fill=(255, 255, 255, 255)) # bottom bar

    # Bold 'G' (Electric Teal)
    g_pts = [
        (s(18), s(11)),
        (s(21), s(8)),
        (s(25), s(8)),
        (s(25.5), s(11.5)),
        (s(21.5), s(11.5)),
        (s(20), s(13)),
        (s(20), s(19)),
        (s(21.5), s(20.5)),
        (s(23), s(20.5)),
        (s(23), s(16.5)),
        (s(21), s(16.5)),
        (s(21), s(13.5)),
        (s(25.5), s(13.5)),
        (s(25.5), s(24)),
        (s(21), s(24)),
        (s(18), s(21))
    ]
    draw.polygon(g_pts, fill=(72, 169, 197, 255))

    # Speed Spark
    draw.ellipse([s(22.5), s(8.5), s(25.5), s(11.5)], fill=(56, 189, 248, 255))

    return img

img_car = create_supercar_garage_icon(64)
img_car.save("client/public/favicon_car.png")

img_eg = create_racing_eg_icon(64)
img_eg.save("client/public/favicon_eg.png")

# Generate multi-resolution ICO for supercar garage
sizes = [16, 32, 48, 64]
ico_imgs = [create_supercar_garage_icon(sz) for sz in sizes]
ico_imgs[0].save("client/public/favicon.ico", format="ICO", sizes=[(s, s) for s in sizes], append_images=ico_imgs[1:])

print("Successfully generated favicon_car.png, favicon_eg.png, and favicon.ico!")
