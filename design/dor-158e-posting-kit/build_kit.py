#!/usr/bin/env python3
"""
DOR-158E — MTA2026 Posting Kit Export (assembles committed 158B/158C/158D into
an admin-ready WhatsApp posting kit). Content/copy + file packaging only.
"""
import os, shutil

KIT = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.dirname(KIT)
MASTER = os.path.join(DESIGN, "dor-158b")
CD = os.path.join(DESIGN, "dor-158c")

URL = "mta.heartbeatofgod.ca"

def w(path, text):
    with open(path, "w") as f:
        f.write(text.strip() + "\n")

# ── Per-day content (folder, source slug, copy) ───────────────────
DAYS = [
{
 "folder":"01-aug-06-t7-reveal", "slug":"t7-aug06-reveal",
 "feed":"""The altar is being prepared. 🔥

MTA 2026 — EXPLOITS is here: the Mighty Turn Around Assembly, and 21 Days of Fasting & Prayer begin August 13.

This is not another meeting. This is the year the people who know their God rise to do exploits.

Take your place now 👉 mta.heartbeatofgod.ca

#MTA2026 #Exploits #MightyTurnAroundAssembly""",
 "status":"The Assembly is coming. MTA 2026 — EXPLOITS. 21 Days begin Aug 13. → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, something holy is on the horizon. MTA 2026 — EXPLOITS, our Mighty Turn Around Assembly, opens with 21 Days of Fasting & Prayer from August 13. Don't watch this season — enter it. Register today: mta.heartbeatofgod.ca""",
},
{
 "folder":"02-aug-07-t6-the-word", "slug":"t6-aug07-the-word",
 "feed":""""The people that do know their God shall be strong, and do exploits." — Daniel 11:32

Exploits don't begin with effort. They begin with intimacy.
Before the fast begins, settle one thing: know your God.

MTA 2026 — EXPLOITS · 21 Days begin August 13 → mta.heartbeatofgod.ca

#MTA2026 #Exploits #KnowYourGod #Daniel1132""",
 "status":"Know your God — then do exploits. (Daniel 11:32) · MTA 2026 → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, strength for exploits is born in the secret place. "They that know their God shall be strong, and do exploits" (Daniel 11:32). Come and know Him deeper in these 21 days. Begins August 13 — mta.heartbeatofgod.ca""",
},
{
 "folder":"03-aug-08-t5-three-nations", "slug":"t5-aug08-three-nations",
 "feed":"""🇳🇬 🇨🇦 🇩🇪 From Nigeria to Canada to Germany — one family, one altar, one God.

MTA 2026 — EXPLOITS gathers believers across nations for 21 Days of Fasting & Prayer from August 13.

Distance is no barrier to the fire. Stand with us 👉 mta.heartbeatofgod.ca

#MTA2026 #Exploits #ThreeNationsOneAltar""",
 "status":"Three nations. One altar. One God. MTA 2026 — begins Aug 13 → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, you will not fast alone. From Nigeria, Canada and Germany, the family is gathering at one altar for MTA 2026. 21 Days begin August 13. Add your voice to the cry — mta.heartbeatofgod.ca""",
},
{
 "folder":"04-aug-09-t4-why-fast", "slug":"t4-aug09-why-fast",
 "feed":"""We don't fast to impress God. We fast to turn — fully — to Him.

21 days to quiet the noise, clear the altar, and let the Word reshape the heart.

MTA 2026 — EXPLOITS · Fasting & Prayer begin August 13. Choose the turnaround 👉 mta.heartbeatofgod.ca

#MTA2026 #Exploits #21DaysOfFastingAndPrayer #WhyWeFast""",
 "status":"Why we fast: to turn the whole heart to God. MTA 2026 — Aug 13 → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, the fast is not a performance — it is a return. For 21 days we lay everything down to seek the Lord with all our heart. That is where turnarounds are born. Begins August 13 — mta.heartbeatofgod.ca""",
},
{
 "folder":"05-aug-10-t3-the-fire-is-near", "slug":"t3-aug10-countdown",
 "feed":"""🔥 Three days. The fire is near.

MTA 2026 — EXPLOITS begins August 13 — and the altar is almost set.
One question remains: have you registered?

Don't stand outside the fire 👉 mta.heartbeatofgod.ca

#MTA2026 #Exploits #DoExploits #21DaysOfFastingAndPrayer""",
 "status":"3 days. The fire is near. Have you registered? → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, 3 days to go. The fire of these 21 days is almost here. If you have not yet taken your place, do it now — don't let this season pass you by. mta.heartbeatofgod.ca""",
},
{
 "folder":"06-aug-11-t2-prepare-your-heart", "slug":"t2-aug11-prepare",
 "feed":"""Two days. Prepare your heart.

"And I set my face unto the Lord God, to seek by prayer and supplications, with fasting…" — Daniel 9:3

Begin to still your soul, forgive freely, and set your face toward God.

MTA 2026 — EXPLOITS · begins August 13 → mta.heartbeatofgod.ca

#MTA2026 #Exploits #PrepareYourHeart #Daniel93""",
 "status":"2 days. Prepare your heart. Set your face unto the Lord. → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, 2 days remain. Begin to prepare your heart now — make peace, make room, and set your face toward God. The 21 days start August 13. Take your place: mta.heartbeatofgod.ca""",
},
{
 "folder":"07-aug-12-t1-we-begin-tomorrow", "slug":"t1-aug12-we-begin-tomorrow",
 "feed":"""Tomorrow, we begin. 🦁

MTA 2026 — EXPLOITS: 21 Days of Fasting & Prayer start August 13.
Gather your faith, gather your household — and meet us at the altar.

Not yet registered? There's still room 👉 mta.heartbeatofgod.ca

#MTA2026 #Exploits #WeBeginTomorrow""",
 "status":"We begin TOMORROW. MTA 2026 — 21 Days. Aug 13 → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, tomorrow we begin. 21 Days of Fasting & Prayer open August 13 — this is our turnaround season. Come ready, come expectant. If you haven't registered, do it tonight: mta.heartbeatofgod.ca""",
},
{
 "folder":"08-aug-13-day0-it-begins", "slug":"day0-aug13-it-begins",
 "feed":"""IT BEGINS. 🔥 Day 1 of 21.

Today's theme — "Set Your Face Unto God" (Daniel 9:3).
The first victory of the fast is direction: turn from distraction, turn to God.

21 Days of Fasting & Prayer start now. It's not too late to join — mta.heartbeatofgod.ca

#MTA2026 #Exploits #ItBegins #DoExploits #HeartbeatOfGod""",
 "status":"Day 1 of 21 — IT BEGINS. Set your face unto God. → mta.heartbeatofgod.ca",
 "broadcast":"""Beloved, it begins today. Day 1 of 21: Set Your Face Unto God. Let your attention become an offering — turn fully to the Lord and let the 21 days do their holy work. Still time to join the family: mta.heartbeatofgod.ca""",
},
]

