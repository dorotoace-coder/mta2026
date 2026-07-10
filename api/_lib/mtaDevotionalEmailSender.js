// api/_lib/mtaDevotionalEmailSender.ts
import { Resend } from "resend";

// src/lib/mtaFastJourneyContent.ts
var DAY_MS = 24 * 60 * 60 * 1e3;
var fastDayContent = [
  {
    day: 1,
    title: "Set Your Face Unto God",
    scripture: "And I set my face unto the Lord God, to seek by prayer and supplications, with fasting... \u2014 Daniel 9:3 (KJV)",
    devotional: "Daniel began by setting his face. The first victory of fasting is direction: turning from distraction and turning toward God. Today, set your face. Let your attention become an offering.",
    declaration: "Today I set my face unto the Lord. My attention belongs to God."
  },
  {
    day: 2,
    title: "A Heart That Returns",
    scripture: "Therefore also now, saith the LORD, turn ye even to me with all your heart, and with fasting... \u2014 Joel 2:12 (KJV)",
    devotional: "The fast is a return. Not a performance, not a display, but a wholehearted turning to God. Let this day strip away divided affection and restore the simplicity of surrender.",
    declaration: "My heart returns fully to the Lord. Nothing will divide my surrender."
  },
  {
    day: 3,
    title: "Hunger for the Word",
    scripture: "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God. \u2014 Matthew 4:4 (KJV)",
    devotional: "Fasting teaches the soul what truly sustains it. Bread has its place, but the Word gives life. Feed your spirit deliberately today.",
    declaration: "I live by the Word of God. My spirit is fed and strengthened."
  },
  {
    day: 4,
    title: "Clean Hands, Pure Heart",
    scripture: "Who shall ascend into the hill of the LORD?... He that hath clean hands, and a pure heart. \u2014 Psalm 24:3-4 (KJV)",
    devotional: "Consecration is an invitation upward. Ask the Lord to cleanse motives, habits, speech, and hidden places. The pure in heart are positioned to see God.",
    declaration: "Lord, purify my heart and order my hands for Your purpose."
  },
  {
    day: 5,
    title: "Strength in Waiting",
    scripture: "But they that wait upon the LORD shall renew their strength... \u2014 Isaiah 40:31 (KJV)",
    devotional: "WE WAIT is not passive. Waiting is spiritual exchange: weakness for strength, hurry for endurance, noise for clarity. Receive renewal today.",
    declaration: "As I wait upon the Lord, my strength is renewed."
  },
  {
    day: 6,
    title: "Prayer With Fire",
    scripture: "The effectual fervent prayer of a righteous man availeth much. \u2014 James 5:16 (KJV)",
    devotional: "Fervency is not volume; it is agreement of heart with heaven. Pray with focus. Pray with faith. Pray until your spirit agrees with what God has spoken.",
    declaration: "My prayers are alive, effectual, and aligned with heaven."
  },
  {
    day: 7,
    title: "Mercy Opens the Way",
    scripture: "Let us therefore come boldly unto the throne of grace, that we may obtain mercy... \u2014 Hebrews 4:16 (KJV)",
    devotional: "Do not let weakness keep you away from God. Mercy is not a side door; it is the throne invitation. Come boldly and receive help for this journey.",
    declaration: "I receive mercy and grace to continue strong."
  },
  {
    day: 8,
    title: "Break Every Yoke",
    scripture: "Is not this the fast that I have chosen? to loose the bands of wickedness... \u2014 Isaiah 58:6 (KJV)",
    devotional: "God's chosen fast carries freedom. Bring every yoke, cycle, delay, and burden before Him. The Lord who calls the fast also breaks the bands.",
    declaration: "Every yoke contrary to God's purpose breaks in Jesus' name."
  },
  {
    day: 9,
    title: "The Light Shall Break Forth",
    scripture: "Then shall thy light break forth as the morning... \u2014 Isaiah 58:8 (KJV)",
    devotional: "Consecration clears the atmosphere. Expect light: understanding, direction, healing, and fresh courage. God does not leave seekers in darkness.",
    declaration: "My light breaks forth. I walk in clarity and healing."
  },
  {
    day: 10,
    title: "Stand in the Gap",
    scripture: "And I sought for a man among them, that should make up the hedge, and stand in the gap... \u2014 Ezekiel 22:30 (KJV)",
    devotional: "Intercession is love carrying responsibility. Today, stand for your family, church, city, and generation. Let your prayer become a wall.",
    declaration: "I stand in the gap with faith, love, and authority."
  },
  {
    day: 11,
    title: "The Spirit Helps",
    scripture: "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought... \u2014 Romans 8:26 (KJV)",
    devotional: "You are not praying alone. The Spirit helps weakness and gives language to burden. Lean into His help today.",
    declaration: "Holy Spirit, help me pray according to the will of God."
  },
  {
    day: 12,
    title: "Grace to Continue",
    scripture: "My grace is sufficient for thee: for my strength is made perfect in weakness. \u2014 2 Corinthians 12:9 (KJV)",
    devotional: "Midway moments reveal dependence. If your body feels weak, let your spirit lean harder into grace. God's strength is not theoretical; it is supplied.",
    declaration: "The grace of God is sufficient for me. I continue by His strength."
  },
  {
    day: 13,
    title: "A Renewed Mind",
    scripture: "And be not conformed to this world: but be ye transformed by the renewing of your mind... \u2014 Romans 12:2 (KJV)",
    devotional: "Fasting reshapes appetite, but the Word renews the mind. Let God challenge patterns, fears, and assumptions that cannot carry exploits.",
    declaration: "My mind is renewed by the Word and aligned with God's will."
  },
  {
    day: 14,
    title: "The Lord Is My Strength",
    scripture: "The LORD is my strength and my shield; my heart trusted in him, and I am helped... \u2014 Psalm 28:7 (KJV)",
    devotional: "Trust turns strength into testimony. As you continue, do not measure only by feeling. The Lord is your strength, shield, and help.",
    declaration: "The Lord is my strength and shield. My heart trusts Him."
  },
  {
    day: 15,
    title: "Ask for Wisdom",
    scripture: "If any of you lack wisdom, let him ask of God... and it shall be given him. \u2014 James 1:5 (KJV)",
    devotional: "Exploits require wisdom, not zeal alone. Ask God for divine strategy, clean discernment, and timing. He gives liberally.",
    declaration: "I receive wisdom from above for the days ahead."
  },
  {
    day: 16,
    title: "Faith That Moves",
    scripture: "If ye have faith as a grain of mustard seed... nothing shall be impossible unto you. \u2014 Matthew 17:20 (KJV)",
    devotional: "Faith does not need to be loud to be living. Bring your mustard seed to God and obey the next instruction. Movement begins there.",
    declaration: "My faith is alive. I obey God, and nothing shall be impossible."
  },
  {
    day: 17,
    title: "Love Made Strong",
    scripture: "By this shall all men know that ye are my disciples, if ye have love one to another. \u2014 John 13:35 (KJV)",
    devotional: "Spiritual strength without love misrepresents Christ. Let the fast tenderize your heart, heal offence, and restore compassion.",
    declaration: "The love of Christ is strong in me and visible through me."
  },
  {
    day: 18,
    title: "Boldness to Witness",
    scripture: "And with great power gave the apostles witness of the resurrection of the Lord Jesus... \u2014 Acts 4:33 (KJV)",
    devotional: "Power is given for witness. Ask God for boldness that is humble, clear, and full of grace. Let your life point to Jesus.",
    declaration: "I receive boldness and grace to witness of Jesus Christ."
  },
  {
    day: 19,
    title: "Fire on the Altar",
    scripture: "The fire shall ever be burning upon the altar; it shall never go out. \u2014 Leviticus 6:13 (KJV)",
    devotional: "Sustained fire requires tending. Protect what God has stirred in you. Do not let distraction carry away what prayer has kindled.",
    declaration: "The fire of God burns on the altar of my heart and shall not go out."
  },
  {
    day: 20,
    title: "Ready for the Assembly",
    scripture: "I was glad when they said unto me, Let us go into the house of the LORD. \u2014 Psalm 122:1 (KJV)",
    devotional: "The fast is forming expectation for gathering. Prepare to come with gratitude, obedience, and hunger. The Assembly is near.",
    declaration: "I come to the house of the Lord with gladness and holy expectation."
  },
  {
    day: 21,
    title: "Loaded for Exploits",
    scripture: "But the prince of the kingdom of Persia withstood me one and twenty days... and, behold, Michael, one of the chief princes, came to help me. \u2014 Daniel 10:13 (KJV)",
    devotional: "Daniel's twenty-one days were not wasted days. Heaven was moving while he waited. Today we finish knowing this: waiting has weight, prayer has effect, and God's people rise strengthened for exploits.",
    declaration: "The twenty-one days are fulfilled. I do not come empty; I come loaded for EXPLOITS."
  }
];

