/**
 * HBG Ministry — event registry.
 *
 * WHY THIS EXISTS
 * The site used to hardcode one event. When MTA 2026 finished on 6 Sept the
 * page kept saying "IT'S HAPPENING NOW" over a dead countdown and kept taking
 * registrations for it — six weeks past. Nothing was wrong with the code; the
 * event simply had nowhere to live except inside the components.
 *
 * HOW TO SWITCH THE SITE TO THE NEXT PROGRAMME
 * 1. Add an entry to EVENTS below.
 * 2. Change CURRENT_EVENT_ID to its key.
 * That is the whole operation. Hero, countdown, schedule, registration fields,
 * page title and confirmation email all follow.
 *
 * Past events stay in this file. They are the archive, and `status` is derived
 * from the clock rather than hand-maintained, so nothing goes stale again.
 *
 * ZOOM
 * The ministry uses ONE permanent Zoom meeting (ZOOM_MEETING_ID env var) for
 * every programme. Only the wording changes per event, which is why each entry
 * carries `zoomTopic` and not a link. Never put a meeting link here.
 */

export type RegistrationField =
  | "fullName"
  | "email"
  | "phone"
  | "whatsapp"
  | "location"
  | "attendanceMode"
  | "ministry"
  | "designation"
  | "fasting"
  | "desire";

export type ProgrammeSegment = {
  /** e.g. "7:00 PM" or "Day 1 · 5:00 PM" */
  time: string;
  title: string;
  lead?: string;
};

/** A season that leads INTO the event — e.g. MTA's 21-day fast.
 *  Most programmes have none; leave `leadIn` empty and the rail is skipped. */
export type LeadInStep = {
  title: string;
  label: string;
  dates: string;
  body: string;
  quote?: string;
};

export type AboutContent = {
  /** Section kicker, e.g. "About The Assembly" / "About The Night" */
  kicker: string;
  /** Headline; `highlight` is rendered in gold. */
  headline: string;
  highlight: string;
  paragraphs: string[];
  /** Four short badges. Icon chosen by the component from this key. */
  features: { icon: "crown" | "waves" | "book" | "landmark"; label: string }[];
};

export type HbgEvent = {
  id: string;
  /** Big name, e.g. "TRIBE X" */
  name: string;
  /** Second line, e.g. "Throne Room" */
  subtitle: string;
  /** Small all-caps line above the name */
  kicker: string;
  /** One-word or short theme, e.g. "EXPLOITS" */
  theme: string;
  scripture: { ref: string; text: string };

  /** ISO local time. `end` is required — it is what stops a finished event
   *  claiming to still be live. */
  start: string;
  end: string;
  /** Human label, e.g. "November 27, 2026" */
  dateLabel: string;

  venue: string;
  online: boolean;

  /** Open the form only when registration actually works end to end.
   *  False renders an honest notice instead of a form that would fail. */
  registrationOpen: boolean;
  /** Shown when registrationOpen is false and there is no external path. */
  registrationClosedNote?: string;

  /**
   * Register through channels the ministry already runs, instead of the
   * built-in form. Chosen for TRIBE X because the in-app form writes to a
   * paused Supabase project, and because the Akute congregation registers
   * over WhatsApp anyway. Costs nothing and needs no database.
   *
   * Set `registrationOpen: false` alongside this — the built-in form stays
   * off and these channels render in its place.
   */
  externalRegistration?: {
    note: string;
    channels: {
      type: "whatsapp" | "telegram" | "form" | "email";
      label: string;
      /** wa.me/<intl number, digits only>, t.me/<handle>, mailto:, or a form URL */
      url: string;
      /** Small line under the button */
      hint?: string;
    }[];
  };
  /** Which fields to show. A one-night concert should not ask a visitor for
   *  their ministry designation or fasting commitment. */
  fields: RegistrationField[];

  programme: ProgrammeSegment[];

  /** Optional run-up season. Empty for most events. */
  leadIn: LeadInStep[];
  about: AboutContent;

  hero: {
    headline: string;
    subhead: string;
    description: string;
  };

  /** Naming only — the Zoom meeting itself is constant. */
  zoomTopic: string;

  /** Promo audio for the floating player. Empty hides the player entirely,
   *  which is correct for an event with nothing recorded yet. */
  audioTracks: { id: string; label: string; src: string }[];

  /** Browser tab + share preview. */
  meta: { title: string; description: string };
};