created_dirs, created_files = [], []
def mkd(p):
    os.makedirs(p, exist_ok=True); created_dirs.append(os.path.relpath(p, KIT))
def cp(src, dst):
    shutil.copy(src, dst); created_files.append(os.path.relpath(dst, KIT))
def wf(path, text):
    w(path, text); created_files.append(os.path.relpath(path, KIT))

# ── 00 master flyer ───────────────────────────────────────────────
m = os.path.join(KIT, "00-master-flyer"); mkd(m)
for f in ["mta2026-flyer-portrait-1080x1350.png",
          "mta2026-flyer-square-1080x1080.png",
          "mta2026-flyer-story-1080x1920.png"]:
    cp(os.path.join(MASTER, f), os.path.join(m, f))

# ── day folders ───────────────────────────────────────────────────
for d in DAYS:
    dd = os.path.join(KIT, d["folder"]); mkd(dd)
    sq = f"mta2026-countdown-{d['slug']}-square-1080x1080.png"
    st = f"mta2026-countdown-{d['slug']}-story-1080x1920.png"
    cp(os.path.join(CD, sq), os.path.join(dd, sq))
    cp(os.path.join(CD, st), os.path.join(dd, st))
    wf(os.path.join(dd, "caption-feed.txt"), d["feed"])
    wf(os.path.join(dd, "caption-status.txt"), d["status"])
    wf(os.path.join(dd, "caption-broadcast.txt"), d["broadcast"])

# ── captions/ (consolidated + copy of the source pack) ────────────
capd = os.path.join(KIT, "captions"); mkd(capd)
cp(os.path.join(DESIGN, "dor-158d", "mta2026-caption-pack.md"),
   os.path.join(capd, "mta2026-caption-pack.md"))
allcap = ["# MTA 2026 — All Captions (quick copy)\n"]
labels = ["T-7 Aug 6","T-6 Aug 7","T-5 Aug 8","T-4 Aug 9","T-3 Aug 10","T-2 Aug 11","T-1 Aug 12","Day 0 Aug 13"]
for lab, d in zip(labels, DAYS):
    allcap.append(f"\n===== {lab} =====\n\n[FEED]\n{d['feed']}\n\n[STATUS]\n{d['status']}\n\n[BROADCAST]\n{d['broadcast']}\n")
wf(os.path.join(capd, "all-captions.txt"), "\n".join(allcap))