// api/_lib/mtaDevotionalEmailSender.ts
var FAST_START_UTC = Date.UTC(2026, 7, 13);
var DAY_MS2 = 24 * 60 * 60 * 1e3;
var DEFAULT_BASE_URL = "https://mta.heartbeatofgod.ca";
var AUDIT_TABLE = "mta_devotional_send_audit";
var prayerSectionsByDay = {
  1: {
    direction: "Prophetic alignment for consecration, focus, and spiritual authority.",
    scriptureAnchor: {
      reference: "Daniel 9:3 \u2014 KJV",
      text: "And I set my face unto the Lord God, to seek by prayer and supplications, with fasting\u2026"
    },
    prayerPoints: [
      "By the power of the Holy Ghost, I set my face toward God; every distraction assigned to weaken my consecration is broken now.",
      "Every weakness, appetite, or habit fighting my consecration, lose your hold over my life by the power of the Holy Ghost.",
      "I receive fresh fire, clarity, strength, and spiritual authority; I rise from this fast loaded for exploits in Jesus\u2019 name."
    ]
  }
};
var requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
var maskEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const prefix = local.slice(0, 2);
  return `${prefix}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
};
var isoDateToFastDay = (isoDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Invalid --date value "${isoDate}". Use YYYY-MM-DD.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateUtc = Date.UTC(year, month - 1, day);
  const fastDay = Math.floor((dateUtc - FAST_START_UTC) / DAY_MS2) + 1;
  if (fastDay < 1 || fastDay > 21) {
    throw new Error(`${isoDate} is outside the 21-day fast window. Use 2026-08-13 through 2026-09-02.`);
  }
  return fastDay;
};
var supabaseHeaders = () => {
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json"
  };
};
var supabaseUrl = (path) => {
  const base = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  return `${base}${path}`;
};
var getCount = async (query) => {
  const url = supabaseUrl(`/rest/v1/mta_registrations?select=id${query ? `&${query}` : ""}`);
  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      ...supabaseHeaders(),
      prefer: "count=exact",
      range: "0-0"
    }
  });
  if (!response.ok) {
    throw new Error(`Supabase count failed (${response.status}): ${await response.text()}`);
  }
  const contentRange = response.headers.get("content-range") ?? "0-0/0";
  return Number.parseInt(contentRange.split("/")[1] ?? "0", 10);
};
var fetchRecipients = async (options) => {
  if (options.mockRecipient) {
    const mock = {
      id: "00000000-0000-4000-8000-000000000156",
      full_name: "MTA Preview Recipient",
      email: options.mockRecipient,
      fast_commitment: "yes",
      joining_fast: true
    };
    return {
      recipients: [mock],
      counts: {
        totalRegistrations: 1,
        joiningFastCount: 1,
        validEmailCount: 1,
        skippedCount: 0,
        sendCandidateCount: 1,
        source: "mock"
      }
    };
  }
  const totalRegistrations = await getCount("");
  const joiningFastCount = await getCount("joining_fast=eq.true");
  const validEmailCount = await getCount("joining_fast=eq.true&fast_commitment=in.(yes,try)&email=not.is.null");
  const filters = [
    "select=id,full_name,email,fast_commitment,joining_fast",
    "joining_fast=eq.true",
    "fast_commitment=in.(yes,try)",
    "email=not.is.null",
    "order=created_at.asc"
  ];
  if (options.email) filters.push(`email=eq.${encodeURIComponent(options.email)}`);
  if (options.limit && Number.isFinite(options.limit)) filters.push(`limit=${Math.max(1, options.limit)}`);
  const response = await fetch(supabaseUrl(`/rest/v1/mta_registrations?${filters.join("&")}`), {
    headers: supabaseHeaders()
  });
  if (!response.ok) {
    throw new Error(`Supabase recipient query failed (${response.status}): ${await response.text()}`);
  }
  const recipients = await response.json();
  return {
    recipients,
    counts: {
      totalRegistrations,
      joiningFastCount,
      validEmailCount,
      skippedCount: Math.max(0, validEmailCount - recipients.length),
      sendCandidateCount: recipients.length,
      source: "supabase"
    }
  };
};
var htmlEscape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var renderEmail = ({
  recipient,
  day,
  title,
  scripture,
  devotional,
  declaration,
  prayerSection,
  journeyUrl
}) => {
  const name = htmlEscape(recipient.full_name || "Beloved");
  const prayerHtml = prayerSection ? `<div style="margin:0 0 22px;padding:18px;border:1px solid #5b4621;border-radius:14px;background:#0d1025;">
                  <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d6b25e;margin-bottom:10px;">Prayer Direction</div>
                  <div style="font-size:15px;line-height:1.6;color:#efe3bf;margin-bottom:14px;">${htmlEscape(prayerSection.direction)}</div>
                  <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d6b25e;margin-bottom:8px;">Scripture Anchor</div>
                  <div style="font-size:15px;line-height:1.6;color:#fff4d0;margin-bottom:14px;"><strong>${htmlEscape(prayerSection.scriptureAnchor.reference)}</strong><br><span style="font-style:italic;">${htmlEscape(prayerSection.scriptureAnchor.text)}</span></div>
                  <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d6b25e;margin-bottom:8px;">3 Prophetic Prayer Points</div>
                  <ol style="margin:0;padding-left:20px;color:#efe3bf;font-size:15px;line-height:1.65;">
                    ${prayerSection.prayerPoints.map((point) => `<li style="margin:0 0 8px;">${htmlEscape(point)}</li>`).join("")}
                  </ol>
                </div>` : "";
  return `<!doctype html>
