#!/usr/bin/env python3
"""
DOR-158B — MTA2026 Master Flyer generator (design asset only; not app code).
Authors vector SVG (crisp real text) per the DOR-158A brief, rasterizes to PNG
via cairosvg. Three formats share one design system.
"""
import base64, os, cairosvg

OUT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(OUT, "..", ".."))
LOGO_PATH = os.path.join(ROOT, "public", "hbg-logo.svg")

# ── Premium MTA site visual system (DOR-160C) ───────────────────
NAVY = "#050816"; DEEP_BLUE = "#07142B"; ROYAL = "#0B1F4D"
INDIGO = "#19104A"; VIOLET = "#442A85"; SOFT_VIOLET = "#7E73FF"
GOLD = "#D7B767"; GOLD_LT = "#F3DF9B"; LILAC = "#C8B7FF"
WHITE = "#FFFFFF"; OFFWHITE = "#F4F7FF"; BLUE_DEEP = "#030615"

KICKER = "MIGHTY TURN AROUND ASSEMBLY   ·   PRESENTS"
TITLE  = "MTA 2026"
HERO   = "EXPLOITS"
SCRIPT1 = "“The people that do know their God"
SCRIPT2 = "shall be strong, and do exploits.”"
ATTR   = "DANIEL 11:32  ·  KJV"
CAMP1  = "21 DAYS OF FASTING &amp; PRAYER"
CAMP2  = "STARTS  ·  AUGUST 13, 2026"
CTA    = "REGISTER NOW"
URL    = "mta.heartbeatofgod.ca"
FOOT   = "ALL NATIONS  ·  ONE ALTAR"
HANDLE = "@heartbeatofgod"

SERIF = "Didot, 'Bodoni 72', Georgia, serif"
SERIF_B = "Baskerville, Georgia, serif"
SANS  = "Futura, 'Helvetica Neue', Helvetica, sans-serif"
ITAL  = "Georgia, 'Times New Roman', serif"

def esc(s): return s

def txt(x, y, s, size, fill, family=SANS, weight="normal", spacing=0,
        anchor="middle", style="normal", opacity=1.0):
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    fs = f' font-style="{style}"' if style != "normal" else ""
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
            f'{ls}{fs} opacity="{opacity}">{s}</text>')

def hero_3d(cx, y, size):
    """Premium dimensional gold EXPLOITS: deep blue extrude + gold face + silver highlight."""
    layers = []
    for d in range(14, 0, -2):  # extrude depth
        layers.append(f'<text x="{cx}" y="{y+d}" font-family="{SANS}" '
                      f'font-size="{size}" font-weight="bold" fill="{BLUE_DEEP}" '
                      f'text-anchor="middle" letter-spacing="6">{HERO}</text>')
    face = (f'<text x="{cx}" y="{y}" font-family="{SANS}" font-size="{size}" '
            f'font-weight="bold" fill="url(#goldgrad)" text-anchor="middle" '
            f'letter-spacing="6">{HERO}</text>')
    hi = (f'<text x="{cx}" y="{y-2}" font-family="{SANS}" font-size="{size}" '
          f'font-weight="bold" fill="{GOLD_LT}" text-anchor="middle" '
          f'letter-spacing="6" opacity="0.35">{HERO}</text>')
    return "".join(layers) + face + hi

def logo_data_uri():
    with open(LOGO_PATH, "rb") as f:
        return "data:image/svg+xml;base64," + base64.b64encode(f.read()).decode("ascii")

LOGO_HREF = logo_data_uri()

def official_logo(cx, cy, width):
    height = width * 520 / 920
    x = cx - width / 2
    y = cy - height / 2
    return (f'<ellipse cx="{cx}" cy="{cy+4}" rx="{width*0.55}" ry="{height*0.44}" '
            f'fill="{GOLD_LT}" opacity="0.12" filter="url(#soft)"/>'
            f'<image href="{LOGO_HREF}" x="{x}" y="{y}" width="{width}" height="{height}" '
            f'preserveAspectRatio="xMidYMid meet"/>')

def ribbon(path, grad, w):
    return (f'<path d="{path}" fill="none" stroke="url(#{grad})" '
            f'stroke-width="{w}" stroke-linecap="round" opacity="0.42" '
            f'filter="url(#soft)"/>')