# ── admin/ ────────────────────────────────────────────────────────
ad = os.path.join(KIT, "admin"); mkd(ad)
wf(os.path.join(ad, "posting-calendar.md"), """
# MTA 2026 — Posting Calendar (Aug 6 → Aug 13, 2026)

Post once per day. Square → feeds/groups. Story → WhatsApp Status. Broadcast → broadcast list.
Consistent morning time (~7:00 AM local). Reshare Status in the evening on T-1 and Day 0.

| Date | Day | Headline | Folder |
|---|---|---|---|
| Aug 6  | T-7 | THE ASSEMBLY IS COMING   | 01-aug-06-t7-reveal |
| Aug 7  | T-6 | KNOW YOUR GOD            | 02-aug-07-t6-the-word |
| Aug 8  | T-5 | THREE NATIONS · ONE ALTAR| 03-aug-08-t5-three-nations |
| Aug 9  | T-4 | WHY WE FAST              | 04-aug-09-t4-why-fast |
| Aug 10 | T-3 | THE FIRE IS NEAR         | 05-aug-10-t3-the-fire-is-near |
| Aug 11 | T-2 | PREPARE YOUR HEART       | 06-aug-11-t2-prepare-your-heart |
| Aug 12 | T-1 | WE BEGIN TOMORROW        | 07-aug-12-t1-we-begin-tomorrow |
| Aug 13 | Day 0 | IT BEGINS (Day 1 of 21)| 08-aug-13-day0-it-begins |

Every link points only to mta.heartbeatofgod.ca — no separate fast sign-up.
Pin the master flyer (00-master-flyer/) + the pinned announcement in every group for the full window.
""")
wf(os.path.join(ad, "pinned-whatsapp-announcement.txt"), """
📌 MTA 2026 — EXPLOITS · 21 Days of Fasting & Prayer
Mighty Turn Around Assembly — Nigeria · Canada · Germany
"The people that do know their God shall be strong, and do exploits." — Daniel 11:32

🗓 Begins August 13, 2026 (21 days)
✅ Register once here: mta.heartbeatofgod.ca  (one form — registration includes the fast; no separate sign-up)

Invite your household. Don't fast alone — let's meet at the altar. 🔥
""")
wf(os.path.join(ad, "admin-instructions.txt"), """
MTA 2026 — Posting Instructions (admin)

CADENCE
- One post per day, T-7 (Aug 6) through Day 0 (Aug 13). Use the matching day folder.
- Post at a consistent morning time (~7:00 AM local) for rhythm.
- On T-1 (Aug 12) and Day 0 (Aug 13), reshare to Status again in the evening.

WHAT GOES WHERE (per day folder)
- *-square-1080x1080.png  + caption-feed.txt      -> WhatsApp groups / feeds
- *-story-1080x1920.png   + caption-status.txt    -> WhatsApp Status
- caption-broadcast.txt                            -> WhatsApp broadcast list

PINNED / ONGOING
- Pin the master flyer (00-master-flyer/) and admin/pinned-whatsapp-announcement.txt
  in every group description for the whole window.

RULES
- Every link points ONLY to mta.heartbeatofgod.ca. Do NOT create or share any separate fast sign-up link.
- One asset, one caption, one CTA per post. Keep it clean — no link spam.
- Hashtags: <= 5 per feed post; 0-1 on Status; none on broadcast/group messages.
""")

# ── README ────────────────────────────────────────────────────────
wf(os.path.join(KIT, "README.md"), """
# MTA 2026 — EXPLOITS · WhatsApp Posting Kit (DOR-158E)

Everything needed to run the **Aug 6 → Aug 13, 2026** countdown to the 21 Days of
Fasting & Prayer. **Register link (everywhere): mta.heartbeatofgod.ca** — one form,
**no separate fast sign-up.**

## How to use
1. Each morning, open that day's numbered folder (01 … 08).
2. Post the **square PNG** to WhatsApp groups/feeds with **caption-feed.txt**.
3. Post the **story PNG** to WhatsApp **Status** with **caption-status.txt**.
4. Send **caption-broadcast.txt** to your WhatsApp **broadcast list**.
5. Keep the master flyer + pinned announcement pinned in every group all week.

## What to post each day
| Date | Day | Post this folder | Headline |
|---|---|---|---|
| Aug 6  | T-7 | `01-aug-06-t7-reveal`            | THE ASSEMBLY IS COMING |
| Aug 7  | T-6 | `02-aug-07-t6-the-word`          | KNOW YOUR GOD |
| Aug 8  | T-5 | `03-aug-08-t5-three-nations`     | THREE NATIONS · ONE ALTAR |
| Aug 9  | T-4 | `04-aug-09-t4-why-fast`          | WHY WE FAST |
| Aug 10 | T-3 | `05-aug-10-t3-the-fire-is-near`  | THE FIRE IS NEAR |
| Aug 11 | T-2 | `06-aug-11-t2-prepare-your-heart`| PREPARE YOUR HEART |
| Aug 12 | T-1 | `07-aug-12-t1-we-begin-tomorrow` | WE BEGIN TOMORROW |
| Aug 13 | Day 0 | `08-aug-13-day0-it-begins`     | IT BEGINS (Day 1 of 21) |

## Folders
- `00-master-flyer/` — master flyer (portrait / square / story) to pin all week.
- `01…08-*` — one folder per countdown day (square + story PNG + 3 caption .txt).
- `captions/` — full caption pack + `all-captions.txt` (quick copy of everything).
- `admin/` — posting calendar, pinned announcement, posting instructions.

Tone: prophetic · urgent · premium · clear · not noisy.
""")

print("dirs:", len(set(created_dirs)), "files:", len(created_files))
