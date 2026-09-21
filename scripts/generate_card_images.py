#!/usr/bin/env python3
"""
Generate unique, attractive card illustrations for the STACKLY Government site.
Produces 8 core-service images + 6 department images as WebP (< 90KB each).
Style: deep navy civic palette with gold accents, flat layered illustration.
Run from project root:  python scripts/generate_card_images.py
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFont

W, H = 640, 420

# ---- Palette (mirrors css/style.css variables) -------------------------------
NAVY = (16, 32, 64)
NAVY_MID = (24, 46, 88)
NAVY_SOFT = (36, 62, 110)
NAVY_DEEP = (8, 16, 34)
GOLD = (212, 175, 55)
GOLD_LIGHT = (236, 210, 118)
GOLD_DIM = (150, 120, 38)
WHITE = (255, 255, 255)
CLOUD = (210, 222, 240)
CLOUD_DIM = (150, 168, 198)

SEED = 20260921  # deterministic, unique variation per card

FONT_PATHS = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/seguisb.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
]


def load_font(size, bold=True):
    paths = FONT_PATHS if bold else FONT_PATHS[1::2] + FONT_PATHS[0::2]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


# ---- Shared scene pieces ------------------------------------------------------
def base_canvas(rnd):
    """Navy sky gradient with warm horizon glow and faint stars."""
    img = Image.new("RGB", (W, H), NAVY)
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        r, g, b = NAVY
        k = 1.0 + 0.35 * t
        r, g, b = int(r * k), int(g * k), b
        if t > 0.52:
            wgt = (t - 0.52) / 0.48
            r = min(255, int(r + 70 * wgt * wgt))
            g = min(255, int(g + 48 * wgt * wgt))
            b = min(255, int(b + 10 * wgt * wgt))
        row = (r, g, b)
        for x in range(W):
            px[x, y] = row
    # radial gold glow behind the subject
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    cx, cy, R = W // 2, int(H * 0.66), int(W * 0.48)
    for i in range(R, 0, -4):
        a = int(64 * (1 - i / R) ** 2)
        gd.ellipse([cx - i, cy - int(i * 0.78), cx + i, cy + int(i * 0.78)], fill=a)
    img = Image.composite(Image.new("RGB", (W, H), GOLD), img, glow)
    # stars
    d = ImageDraw.Draw(img)
    for _ in range(55):
        x = rnd.randint(0, W - 2)
        y = rnd.randint(0, int(H * 0.42))
        s = rnd.choice((1, 1, 1, 2))
        v = rnd.randint(120, 210)
        d.ellipse([x, y, x + s, y + s], fill=(v, v + 12, min(255, v + 40)))
    return img


def glow_at(img, cx, cy, rx, ry, strength=80):
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    for i in range(max(rx, ry), 0, -4):
        a = int(strength * (1 - i / max(rx, ry)) ** 2)
        d.ellipse([cx - i, cy - int(i * ry / max(rx, ry)),
                   cx + i, cy + int(i * ry / max(rx, ry))], fill=a)
    img.paste(Image.new("RGB", (W, H), GOLD), (0, 0), mask)


def clouds(img, rnd, count=3):
    d = ImageDraw.Draw(img)
    for _ in range(count):
        cx = rnd.randint(60, W - 60)
        cy = rnd.randint(40, int(H * 0.38))
        wdt = rnd.randint(70, 130)
        col = (rnd.randint(120, 150), rnd.randint(140, 165), rnd.randint(180, 205))
        for k in range(4):
            rw = int(wdt * (1 - k * 0.16))
            rh = int(16 * (1 - k * 0.12))
            d.ellipse([cx - rw // 2, cy - rh // 2 - k * 6,
                       cx + rw // 2, cy + rh // 2 - k * 6], fill=col)


def water(img, top=318, seed=11):
    d = ImageDraw.Draw(img)
    for y in range(top, H):
        t = (y - top) / max(1, H - top)
        d.line([(0, y), (W, y)], fill=(int(10 + 9 * t), int(20 + 14 * t), int(44 + 20 * t)))
    rnd = random.Random(seed)
    for y in range(top + 5, H - 4, 7):
        x = rnd.randint(0, 100)
        while x < W:
            seg = rnd.randint(16, 56)
            if rnd.random() < 0.55:
                col = GOLD if rnd.random() < 0.25 else CLOUD_DIM
                d.line([(x, y), (x + seg, y)], fill=col, width=1)
            x += seg + rnd.randint(24, 70)


def skyline(img, seed, top=318, tone=(20, 38, 74), lit=True, dome=True):
    d = ImageDraw.Draw(img)
    rnd = random.Random(seed)
    x = -12
    while x < W + 12:
        wdt = rnd.randint(32, 72)
        hgt = rnd.randint(36, 140)
        x0, y0 = x, top - hgt
        d.rectangle([x0, y0, x0 + wdt, top], fill=tone)
        if lit:
            for wy in range(y0 + 8, top - 8, 12):
                for wx in range(x0 + 6, x0 + wdt - 7, 12):
                    if rnd.random() < 0.33:
                        d.rectangle([wx, wy, wx + 4, wy + 5], fill=GOLD)
        if rnd.random() < 0.3:
            ax = x0 + wdt // 2
            d.line([(ax, y0), (ax, y0 - rnd.randint(10, 24))], fill=tone, width=2)
        x += wdt + rnd.randint(2, 10)
    if dome:
        d.pieslice([W - 148, top - 88, W - 12, top + 34], 180, 360, fill=NAVY_SOFT)
        d.rectangle([W - 148, top - 4, W - 12, top], fill=NAVY_SOFT)


def ribbons(img, seed, y_mid=150, count=2):
    d = ImageDraw.Draw(img)
    rnd = random.Random(seed + 17)
    for j in range(count):
        yb = y_mid + j * 26 + rnd.randint(-8, 8)
        amp = rnd.randint(6, 12)
        per = rnd.randint(100, 150)
        ph = rnd.random() * 6.28
        pts = [(x, yb + amp * math.sin(x / per * 6.28 + ph)) for x in range(0, W + 12, 12)]
        d.line(pts, fill=GOLD_DIM, width=5, joint="curve")
        d.line(pts, fill=GOLD, width=2, joint="curve")


def lamp_posts(img, ground_y, xs=(70, 570)):
    d = ImageDraw.Draw(img)
    for x in xs:
        d.line([(x, ground_y), (x, ground_y - 62)], fill=NAVY_DEEP, width=5)
        d.ellipse([x - 9, ground_y - 78, x + 9, ground_y - 60], fill=GOLD)
        d.ellipse([x - 4, ground_y - 73, x + 4, ground_y - 65], fill=GOLD_LIGHT)


def gold_disc(img, cx, cy, r, ring=True):
    d = ImageDraw.Draw(img)
    if ring:
        d.ellipse([cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8], fill=NAVY_DEEP)
        d.ellipse([cx - r - 4, cy - r - 4, cx + r + 4, cy + r + 4], fill=GOLD_DIM)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLD)
    d.ellipse([cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8], fill=GOLD_LIGHT)


def card(img):
    """Rounded ID-card shape with photo square, lines and gold band."""
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = 196, 118, 444, 296
    d.rounded_rectangle([x0 - 6, y0 - 6, x1 + 6, y1 + 6], radius=20, fill=NAVY_DEEP)
    d.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=WHITE)
    d.rectangle([x0, y0, x1, y0 + 26], fill=NAVY)
    d.rectangle([x0, y0 + 26, x1, y0 + 30], fill=GOLD)
    # photo box: citizen bust
    px0, py0 = x0 + 20, y0 + 52
    d.rectangle([px0, py0, px0 + 78, py0 + 92], fill=CLOUD)
    d.ellipse([px0 + 26, py0 + 12, px0 + 52, py0 + 40], fill=NAVY)          # head
    d.pieslice([px0 + 12, py0 + 42, px0 + 66, py0 + 104], 180, 360, fill=NAVY)  # shoulders
    # text lines
    for i, wline in enumerate((150, 176, 118, 156)):
        yy = y0 + 58 + i * 22
        col = NAVY if i in (0, 3) else CLOUD_DIM
        d.rounded_rectangle([px0 + 98, yy, px0 + 98 + wline, yy + 9], radius=4, fill=col)
    # gold chip
    d.rounded_rectangle([x1 - 62, y1 - 52, x1 - 20, y1 - 18], radius=6, fill=GOLD)
    d.line([(x1 - 62, y1 - 35), (x1 - 20, y1 - 35)], fill=NAVY, width=2)
    d.line([(x1 - 41, y1 - 52), (x1 - 41, y1 - 18)], fill=NAVY, width=2)


def certificate(img):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = 186, 108, 454, 306
    d.rounded_rectangle([x0 - 6, y0 - 6, x1 + 6, y1 + 6], radius=18, fill=NAVY_DEEP)
    d.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=WHITE)
    d.rectangle([x0 + 14, y0 + 14, x1 - 14, y0 + 20], fill=GOLD)
    d.rounded_rectangle([x0 + 110, y0 + 44, x1 - 110, y0 + 58], radius=6, fill=NAVY)
    for i, wline in enumerate((200, 168, 184)):
        yy = y0 + 82 + i * 26
        d.rounded_rectangle([x0 + 34, yy, x0 + 34 + wline, yy + 10], radius=4,
                            fill=CLOUD_DIM if i else NAVY)
    # seal with ribbons
    sx, sy = x1 - 52, y1 - 56
    d.line([(sx - 12, sy + 14), (sx - 20, sy + 52)], fill=GOLD_DIM, width=7)
    d.line([(sx + 12, sy + 14), (sx + 20, sy + 52)], fill=GOLD_DIM, width=7)
    for r, col in ((30, GOLD_DIM), (24, GOLD), (15, GOLD_LIGHT)):
        d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=col)
    d.ellipse([sx - 6, sy - 6, sx + 6, sy + 6], fill=NAVY)


def fingerprint_big(img):
    d = ImageDraw.Draw(img)
    cx, cy, R = 320, 208, 104
    d.ellipse([cx - R - 12, cy - R - 12, cx + R + 12, cy + R + 12], fill=NAVY_DEEP)
    d.ellipse([cx - R - 4, cy - R - 4, cx + R + 4, cy + R + 4], fill=GOLD_DIM)
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=GOLD)
    ridges = ((54, GOLD_DIM), (42, GOLD), (30, GOLD_LIGHT), (18, GOLD))
    for r, col in ridges:
        d.arc([cx - r, cy - r - 18, cx + r, cy + r - 18], 20, 340, fill=col, width=7)
    d.line([(cx, cy - 62), (cx, cy - 6)], fill=GOLD_DIM, width=7)
    d.line([(cx, cy + 14), (cx, cy + 66)], fill=GOLD_DIM, width=7)
    d.arc([cx - 26, cy - 34, cx + 26, cy + 22], 180, 360, fill=GOLD_DIM, width=7)


def coins(img):
    d = ImageDraw.Draw(img)
    # stacked coins
    base_y = 262
    for row in range(4):
        y = base_y - row * 16
        wdt = 150 - row * 8
        d.rounded_rectangle([320 - wdt // 2, y, 320 + wdt // 2, y + 14], radius=7,
                            fill=GOLD if row % 2 == 0 else GOLD_LIGHT,
                            outline=GOLD_DIM, width=2)
    # standing coin with currency mark
    gold_disc(img, 320, 172, 52)
    d = ImageDraw.Draw(img)
    d.text((320, 172), "$", font=load_font(52), fill=NAVY, anchor="mm")
    # floating small coins
    for cx, cy in ((210, 140), (432, 150)):
        d.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=GOLD_LIGHT,
                  outline=GOLD_DIM, width=3)
        d.text((cx, cy), "$", font=load_font(22), fill=NAVY, anchor="mm")


def cap_grad(img):
    d = ImageDraw.Draw(img)
    # graduation cap: board + base
    bx, by = 320, 158
    d.polygon([(bx, by - 34), (bx + 120, by + 6), (bx, by + 46), (bx - 120, by + 6)],
              fill=NAVY_DEEP)
    d.polygon([(bx, by - 26), (bx + 104, by + 6), (bx, by + 38), (bx - 104, by + 6)],
              fill=NAVY)
    # cap body under the board
    d.pieslice([bx - 66, by + 4, bx + 66, by + 92], 180, 360, fill=NAVY)
    d.rectangle([bx - 66, by + 48, bx + 66, by + 60], fill=NAVY)
    # tassel
    d.line([(bx, by + 2), (bx, by - 20)], fill=GOLD, width=3)
    d.line([(bx, by - 20), (bx + 78, by + 12)], fill=GOLD, width=3)
    d.line([(bx + 78, by + 12), (bx + 78, by + 52)], fill=GOLD, width=4)
    d.rounded_rectangle([bx + 72, by + 52, bx + 84, by + 68], radius=4, fill=GOLD)
    # rolled diploma
    d.rounded_rectangle([bx - 118, by + 76, bx + 118, by + 92], radius=8, fill=WHITE,
                        outline=CLOUD_DIM, width=2)
    d.line([(bx - 108, by + 84), (bx + 108, by + 84)], fill=GOLD, width=3)


def briefcase(img):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = 212, 158, 428, 292
    d.rounded_rectangle([x0 - 6, y0 - 6, x1 + 6, y1 + 6], radius=18, fill=NAVY_DEEP)
    d.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=GOLD)
    d.rounded_rectangle([x0, y0, x1, y0 + 34], radius=14, fill=GOLD_LIGHT)
    d.rectangle([x0, y0 + 22, x1, y0 + 34], fill=GOLD_LIGHT)
    # handle
    d.rounded_rectangle([288, 130, 352, 162], radius=10, outline=NAVY_DEEP, width=8)
    d.rectangle([288, 150, 352, 164], fill=GOLD_LIGHT)
    # clasp
    d.rounded_rectangle([304, 176, 336, 196], radius=5, fill=NAVY)
    # document peeking
    d.rounded_rectangle([236, 120, 286, 168], radius=6, fill=WHITE, outline=CLOUD_DIM, width=2)
    for i in range(3):
        d.line([(244, 130 + i * 10), (278, 130 + i * 10)], fill=CLOUD_DIM, width=3)


def car(img):
    d = ImageDraw.Draw(img)
    # body
    d.rounded_rectangle([190, 208, 452, 268], radius=22, fill=GOLD)
    d.rounded_rectangle([190, 208, 452, 232], radius=12, fill=GOLD_LIGHT)
    # cabin
    d.polygon([(238, 210), (272, 162), (388, 162), (416, 210)], fill=NAVY)
    d.polygon([(252, 206), (278, 170), (322, 170), (322, 206)], fill=CLOUD)
    d.polygon([(334, 206), (334, 170), (380, 170), (402, 206)], fill=CLOUD)
    # lights
    d.ellipse([430, 226, 452, 244], fill=GOLD_LIGHT)
    d.ellipse([192, 228, 208, 244], fill=(255, 120, 90))
    # wheels
    for wx in (250, 396):
        d.ellipse([wx - 30, 244, wx + 30, 304], fill=NAVY_DEEP)
        d.ellipse([wx - 14, 260, wx + 14, 288], fill=CLOUD)
    # road
    d.rectangle([150, 292, 492, 300], fill=NAVY_DEEP)
    for x in range(160, 480, 34):
        d.rectangle([x, 294, x + 16, 298], fill=GOLD_DIM)


def heart_hands(img):
    d = ImageDraw.Draw(img)
    cx, cy = 320, 196
    # big heart
    d.ellipse([cx - 84, cy - 62, cx + 4, cy + 26], fill=GOLD)
    d.ellipse([cx - 4, cy - 62, cx + 84, cy + 26], fill=GOLD)
    d.polygon([(cx - 82, cy - 2), (cx + 82, cy - 2), (cx, cy + 88)], fill=GOLD)
    d.ellipse([cx - 62, cy - 46, cx - 26, cy - 10], fill=GOLD_LIGHT)
    # supporting hands (two arcs)
    d.arc([cx - 150, cy + 6, cx - 6, cy + 130], 180, 330, fill=WHITE, width=16)
    d.arc([cx + 6, cy + 6, cx + 150, cy + 130], 210, 360, fill=WHITE, width=16)


# ---- 8 Core service scenes ----------------------------------------------------
def scene_citizen(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    water(img, 330, seed)
    skyline(img, seed + 2, 330)
    d = ImageDraw.Draw(img)
    # three citizens busts
    for i, (cx, r) in enumerate(((250, 46), (330, 56), (414, 44))):
        cy = 262 if i == 1 else 272
        col = (GOLD, GOLD_LIGHT, GOLD_DIM)[i]
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)             # head
        d.pieslice([cx - r - 16, cy + r - 14, cx + r + 16, cy + r + 66], 180, 360,
                   fill=(GOLD_DIM, GOLD, GOLD_DIM)[i])                    # body
    ribbons(img, seed, 132)
    lamp_posts(img, 330)
    return img


def scene_certificates(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    ribbons(img, seed, 120)
    certificate(img)
    d = ImageDraw.Draw(img)
    # floating mini certificates
    for cx, cy in ((120, 150), (528, 170)):
        d.rounded_rectangle([cx - 34, cy - 24, cx + 34, cy + 24], radius=8, fill=WHITE)
        d.rectangle([cx - 26, cy - 14, cx + 10, cy - 10], fill=CLOUD_DIM)
        d.ellipse([cx + 14, cy + 4, cx + 28, cy + 18], fill=GOLD)
    # desk line
    d.rectangle([140, 320, 500, 328], fill=NAVY_DEEP)
    d.rectangle([140, 328, 500, 331], fill=GOLD_DIM)
    return img


def scene_identity(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    ribbons(img, seed, 110)
    d = ImageDraw.Draw(img)
    # background card tilted illusion: simple offset card
    card(img)
    # orbiting scan arcs
    cx, cy = 320, 207
    for r in (150, 172):
        d.arc([cx - r, cy - r, cx + r, cy + r], 300, 60, fill=GOLD, width=3)
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=NAVY_DEEP)
    # floating check chips
    for cx, cy in ((150, 250), (496, 240)):
        d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=GOLD)
        d.line([(cx - 8, cy), (cx - 2, cy + 8)], fill=NAVY, width=4)
        d.line([(cx - 2, cy + 8), (cx + 10, cy - 8)], fill=NAVY, width=4)
    return img


def scene_tax(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    coins(img)
    d = ImageDraw.Draw(img)
    # classical treasury building
    bx0, by0, bx1, by1 = 150, 226, 490, 320
    d.rectangle([bx0, by0, bx1, by1], fill=NAVY_DEEP)
    d.rectangle([bx0, by0, bx1, by0 + 10], fill=GOLD_DIM)
    d.polygon([(bx0 - 14, by0), (bx1 + 14, by0), (bx1 + 14, by0 - 12), (bx0 - 14, by0 - 12)],
              fill=NAVY)
    d.polygon([(320, by0 - 66), (bx1 + 26, by0 - 12), (bx0 - 26, by0 - 12)], fill=NAVY)
    for i in range(5):
        x = bx0 + 22 + i * 68
        d.rectangle([x, by0 + 18, x + 16, by1 - 6], fill=NAVY_SOFT)
    d.text((320, by1 - 26), "TAX", font=load_font(22), fill=GOLD, anchor="mm")
    water(img, 330, seed)
    return img


def scene_education(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    ribbons(img, seed, 108)
    cap_grad(img)
    d = ImageDraw.Draw(img)
    # open book below
    bx, by = 320, 312
    d.polygon([(bx, by - 6), (bx - 130, by - 26), (bx - 130, by + 22), (bx, by + 38)], fill=WHITE)
    d.polygon([(bx, by - 6), (bx + 130, by - 26), (bx + 130, by + 22), (bx, by + 38)], fill=CLOUD)
    d.line([(bx, by - 6), (bx, by + 38)], fill=CLOUD_DIM, width=3)
    for i in range(3):
        d.line([(bx - 112, by - 14 + i * 10), (bx - 16, by - 2 + i * 10)], fill=CLOUD_DIM, width=2)
        d.line([(bx + 16, by - 2 + i * 10), (bx + 112, by - 14 + i * 10)], fill=CLOUD_DIM, width=2)
    return img


def scene_employment(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    water(img, 336, seed)
    skyline(img, seed + 2, 336, lit=True)
    briefcase(img)
    d = ImageDraw.Draw(img)
    # rising career steps
    for i in range(3):
        x0 = 150 + i * 44
        d.rectangle([x0, 300 - i * 22, x0 + 40, 336 - i * 22], fill=NAVY_SOFT)
        d.rectangle([x0, 300 - i * 22, x0 + 40, 304 - i * 22], fill=GOLD)
    # up arrow
    d.polygon([(452, 210), (484, 246), (466, 246), (466, 290), (438, 290), (438, 246),
               (420, 246)], fill=GOLD)
    lamp_posts(img, 336, xs=(96, 560))
    return img


def scene_transport(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    skyline(img, seed + 2, 250, lit=True)
    d = ImageDraw.Draw(img)
    # road with dashes
    d.rectangle([0, 250, W, H], fill=NAVY_DEEP)
    for y in range(262, H, 26):
        x = (y * 3) % W
        d.line([(x, y), (x + 26, y)], fill=GOLD_DIM, width=3)
    d.rectangle([0, 250, W, 254], fill=GOLD_DIM)
    car(img)
    # road sign
    d.rectangle([88, 214, 94, 288], fill=NAVY)
    d.rounded_rectangle([58, 172, 124, 218], radius=8, fill=GOLD)
    d.line([(72, 195), (110, 195)], fill=NAVY, width=5)
    d.polygon([(104, 186), (118, 195), (104, 204)], fill=NAVY)
    return img


def scene_welfare(seed):
    img = base_canvas(random.Random(seed))
    clouds(img, random.Random(seed + 1))
    ribbons(img, seed, 104)
    heart_hands(img)
    d = ImageDraw.Draw(img)
    # small family silhouettes under heart
    for i, (cx, r) in enumerate(((282, 30), (330, 40), (374, 26))):
        cy = 330
        d.ellipse([cx - r, cy - r - 6, cx + r, cy + r - 6], fill=WHITE)
        d.pieslice([cx - r - 10, cy + r - 12, cx + r + 10, cy + r + 40], 180, 360, fill=WHITE)
    d.rectangle([150, 366, 490, 374], fill=NAVY_DEEP)
    d.rectangle([150, 374, 490, 377], fill=GOLD_DIM)
    return img


# ---- 6 Department scenes --------------------------------------------------------
def dept_common(seed, title):
    img = base_canvas(random.Random(seed))
    water(img, 348, seed)
    skyline(img, seed + 2, 348)
    d = ImageDraw.Draw(img)
    d.text((320, 66), title.upper(), font=load_font(20), fill=GOLD, anchor="mm")
    d.rectangle([260, 82, 380, 85], fill=GOLD_DIM)
    return img


def scene_revenue(seed):
    img = dept_common(seed, "Revenue & Treasury")
    coins(img)
    d = ImageDraw.Draw(img)
    # safe with dial
    x0, y0, x1, y1 = 214, 176, 426, 310
    d.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=NAVY)
    d.rounded_rectangle([x0 + 8, y0 + 8, x1 - 8, y1 - 8], radius=10, outline=GOLD_DIM, width=3)
    d.ellipse([292, 208, 348, 264], fill=NAVY_DEEP, outline=GOLD, width=5)
    d.line([(320, 236), (320, 214)], fill=GOLD, width=5)
    d.line([(320, 236), (338, 248)], fill=GOLD, width=5)
    d.rounded_rectangle([x1 - 44, y0 + 40, x1 - 20, y1 - 40], radius=6, fill=GOLD_DIM)
    return img


def scene_education_dept(seed):
    img = dept_common(seed, "Education & Skills")
    d = ImageDraw.Draw(img)
    # schoolhouse with flag
    bx0, by0, bx1, by1 = 218, 214, 422, 316
    d.rectangle([bx0, by0, bx1, by1], fill=NAVY)
    d.polygon([(320, by0 - 54), (bx1 + 18, by0), (bx0 - 18, by0)], fill=NAVY_DEEP)
    d.rectangle([bx0, by0, bx1, by0 + 8], fill=GOLD_DIM)
    d.rounded_rectangle([300, 254, 340, 316], radius=4, fill=GOLD)      # door
    d.ellipse([308, 282, 316, 290], fill=NAVY)
    for dx in (244, 376):
        d.rectangle([dx, 240, dx + 32, 272], fill=CLOUD, outline=NAVY_DEEP, width=3)
        d.line([(dx + 16, 240), (dx + 16, 272)], fill=NAVY_DEEP, width=3)
        d.line([(dx, 256), (dx + 32, 256)], fill=NAVY_DEEP, width=3)
    d.line([(320, by0 - 54), (320, by0 - 96)], fill=CLOUD_DIM, width=4)
    d.polygon([(320, by0 - 96), (356, by0 - 88), (320, by0 - 78)], fill=GOLD)
    return img


def scene_transport_dept(seed):
    img = base_canvas(random.Random(seed))
    d = ImageDraw.Draw(img)
    # elevated transit track
    d.rectangle([0, 250, W, 262], fill=NAVY_SOFT)
    for x in range(30, W, 90):
        d.rectangle([x, 262, x + 14, 320], fill=NAVY)
    d.rectangle([0, 320, W, H], fill=NAVY_DEEP)
    skyline(img, seed + 2, 250, lit=True, dome=False)
    # monorail train on track
    d.rounded_rectangle([170, 196, 470, 252], radius=18, fill=GOLD)
    d.rounded_rectangle([170, 196, 470, 216], radius=12, fill=GOLD_LIGHT)
    for i in range(4):
        d.rounded_rectangle([192 + i * 66, 224, 240 + i * 66, 246], radius=5, fill=NAVY)
    d.polygon([(470, 200), (502, 224), (470, 248)], fill=GOLD_DIM)
    clouds(img, random.Random(seed + 1))
    # signal post
    d.line([(560, 320), (560, 250)], fill=NAVY, width=5)
    d.ellipse([552, 232, 568, 248], fill=GOLD)
    return img


def scene_health(seed):
    img = dept_common(seed, "Health & Community Care")
    d = ImageDraw.Draw(img)
    # medical cross building
    x0, y0, x1, y1 = 236, 190, 404, 320
    d.rounded_rectangle([x0, y0, x1, y1], radius=12, fill=NAVY)
    d.rectangle([x0, y0, x1, y0 + 10], fill=GOLD_DIM)
    for r, col in ((56, GOLD_LIGHT), (44, GOLD), (30, NAVY)):
        d.ellipse([320 - r, 148 - r, 320 + r, 148 + r], fill=col)
    d.rectangle([310, 122, 330, 174], fill=GOLD)
    d.rectangle([294, 138, 346, 158], fill=GOLD)
    # windows
    for i in range(2):
        for j in range(2):
            d.rectangle([x0 + 26 + i * 82, y0 + 34 + j * 52,
                         x0 + 58 + i * 82, y0 + 62 + j * 52], fill=CLOUD)
    d.rounded_rectangle([300, 276, 340, 320], radius=4, fill=GOLD)
    # heartbeat line
    pts = [(150, 250), (176, 250), (188, 226), (202, 274), (214, 238), (224, 250),
           (420, 250), (436, 226), (450, 268), (462, 250), (490, 250)]
    d.line(pts, fill=GOLD, width=4, joint="curve")
    return img


def scene_municipal(seed):
    img = dept_common(seed, "Municipal Services")
    d = ImageDraw.Draw(img)
    # city hall with clock tower
    d.rectangle([250, 216, 470, 320], fill=NAVY)
    d.rectangle([250, 216, 470, 224], fill=GOLD_DIM)
    d.rectangle([214, 148, 262, 320], fill=NAVY_DEEP)
    d.pieslice([206, 128, 270, 172], 180, 360, fill=GOLD_DIM)
    d.ellipse([222, 164, 254, 196], fill=WHITE, outline=GOLD, width=4)
    d.line([(238, 180), (238, 172)], fill=NAVY, width=3)
    d.line([(238, 180), (246, 184)], fill=NAVY, width=3)
    d.polygon([(214, 148), (238, 120), (262, 148)], fill=GOLD)
    for i in range(3):
        x = 288 + i * 56
        d.rectangle([x, 244, x + 28, 276], fill=CLOUD)
        d.line([(x + 14, 244), (x + 14, 276)], fill=NAVY_DEEP, width=3)
        d.line([(x, 260), (x + 28, 260)], fill=NAVY_DEEP, width=3)
    d.rounded_rectangle([344, 288, 386, 320], radius=4, fill=GOLD)
    # tree
    d.rectangle([120, 288, 132, 320], fill=NAVY)
    d.ellipse([96, 244, 156, 296], fill=(46, 96, 74))
    return img


def scene_welfare_dept(seed):
    img = dept_common(seed, "Social Welfare")
    d = ImageDraw.Draw(img)
    # shield with heart
    cx, top = 320, 138
    d.polygon([(cx - 88, top), (cx + 88, top), (cx + 88, top + 78), (cx, top + 150),
               (cx - 88, top + 78)], fill=NAVY_DEEP)
    d.polygon([(cx - 74, top + 12), (cx + 74, top + 12), (cx + 74, top + 72), (cx, top + 132),
               (cx - 74, top + 72)], fill=NAVY)
    hx, hy = cx, top + 62
    d.ellipse([hx - 40, hy - 32, hx + 2, hy + 12], fill=GOLD)
    d.ellipse([hx - 2, hy - 32, hx + 40, hy + 12], fill=GOLD)
    d.polygon([(hx - 38, hy + 4), (hx + 38, hy + 4), (hx, hy + 52)], fill=GOLD)
    # helping hands arcs
    d.arc([cx - 140, top + 90, cx - 20, top + 170], 180, 320, fill=WHITE, width=12)
    d.arc([cx + 20, top + 90, cx + 140, top + 170], 220, 360, fill=WHITE, width=12)
    # family chips
    for cxx, r in ((238, 22), (402, 22)):
        d.ellipse([cxx - r, 288 - r, cxx + r, 288 + r], fill=GOLD_LIGHT)
        d.pieslice([cxx - r - 8, 288 + r - 10, cxx + r + 8, 288 + r + 34], 180, 360,
                   fill=GOLD_LIGHT)
    return img


# ---- Output ---------------------------------------------------------------------
SERVICES = [
    ("service-card-citizen.webp", scene_citizen),
    ("service-card-certificates.webp", scene_certificates),
    ("service-card-identity.webp", scene_identity),
    ("service-card-tax.webp", scene_tax),
    ("service-card-education.webp", scene_education),
    ("service-card-employment.webp", scene_employment),
    ("service-card-transport.webp", scene_transport),
    ("service-card-welfare.webp", scene_welfare),
]

DEPARTMENTS = [
    ("dept-revenue.webp", scene_revenue),
    ("dept-education.webp", scene_education_dept),
    ("dept-transport.webp", scene_transport_dept),
    ("dept-health.webp", scene_health),
    ("dept-municipal.webp", scene_municipal),
    ("dept-welfare.webp", scene_welfare_dept),
]


def save_webp(img, path):
    img.save(path, "WEBP", quality=78, method=6)


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "images")
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    for group, items in (("SERVICE", SERVICES), ("DEPARTMENT", DEPARTMENTS)):
        for i, (name, fn) in enumerate(items):
            seed = SEED + i * 101 + (0 if group == "SERVICE" else 5000)
            img = fn(seed)
            path = os.path.join(out_dir, name)
            save_webp(img, path)
            size = os.path.getsize(path)
            flag = "OK " if size < 90 * 1024 else "BIG"
            print(f"[{flag}] {group:9s} {name:34s} {size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()
