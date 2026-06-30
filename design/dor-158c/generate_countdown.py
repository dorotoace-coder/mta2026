#!/usr/bin/env python3
"""
DOR-158C — MTA2026 Countdown Promo Variants (design asset only; not app code).
Same design system as DOR-158B. 8 day-variants x 2 formats (square + story).
EXPLOITS stays the campaign identity; each day adds a badge + headline.
"""
import os, math, cairosvg

OUT = os.path.dirname(os.path.abspath(__file__))

PLUM_TOP="#0C0220"; PURPLE_MID="#2A0A52"; PURPLE="#1A0533"
GOLD="#C9972A"; GOLD_LT="#E8C96A"; LILAC="#B88FC7"
WHITE="#FFFFFF"; OFFWHITE="#F3E9C9"; PLUM_DEEP="#070114"

SANS="Futura, 'Helvetica Neue', Helvetica, sans-serif"
SERIF_B="Baskerville, Georgia, serif"
ITAL="Georgia, 'Times New Roman', serif"

URL="mta.heartbeatofgod.ca"; CTA="REGISTER NOW"
CAMP1="21 DAYS OF FASTING &amp; PRAYER"

def txt(x,y,s,size,fill,family=SANS,weight="normal",spacing=0,anchor="middle",style="normal",opacity=1.0):
    ls=f' letter-spacing="{spacing}"' if spacing else ""
    fs=f' font-style="{style}"' if style!="normal" else ""
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{ls}{fs} '
            f'opacity="{opacity}">{s}</text>')

def defs():
    return f'''<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{PLUM_TOP}"/><stop offset="0.5" stop-color="{PURPLE_MID}"/><stop offset="1" stop-color="{PURPLE}"/>
  </linearGradient>
  <radialGradient id="halo" cx="0.5" cy="0.42" r="0.55">
    <stop offset="0" stop-color="{GOLD}" stop-opacity="0.38"/><stop offset="0.4" stop-color="{GOLD}" stop-opacity="0.11"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <linearGradient id="goldgrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{GOLD_LT}"/><stop offset="0.5" stop-color="{GOLD}"/><stop offset="1" stop-color="#9A7320"/>
  </linearGradient>
  <linearGradient id="ng" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F7A3D"/><stop offset="0.5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#1F7A3D"/></linearGradient>
  <linearGradient id="ca" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B33A3A"/><stop offset="0.5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B33A3A"/></linearGradient>
  <linearGradient id="de" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#161616"/><stop offset="0.5" stop-color="#B33A3A"/><stop offset="1" stop-color="{GOLD}"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>'''

def beams(cx,cy):
    out=[]
    for ang in range(-44,45,15):
        r=math.radians(ang); x2=cx+1500*math.sin(r); y2=cy-1500*math.cos(r)
        out.append(f'<polygon points="{cx-40},{cy} {cx+40},{cy} {x2},{y2}" fill="{GOLD_LT}" opacity="0.05" filter="url(#soft)"/>')
    return "".join(out)

def ribbon(path,grad,w,op):
    return f'<path d="{path}" fill="none" stroke="url(#{grad})" stroke-width="{w}" stroke-linecap="round" opacity="{op}" filter="url(#soft)"/>'

def hero3d(cx,y,size):
    out=[f'<text x="{cx}" y="{y+d}" font-family="{SANS}" font-size="{size}" font-weight="bold" fill="{PLUM_DEEP}" text-anchor="middle" letter-spacing="5">EXPLOITS</text>' for d in range(10,0,-2)]
    out.append(f'<text x="{cx}" y="{y}" font-family="{SANS}" font-size="{size}" font-weight="bold" fill="url(#goldgrad)" text-anchor="middle" letter-spacing="5">EXPLOITS</text>')
    out.append(f'<text x="{cx}" y="{y-2}" font-family="{SANS}" font-size="{size}" font-weight="bold" fill="{GOLD_LT}" text-anchor="middle" letter-spacing="5" opacity="0.35">EXPLOITS</text>')
    return "".join(out)

def badge(cx,cy,label,solid,size,padx):
    w=len(label)*size*0.66+padx*2; h=size*2.0
    x=cx-w/2; y=cy-h/2
    if solid:
        rect=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="url(#goldgrad)"/>'
        t=txt(cx,cy+size*0.36,label,size,PURPLE,SANS,"bold",4)
    else:
        rect=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{WHITE}" fill-opacity="0.04" stroke="{GOLD}" stroke-width="2"/>'
        t=txt(cx,cy+size*0.36,label,size,GOLD_LT,SANS,"bold",4)
    return rect+t