<html>
  <body style="margin:0;background:#070817;color:#f9efd0;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070817;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#10132a;border:1px solid #8f6b2f;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px 26px 18px;text-align:center;background:#080a18;border-bottom:1px solid #3b2d14;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d6b25e;">MTA 2026 \u2014 EXPLOITS</div>
                <h1 style="margin:12px 0 4px;font-size:30px;line-height:1.15;color:#fff4d0;">Day ${day} of 21</h1>
                <div style="font-size:18px;color:#d6b25e;">${htmlEscape(title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 18px;font-size:17px;line-height:1.65;color:#f8eccb;">${name}, grace to you as we wait before the Lord.</p>
                <div style="margin:0 0 22px;padding:18px 18px;border-left:4px solid #d6b25e;background:#0a0d1e;color:#fff7df;font-style:italic;font-size:16px;line-height:1.65;">
                  ${htmlEscape(scripture)}
                </div>
                <div style="margin:0 0 22px;font-size:16px;line-height:1.75;color:#efe3bf;">
                  ${htmlEscape(devotional)}
                </div>
                <div style="margin:0 0 24px;padding:18px;border:1px solid #6c5426;border-radius:14px;background:#15172e;">
                  <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d6b25e;margin-bottom:8px;">Declaration</div>
                  <div style="font-size:17px;line-height:1.65;color:#fff4d0;font-weight:bold;">${htmlEscape(declaration)}</div>
                </div>
                ${prayerHtml}
                <p style="margin:0 0 18px;text-align:center;">
                  <a href="${journeyUrl}" style="display:inline-block;background:#d6b25e;color:#070817;text-decoration:none;font-weight:bold;border-radius:999px;padding:12px 20px;">Open Your MTA Journey Page</a>
                </p>
                <p style="margin:22px 0 0;font-size:13px;line-height:1.55;color:#b9ad8c;text-align:center;">
                  You are receiving this because you registered for MTA 2026 and joined the 21 Days of Fasting & Prayer. For help or opt-out, reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
var reserveAudit = async (row) => {
  const response = await fetch(supabaseUrl(`/rest/v1/${AUDIT_TABLE}`), {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      prefer: "return=representation"
    },
    body: JSON.stringify(row)
  });
  if (response.status === 409) return null;
  if (!response.ok) {
    throw new Error(`Audit reservation failed (${response.status}): ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] ?? null;
};
var updateAudit = async (id, patch) => {
  const response = await fetch(supabaseUrl(`/rest/v1/${AUDIT_TABLE}?id=eq.${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
      prefer: "return=minimal"
    },
    body: JSON.stringify(patch)
  });
  if (!response.ok) {
    throw new Error(`Audit update failed (${response.status}): ${await response.text()}`);
  }
};
var runMtaDevotionalEmailSend = async (options) => {
  const live = options.live === true;
  const runId = crypto.randomUUID();
  const source = options.source ?? "manual";
  const day = isoDateToFastDay(options.date);
  const entry = fastDayContent[day - 1];
  const prayerSection = prayerSectionsByDay[day];
  const contentKey = `mta-fast-day-${String(day).padStart(2, "0")}`;
  const baseUrl = (process.env.MTA_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  if (live && process.env.MTA_DEVOTIONAL_SENDS_DISABLED === "true") {
    throw new Error("Live sends are blocked because MTA_DEVOTIONAL_SENDS_DISABLED=true.");
  }
  if (live && !options.email && !options.all) {
    throw new Error("Live mode requires --email=<address> for one recipient or --all for eligible recipients.");
  }
  if (live && options.all && !options.confirmSend) {
    throw new Error("Live all-recipient send requires --live --all --confirm-send.");
  }
  if (live && options.all && options.allowAllLive !== true) {
    throw new Error("All-recipient live devotional sending is blocked in DOR-156B-P1.");
  }
  const { recipients, counts } = await fetchRecipients(options);
  const summary = {
    run_id: runId,
    mode: live ? "live" : "dry_run",
    source,
    devotional_date: options.date,
    journey_day: day,
    content_key: contentKey,
    title: entry.title,
    prayer_section: prayerSection ? {
      included: true,
      direction: prayerSection.direction,
      scripture_anchor: prayerSection.scriptureAnchor.reference,
      prayer_points_count: prayerSection.prayerPoints.length
    } : { included: false },
    counts,
    safety: {
      live_email_sent: false,
      dry_run_default: true,
      provider_call_made: false,
      provider_calls_used: 0,
      stop_send_guard: "MTA_DEVOTIONAL_SENDS_DISABLED=true blocks live sends",
      cron_enabled_guard: "MTA_DEVOTIONAL_CRON_ENABLED=true required before cron execution",
      live_all_requires: "--live --all --confirm-send",
      scheduled_live_all_status: "blocked in DOR-156B-P1"
    },
    candidate_sample: recipients.slice(0, 5).map((recipient) => ({
      id: recipient.id,
      full_name: recipient.full_name,
      email: maskEmail(recipient.email),
      fast_commitment: recipient.fast_commitment,
      joining_fast: recipient.joining_fast
    }))
  };
  if (!live) return summary;
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let providerMessageIdPresent = false;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const reservation = await reserveAudit({
      run_id: runId,
      registration_id: recipient.id,
      channel: "email",
      devotional_date: options.date,
      journey_day: day,
      content_key: contentKey,
      dry_run: false,
      status: "pending"
    });
    if (!reservation) {
      skipped += 1;
      continue;
    }
    const journeyUrl = `${baseUrl}/checkin/${recipient.id}`;
    const html = renderEmail({
      recipient,
      day,
      title: entry.title,
      scripture: entry.scripture,
      devotional: entry.devotional,
      declaration: entry.declaration,
      prayerSection,
      journeyUrl
    });
    try {
      const result = await resend.emails.send({
        from: process.env.MTA_DEVOTIONAL_FROM || "MTA 2026 <noreply@heartbeatofgod.ca>",
        to: recipient.email,
        subject: `MTA 2026 Fast \u2014 Day ${day}: ${entry.title}`,
        html
      });
      providerMessageIdPresent = providerMessageIdPresent || Boolean(result.data?.id);
      await updateAudit(reservation.id, {
        status: "sent",
        provider_message_id: result.data?.id ?? null,
        sent_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      await updateAudit(reservation.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return {
    ...summary,
    safety: {
      ...summary.safety,
      live_email_sent: sent > 0,
      provider_call_made: sent + failed > 0,
      provider_calls_used: sent + failed
    },
    result: {
      sent,
      failed,
      skipped,
      provider_message_id_present: providerMessageIdPresent
    }
  };
};
export {
  isoDateToFastDay,
  runMtaDevotionalEmailSend
};