def defs(W, H):
    return f'''<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{NAVY}"/>
    <stop offset="0.42" stop-color="{ROYAL}"/>
    <stop offset="1" stop-color="{INDIGO}"/>
  </linearGradient>
  <radialGradient id="halo" cx="0.5" cy="0.40" r="0.55">
    <stop offset="0" stop-color="{SOFT_VIOLET}" stop-opacity="0.36"/>
    <stop offset="0.42" stop-color="{GOLD}" stop-opacity="0.14"/>
    <stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
  </radialGradient>
  <linearGradient id="goldgrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{GOLD_LT}"/>
    <stop offset="0.5" stop-color="{GOLD}"/>
    <stop offset="1" stop-color="#B89139"/>
  </linearGradient>
  <linearGradient id="beamBlue" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{SOFT_VIOLET}" stop-opacity="0"/><stop offset="0.5" stop-color="{LILAC}" stop-opacity="0.52"/><stop offset="1" stop-color="{SOFT_VIOLET}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="beamGold" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{GOLD}" stop-opacity="0"/><stop offset="0.5" stop-color="{GOLD_LT}" stop-opacity="0.40"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#C8B7FF" stop-opacity="0.04"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="7"/>
  </filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="22"/>
  </filter>
</defs>'''

def beams(cx, cy):
    out = []
    import math
    for i, ang in enumerate(range(-44, 45, 15)):
        r = math.radians(ang)
        x2 = cx + 1500*math.sin(r); y2 = cy - 1500*math.cos(r)
        x1 = cx - 40*math.cos(r); x1b = cx + 40*math.cos(r)
        out.append(f'<polygon points="{x1},{cy} {x1b},{cy} {x2},{y2}" '
                   f'fill="{GOLD_LT}" opacity="0.05" filter="url(#soft)"/>')
    return "".join(out)

def monument(cx, base_y, scale):
    """Subtle architectural depth borrowed from the production website mood."""
    w = 740 * scale
    h = 210 * scale
    x = cx - w / 2
    y = base_y - h
    cols = []
    for i in range(6):
        c_x = x + w * (0.18 + i * 0.128)
        cols.append(f'<rect x="{c_x}" y="{y+62*scale}" width="{26*scale}" height="{126*scale}" rx="{8*scale}" fill="url(#silver)" opacity="0.36"/>')
    return (
        f'<g opacity="0.42" filter="url(#soft)">'
        f'<path d="M{x+40*scale} {y+58*scale} L{cx} {y} L{x+w-40*scale} {y+58*scale} Z" fill="url(#silver)"/>'
        f'<rect x="{x+80*scale}" y="{y+44*scale}" width="{w-160*scale}" height="{24*scale}" rx="{12*scale}" fill="{LILAC}" opacity="0.22"/>'
        + "".join(cols) +
        f'<rect x="{x+55*scale}" y="{base_y-20*scale}" width="{w-110*scale}" height="{28*scale}" rx="{14*scale}" fill="{GOLD}" opacity="0.14"/>'
        f'</g>'
    )

def worship_silhouette(W, H):
    base = H * 0.92
    people = []
    for i, x in enumerate([0.12, 0.2, 0.78, 0.88]):
        cx = W * x
        s = 1.15 + (i % 2) * 0.18
        people.append(
            f'<g opacity="0.10" fill="{OFFWHITE}" filter="url(#soft)">'
            f'<circle cx="{cx}" cy="{base-46*s}" r="{9*s}"/>'
            f'<path d="M{cx-11*s} {base-34*s} C{cx-24*s} {base-2*s} {cx+24*s} {base-2*s} {cx+11*s} {base-34*s} Z"/>'
            f'<path d="M{cx-10*s} {base-32*s} C{cx-34*s} {base-70*s} {cx-47*s} {base-95*s} {cx-38*s} {base-101*s}" stroke="{OFFWHITE}" stroke-width="{5*s}" fill="none" stroke-linecap="round"/>'
            f'<path d="M{cx+10*s} {base-32*s} C{cx+34*s} {base-74*s} {cx+46*s} {base-96*s} {cx+39*s} {base-104*s}" stroke="{OFFWHITE}" stroke-width="{5*s}" fill="none" stroke-linecap="round"/>'
            f'</g>'
        )
    return "".join(people)