def build(W,H,L,day):
    slug,bdg,head,sub,solid,ribboost,date2=day
    cx=W/2; s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',defs()]
    s.append(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    hy=L['hero']
    s.append(f'<ellipse cx="{cx}" cy="{hy-50}" rx="{W*0.7}" ry="{W*0.45}" fill="url(#halo)" filter="url(#glow)"/>')
    s.append(beams(cx,hy-30))
    op=0.62 if ribboost else 0.42
    by=hy-95
    s.append(ribbon(f"M {-60} {by+40} C {W*0.3} {by-120}, {W*0.7} {by+150}, {W+60} {by-30}","ng",30,op))
    s.append(ribbon(f"M {-60} {by+120} C {W*0.35} {by+10}, {W*0.65} {by+220}, {W+60} {by+70}","ca",26,op))
    s.append(ribbon(f"M {-60} {by-10} C {W*0.32} {by+170}, {W*0.7} {by-80}, {W+60} {by+150}","de",22,op))
    # lockup
    ly=L['lockup']
    s.append(f'<circle cx="{cx}" cy="{ly}" r="22" fill="none" stroke="{GOLD}" stroke-width="2.2"/>')
    s.append(txt(cx,ly+8,"HBG",18,GOLD,SERIF_B,"bold",1))
    s.append(txt(cx,ly+44,"HEARTBEAT OF GOD",15,LILAC,SANS,"normal",5))
    # countdown badge
    s.append(badge(cx,L['badge'],bdg,solid,L['badge_sz'],L['badge_pad']))
    # identity: MTA 2026 + EXPLOITS (campaign anchor)
    s.append(txt(cx,L['title'],"MTA 2026",L['title_sz'],OFFWHITE,SERIF_B,"bold",10))
    s.append(hero3d(cx,L['hero'],L['hero_sz']))
    # day headline + sub
    s.append(txt(cx,L['head'],head,L['head_sz'],WHITE,SANS,"bold",2))
    s.append(txt(cx,L['sub'],sub,L['sub_sz'],LILAC,ITAL,"normal",0,"middle","italic"))
    # campaign / date band
    pw=W*0.84; px=(W-pw)/2; pcy=L['camp_cy']; ph=L['camp_h']
    s.append(f'<rect x="{px}" y="{pcy-ph/2}" width="{pw}" height="{ph}" rx="16" fill="{WHITE}" fill-opacity="0.05" stroke="{GOLD}" stroke-opacity="0.5" stroke-width="1.5"/>')
    s.append(txt(cx,L['camp1'],CAMP1,L['camp1_sz'],WHITE,SANS,"bold",4))
    s.append(txt(cx,L['camp2'],date2,L['date_sz'],GOLD_LT,SERIF_B,"bold",2))
    # CTA
    bw=W*0.52; bx=(W-bw)/2; bcy=L['cta_cy']; bh=L['cta_h']
    s.append(f'<rect x="{bx}" y="{bcy-bh/2}" width="{bw}" height="{bh}" rx="{bh/2}" fill="url(#goldgrad)"/>')
    s.append(txt(cx,bcy+L['cta_sz']*0.35,CTA,L['cta_sz'],PURPLE,SANS,"bold",3))
    s.append(txt(cx,L['url'],URL,L['url_sz'],WHITE,SANS,"normal",2))
    s.append(f'<rect width="{W}" height="{H}" fill="url(#vig)"/></svg>')
    return "".join(s)

SQUARE=dict(lockup=70,badge=148,badge_sz=30,badge_pad=34,
    title=250,title_sz=40,hero=350,hero_sz=132,
    head=452,head_sz=46,sub=500,sub_sz=27,
    camp_cy=640,camp_h=104,camp1=624,camp1_sz=26,camp2=678,date_sz=46,
    cta_cy=830,cta_h=82,cta_sz=34,url=908,url_sz=26)
STORY=dict(lockup=250,badge=380,badge_sz=34,badge_pad=40,
    title=560,title_sz=46,hero=690,hero_sz=150,
    head=840,head_sz=54,sub=900,sub_sz=31,
    camp_cy=1110,camp_h=120,camp1=1092,camp1_sz=30,camp2=1152,date_sz=54,
    cta_cy=1380,cta_h=98,cta_sz=42,url=1470,url_sz=31)

# slug, badge, headline, sub, badge_solid, ribbon_boost, date2
DAYS=[
 ("t7-aug06-reveal","7 DAYS TO GO","THE ASSEMBLY IS COMING","Mighty Turn Around Assembly",False,False,"STARTS · AUGUST 13, 2026"),
 ("t6-aug07-the-word","6 DAYS TO GO","KNOW YOUR GOD","“…shall be strong, and do exploits.”",False,False,"STARTS · AUGUST 13, 2026"),
 ("t5-aug08-three-nations","5 DAYS TO GO","THREE NATIONS · ONE ALTAR","Nigeria   ·   Canada   ·   Germany",False,True,"STARTS · AUGUST 13, 2026"),
 ("t4-aug09-why-fast","4 DAYS TO GO","WHY WE FAST","Turn the whole heart to God",False,False,"STARTS · AUGUST 13, 2026"),
 ("t3-aug10-countdown","3 DAYS","THE FIRE IS NEAR","Have you registered yet?",False,False,"STARTS · AUGUST 13, 2026"),
 ("t2-aug11-prepare","2 DAYS TO GO","PREPARE YOUR HEART","Set your face unto the Lord",False,False,"STARTS · AUGUST 13, 2026"),
 ("t1-aug12-we-begin-tomorrow","TOMORROW","WE BEGIN TOMORROW","We gather at the altar tomorrow",True,False,"BEGINS · AUGUST 13, 2026"),
 ("day0-aug13-it-begins","DAY 1 OF 21","IT BEGINS","Set Your Face Unto God · Daniel 9:3",True,False,"21 DAYS BEGIN TODAY"),
]

FMTS=[("square",1080,1080,SQUARE),("story",1080,1920,STORY)]
n=0
for day in DAYS:
    for fname,W,H,L in FMTS:
        svg=build(W,H,L,day)
        base=f"mta2026-countdown-{day[0]}-{fname}-{W}x{H}"
        with open(os.path.join(OUT,base+".svg"),"w") as f: f.write(svg)
        cairosvg.svg2png(bytestring=svg.encode(),write_to=os.path.join(OUT,base+".png"),output_width=W,output_height=H)
        n+=1
print(f"generated {n} assets ({len(DAYS)} days x {len(FMTS)} formats)")