export const EVENTS: Record<string, HbgEvent> = {
  "tribe-x-2026": {
    id: "tribe-x-2026",
    name: "TRIBE X",
    subtitle: "Throne Room",
    kicker: "HBG Ministry Concert",
    theme: "THRONE ROOM",
    scripture: {
      ref: "Psalm 46:10 · KJV",
      text:
        "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
    },
    start: "2026-11-27T19:00:00",
    end: "2026-11-27T21:30:00",
    dateLabel: "November 27, 2026",
    venue: "HBG Ministry, Akute",
    online: true,
    // Closed deliberately: the registrations database (Supabase project
    // "Heart Beat Of God Ministry") is paused, so an open form would collect
    // details and silently fail. Flip to true once that is restored.
    registrationOpen: false,
    registrationClosedNote:
      "Registration opens soon. Follow HBG Ministry on Telegram or Instagram and we will announce the moment it is live.",
    externalRegistration: {
      note: "Free entry. Send us a message and the team will confirm your place.",
      channels: [
        {
          type: "whatsapp",
          label: "Register on WhatsApp",
          // Ministry line from heartbeatofgod.ca/connect — +234 813 093 8682
          url: "https://wa.me/2348130938682?text=" +
            encodeURIComponent(
              "Hello HBG Ministry — I would like to register for TRIBE X: Throne Room on November 27. My name is:",
            ),
          hint: "Fastest — most of the Akute congregation registers this way",
        },
        {
          type: "email",
          label: "Register by Email",
          url: "mailto:heartbeatofgodf@gmail.com?subject=" +
            encodeURIComponent("TRIBE X Registration — Throne Room, Nov 27") +
            "&body=" +
            encodeURIComponent(
              "Full name:\nPhone:\nLocation (city/country):\nAttending: in person / online\nWhat I am believing God for:",
            ),
          hint: "heartbeatofgodf@gmail.com",
        },
      ],
    },
    fields: ["fullName", "email", "phone", "location", "desire"],
    programme: [
      { time: "7:00 PM", title: "Welcome & Opening Prayer", lead: "Pastor Amos Unogwu" },
      { time: "7:15 PM", title: "Prophetic Worship Session", lead: "HBG Worship Team" },
      { time: "8:00 PM", title: "Word & Prophetic Release", lead: "Pastor Amos Unogwu" },
      { time: "8:45 PM", title: "Ministration & Altar Call", lead: "HBG Ministry Team" },
      { time: "9:15 PM", title: "Benediction & Closing", lead: "Pastor Amos Unogwu" },
    ],
    leadIn: [],
    about: {
      kicker: "About The Night",
      headline: "One night to come before",
      highlight: "the throne",
      paragraphs: [
        "TRIBE X is HBG Ministry's night of prophetic worship — a gathering built around presence rather than programme. The songs are not a warm-up. They are the room.",
        "Come as you are, in Akute or online. Be still long enough to know that He is God, and leave with a reason to live.",
      ],
      features: [
        { icon: "waves", label: "Prophetic Worship" },
        { icon: "book", label: "The Word" },
        { icon: "crown", label: "Altar & Ministration" },
        { icon: "landmark", label: "Akute & Online" },
      ],
    },
    hero: {
      headline: "TRIBE X · THRONE ROOM",
      subhead: "Step into the Sacred. Find Your Reason to Live.",
      description:
        "A night of prophetic worship and the Word, live from HBG Ministry, Akute and online. Come before the throne of God.",
    },
    zoomTopic: "HBG Ministry — TRIBE X: Throne Room",
    // No promo audio recorded yet — the player stays hidden rather than
    // playing MTA's announcement under a TRIBE X banner.
    audioTracks: [],
    meta: {
      title: "TRIBE X — Throne Room | HBG Ministry",
      description:
        "A night of worship and prophecy with Pastor Amos Unogwu. November 27, 2026. Akute, Nigeria and online. Free registration.",
    },
  },

  /** Archived. Kept so the site can show history and so nobody re-types it. */
  "mta-2026": {
    id: "mta-2026",
    name: "MTA 2026",
    subtitle: "Mighty Turn Around Assembly",
    kicker: "HBG Ministry Annual Assembly",
    theme: "EXPLOITS",
    scripture: {
      ref: "Daniel 11:32 · KJV",
      text: "The people that do know their God shall be strong, and do exploits.",
    },
    start: "2026-09-04T17:00:00",
    end: "2026-09-06T13:00:00",
    dateLabel: "September 4–6, 2026",
    venue: "HBG Ministry, Akute",
    online: true,
    registrationOpen: false,
    fields: [
      "fullName",
      "email",
      "phone",
      "whatsapp",
      "attendanceMode",
      "fasting",
      "ministry",
      "designation",
      "desire",
    ],
    programme: [
      { time: "Day 1 · 5:00 PM", title: "Red Carpet" },
      { time: "Day 1 · 6:00 PM", title: "Opening Session" },
      { time: "Day 2 · 9:00 AM", title: "Morning Session: Divine Turnaround" },
      { time: "Day 2 · 5:00 PM", title: "Evening Session: Supernatural Encounters" },
      { time: "Day 3 · 9:00 AM", title: "Celebration Service & Ordination/Graduation" },
    ],
    leadIn: [
      {
        title: "WE WAIT",
        label: "21 Days of Fasting & Prayer",
        dates: "August 13 – September 2, 2026",
        body: "A season of consecration, intercession, and spiritual sharpening. The altar is prepared before the Assembly begins.",
        quote:
          "You do not come to MTA empty — you come loaded from 21 days in His presence.",
      },
      {
        title: "MTA 2026",
        label: "Mighty Turn Around Assembly",
        dates: "September 4–6, 2026",
        body: "You come from the secret place into the gathering. The fast prepares the ground. MTA is the harvest.",
      },
    ],
    about: {
      kicker: "About The Assembly",
      headline: "A mature gathering for people rising into",
      highlight: "EXPLOITS",
      paragraphs: [
        "MTA is HBG Ministry's major annual gathering — a multi-day conference of worship, prayer, the Word of God, and the tangible move of the Holy Spirit.",
        "Coming directly out of 21 days of corporate fasting and prayer, the atmosphere at MTA is already charged. The people arrive hungry, sharpened, and expectant.",
      ],
      features: [
        { icon: "crown", label: "3 Days of EXPLOITS" },
        { icon: "waves", label: "Prophetic Prayer" },
        { icon: "book", label: "Mighty Word" },
        { icon: "landmark", label: "Akute & Online" },
      ],
    },
    hero: {
      headline: "MTA 2026 · EXPLOITS",
      subhead: "Mighty Turn Around Assembly",
      description:
        "A three-day assembly of worship, Word, consecration, and expectation for believers rising into spiritual authority.",
    },
    zoomTopic: "HBG Ministry — MTA 2026",
    audioTracks: [
      { id: "announcement", label: "MTA 2026 — Official Announcement", src: "/audio/mta-2026-announcement.mp3" },
      { id: "fast-prayer-charge", label: "MTA 2026 — Fast & Prayer Charge", src: "/audio/mta-2026-fast-prayer-charge.mp3" },
      { id: "prophetic-theme", label: "MTA 2026 — Prophetic Theme Sound", src: "/audio/mta-2026-prophetic-theme.mp3" },
    ],
    meta: {
      title: "MTA 2026 — Mighty Turn Around Assembly | HBG Ministry",
      description:
        "HBG Ministry's annual assembly. September 4–6, 2026, Akute, Nigeria and online.",
    },
  },
};

/** ⇦ THE ONE LINE YOU CHANGE TO SWITCH PROGRAMMES. */
export const CURRENT_EVENT_ID = "tribe-x-2026";

export const currentEvent: HbgEvent = EVENTS[CURRENT_EVENT_ID];

export type EventPhase = "before" | "live" | "past";

/** Phase from the clock, never hand-maintained. */
export function getEventPhase(event: HbgEvent, now: number = Date.now()): EventPhase {
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  if (now < start) return "before";
  if (now <= end) return "live";
  return "past";
}

/** Events already finished, newest first — for an archive listing. */
export function pastEvents(now: number = Date.now()): HbgEvent[] {
  return Object.values(EVENTS)
    .filter((e) => getEventPhase(e, now) === "past")
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
}