def build(fmt, W, H, L):
    cx = W/2
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append(defs(W, H))
    s.append(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    # god-ray halo + beams centered on hero
    hy = L['hero']
    s.append(f'<ellipse cx="{cx}" cy="{hy-58}" rx="{W*0.72}" ry="{W*0.48}" fill="url(#halo)" filter="url(#glow)"/>')
    s.append(beams(cx, hy-40))
    s.append(monument(cx, hy + L.get('monument_offset', 70), L.get('monument_scale', 0.95)))
    # cinematic light-ribbons arcing behind the hero band
    by = hy - 110
    s.append(ribbon(f"M {-60} {by+40} C {W*0.3} {by-120}, {W*0.7} {by+150}, {W+60} {by-30}", "beamBlue", 30))
    s.append(ribbon(f"M {-60} {by+118} C {W*0.35} {by+8}, {W*0.65} {by+218}, {W+60} {by+68}", "beamGold", 22))
    s.append(worship_silhouette(W, H))
    # Official HBG logo lockup.
    ly = L['lockup']
    s.append(official_logo(cx, ly, L['logo_w']))
    # kicker
    s.append(txt(cx, L['kicker'], KICKER, L['kicker_sz'], LILAC, SANS, "normal", 4))
    # title MTA 2026
    s.append(txt(cx, L['title'], TITLE, L['title_sz'], OFFWHITE, SERIF_B, "bold", 12))
    # HERO 3D
    s.append(hero_3d(cx, L['hero'], L['hero_sz']))
    # scripture (italic serif)
    s.append(txt(cx, L['scr1'], SCRIPT1, L['scr_sz'], OFFWHITE, ITAL, "normal", 0, "middle", "italic"))
    s.append(txt(cx, L['scr2'], SCRIPT2, L['scr_sz'], OFFWHITE, ITAL, "normal", 0, "middle", "italic"))
    s.append(txt(cx, L['attr'], ATTR, L['attr_sz'], GOLD, SANS, "bold", 5))
    # campaign glass panel
    pw = W*0.82; px = (W-pw)/2; pcy = L['camp_cy']; ph = L['camp_h']
    s.append(f'<rect x="{px}" y="{pcy-ph/2}" width="{pw}" height="{ph}" rx="18" '
             f'fill="{WHITE}" fill-opacity="0.05" stroke="{GOLD}" stroke-opacity="0.55" stroke-width="1.5"/>')
    s.append(txt(cx, L['camp1'], CAMP1, L['camp1_sz'], WHITE, SANS, "bold", 4))
    s.append(txt(cx, L['camp2'], CAMP2, L['date_sz'], GOLD_LT, SERIF_B, "bold", 2))
    # CTA pill
    bw = W*0.5; bx = (W-bw)/2; bcy = L['cta_cy']; bh = L['cta_h']
    s.append(f'<rect x="{bx}" y="{bcy-bh/2}" width="{bw}" height="{bh}" rx="{bh/2}" fill="url(#goldgrad)"/>')
    s.append(txt(cx, bcy+L['cta_sz']*0.35, CTA, L['cta_sz'], DEEP_BLUE, SANS, "bold", 3))
    s.append(txt(cx, L['url'], URL, L['url_sz'], WHITE, SANS, "normal", 2))
    # footer
    if 'foot' in L:
        s.append(txt(cx, L['foot'], FOOT + "      " + HANDLE, L['foot_sz'], LILAC, SANS, "normal", 3))
    # vignette
    s.append(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')
    s.append('</svg>')
    return "".join(s)

# ── Per-format layouts (loudness: HERO > date > title > CTA > scripture) ──
PORTRAIT = dict(lockup=92, logo_w=164, kicker=178, kicker_sz=24,
    title=300, title_sz=78, hero=470, hero_sz=192, scr_sz=34,
    scr1=600, scr2=648, attr=712, attr_sz=24,
    camp_cy=852, camp_h=132, camp1=832, camp1_sz=34, camp2=900, date_sz=60,
    cta_cy=1066, cta_h=92, cta_sz=40, url=1158, url_sz=30,
    foot=1290, foot_sz=20)
SQUARE = dict(lockup=86, logo_w=154, kicker=158, kicker_sz=22,
    title=256, title_sz=66, hero=398, hero_sz=168, scr_sz=30,
    scr1=510, scr2=552, attr=606, attr_sz=22,
    camp_cy=724, camp_h=120, camp1=706, camp1_sz=30, camp2=766, date_sz=54,
    cta_cy=908, cta_h=84, cta_sz=36, url=988, url_sz=27)
STORY = dict(lockup=250, logo_w=178, kicker=350, kicker_sz=25,
    title=530, title_sz=82, hero=742, hero_sz=192, scr_sz=37,
    scr1=905, scr2=960, attr=1032, attr_sz=26,
    camp_cy=1200, camp_h=150, camp1=1178, camp1_sz=37, camp2=1254, date_sz=60,
    cta_cy=1452, cta_h=104, cta_sz=46, url=1556, url_sz=34,
    foot=1640, foot_sz=23)

JOBS = [("portrait", 1080, 1350, PORTRAIT),
        ("square",   1080, 1080, SQUARE),
        ("story",    1080, 1920, STORY)]

for name, W, H, L in JOBS:
    svg = build(name, W, H, L)
    svgp = os.path.join(OUT, f"mta2026-flyer-{name}-{W}x{H}.svg")
    pngp = os.path.join(OUT, f"mta2026-flyer-{name}-{W}x{H}.png")
    with open(svgp, "w") as f: f.write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=pngp, output_width=W, output_height=H)
    print(f"{name}: {svgp}")
    print(f"{name}: {pngp}")
print("done")
