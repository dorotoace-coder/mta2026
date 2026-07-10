export type JourneyEntry = {
  day?: number;
  title: string;
  scripture: string;
  devotional: string;
  declaration: string;
};

export type JourneyPhase =
  | { phase: "preparation"; preparationIndex: number; daysUntilFast: number }
  | { phase: "fast"; day: number }
  | { phase: "post" };

const FAST_START = new Date("2026-08-13T00:00:00-05:00");
const FAST_END = new Date("2026-09-02T23:59:59-05:00");
const DAY_MS = 24 * 60 * 60 * 1000;

export const preparationContent: JourneyEntry[] = [
  {
    title: "Prepare the Altar",
    scripture: "Sanctify ye a fast, call a solemn assembly, gather the elders and all the inhabitants of the land into the house of the LORD your God, and cry unto the LORD. — Joel 1:14 (KJV)",
    devotional:
      "Before the Assembly, we make room. Preparation is not delay; it is the altar where hunger is arranged before fire falls. Let your heart become quiet, yielded, and ready for what God will do at MTA 2026 — EXPLOITS.",
    declaration:
      "Lord, prepare my heart. I will not arrive casual; I will arrive consecrated.",
  },
  {
    title: "Set Your Expectation",
    scripture: "For surely there is an end; and thine expectation shall not be cut off. — Proverbs 23:18 (KJV)",
    devotional:
      "Expectation gives direction to desire. As WE WAIT, name what you are trusting God for: clarity, strength, fire, restoration, and grace to do exploits. Do not let the days pass without holy expectation.",
    declaration:
      "My expectation is alive before God, and it shall not be cut off.",
  },
  {
    title: "Return to the Secret Place",
    scripture: "But thou, when thou prayest, enter into thy closet... and thy Father which seeth in secret shall reward thee openly. — Matthew 6:6 (KJV)",
    devotional:
      "Public strength is formed in private surrender. The fast will not begin on a stage; it begins in the secret place. Make your closet ready. Make your heart ready. God meets prepared hunger.",
    declaration:
      "Father, meet me in the secret place and form strength within me.",
  },
  {
    title: "Consecrate the Appetite",
    scripture: "But I keep under my body, and bring it into subjection... — 1 Corinthians 9:27 (KJV)",
    devotional:
      "Fasting is not punishment; it is alignment. Appetite must learn the government of the Spirit. As the fast approaches, ask God for grace to give Him the first place in your body, schedule, and desire.",
    declaration:
      "My appetite will serve the purpose of God. My body will not rule my spirit.",
  },
  {
    title: "Rise for Exploits",
    scripture: "...the people that do know their God shall be strong, and do exploits. — Daniel 11:32 (KJV)",
    devotional:
      "MTA 2026 is not approached empty. We come loaded from days in His presence. Knowledge of God produces strength, and strength produces exploits. Prepare to rise.",
    declaration:
      "I know my God. I receive strength. I rise for EXPLOITS.",
  },
];

export const fastDayContent: JourneyEntry[] = [
  {
    day: 1,
    title: "Set Your Face Unto God",
    scripture: "And I set my face unto the Lord God, to seek by prayer and supplications, with fasting... — Daniel 9:3 (KJV)",
    devotional:
      "Daniel began by setting his face. The first victory of fasting is direction: turning from distraction and turning toward God. Today, set your face. Let your attention become an offering.",
    declaration: "Today I set my face unto the Lord. My attention belongs to God.",
  },
  {
    day: 2,
    title: "A Heart That Returns",
    scripture: "Therefore also now, saith the LORD, turn ye even to me with all your heart, and with fasting... — Joel 2:12 (KJV)",
    devotional:
      "The fast is a return. Not a performance, not a display, but a wholehearted turning to God. Let this day strip away divided affection and restore the simplicity of surrender.",
    declaration: "My heart returns fully to the Lord. Nothing will divide my surrender.",
  },
  {
    day: 3,
    title: "Hunger for the Word",
    scripture: "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God. — Matthew 4:4 (KJV)",
    devotional:
      "Fasting teaches the soul what truly sustains it. Bread has its place, but the Word gives life. Feed your spirit deliberately today.",
    declaration: "I live by the Word of God. My spirit is fed and strengthened.",
  },
  {
    day: 4,
    title: "Clean Hands, Pure Heart",
    scripture: "Who shall ascend into the hill of the LORD?... He that hath clean hands, and a pure heart. — Psalm 24:3-4 (KJV)",
    devotional:
      "Consecration is an invitation upward. Ask the Lord to cleanse motives, habits, speech, and hidden places. The pure in heart are positioned to see God.",
    declaration: "Lord, purify my heart and order my hands for Your purpose.",
  },
  {
    day: 5,
    title: "Strength in Waiting",
    scripture: "But they that wait upon the LORD shall renew their strength... — Isaiah 40:31 (KJV)",
    devotional:
      "WE WAIT is not passive. Waiting is spiritual exchange: weakness for strength, hurry for endurance, noise for clarity. Receive renewal today.",
    declaration: "As I wait upon the Lord, my strength is renewed.",
  },
  {
    day: 6,
    title: "Prayer With Fire",
    scripture: "The effectual fervent prayer of a righteous man availeth much. — James 5:16 (KJV)",
    devotional:
      "Fervency is not volume; it is agreement of heart with heaven. Pray with focus. Pray with faith. Pray until your spirit agrees with what God has spoken.",
    declaration: "My prayers are alive, effectual, and aligned with heaven.",
  },
  {
    day: 7,
    title: "Mercy Opens the Way",
    scripture: "Let us therefore come boldly unto the throne of grace, that we may obtain mercy... — Hebrews 4:16 (KJV)",
    devotional:
      "Do not let weakness keep you away from God. Mercy is not a side door; it is the throne invitation. Come boldly and receive help for this journey.",
    declaration: "I receive mercy and grace to continue strong.",
  },
  {
    day: 8,
    title: "Break Every Yoke",
    scripture: "Is not this the fast that I have chosen? to loose the bands of wickedness... — Isaiah 58:6 (KJV)",
    devotional:
      "God's chosen fast carries freedom. Bring every yoke, cycle, delay, and burden before Him. The Lord who calls the fast also breaks the bands.",
    declaration: "Every yoke contrary to God's purpose breaks in Jesus' name.",
  },
  {
    day: 9,
    title: "The Light Shall Break Forth",
    scripture: "Then shall thy light break forth as the morning... — Isaiah 58:8 (KJV)",
    devotional:
      "Consecration clears the atmosphere. Expect light: understanding, direction, healing, and fresh courage. God does not leave seekers in darkness.",
    declaration: "My light breaks forth. I walk in clarity and healing.",
  },
  {
    day: 10,
    title: "Stand in the Gap",
    scripture: "And I sought for a man among them, that should make up the hedge, and stand in the gap... — Ezekiel 22:30 (KJV)",
    devotional:
      "Intercession is love carrying responsibility. Today, stand for your family, church, city, and generation. Let your prayer become a wall.",
    declaration: "I stand in the gap with faith, love, and authority.",
  },
  {
    day: 11,
    title: "The Spirit Helps",
    scripture: "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought... — Romans 8:26 (KJV)",
    devotional:
      "You are not praying alone. The Spirit helps weakness and gives language to burden. Lean into His help today.",
    declaration: "Holy Spirit, help me pray according to the will of God.",
  },
  {
    day: 12,
    title: "Grace to Continue",
    scripture: "My grace is sufficient for thee: for my strength is made perfect in weakness. — 2 Corinthians 12:9 (KJV)",
    devotional:
      "Midway moments reveal dependence. If your body feels weak, let your spirit lean harder into grace. God's strength is not theoretical; it is supplied.",
    declaration: "The grace of God is sufficient for me. I continue by His strength.",
  },
  {
    day: 13,
    title: "A Renewed Mind",
    scripture: "And be not conformed to this world: but be ye transformed by the renewing of your mind... — Romans 12:2 (KJV)",
    devotional:
      "Fasting reshapes appetite, but the Word renews the mind. Let God challenge patterns, fears, and assumptions that cannot carry exploits.",
    declaration: "My mind is renewed by the Word and aligned with God's will.",
  },
  {
    day: 14,
    title: "The Lord Is My Strength",
    scripture: "The LORD is my strength and my shield; my heart trusted in him, and I am helped... — Psalm 28:7 (KJV)",
    devotional:
      "Trust turns strength into testimony. As you continue, do not measure only by feeling. The Lord is your strength, shield, and help.",
    declaration: "The Lord is my strength and shield. My heart trusts Him.",
  },
  {
    day: 15,
    title: "Ask for Wisdom",
    scripture: "If any of you lack wisdom, let him ask of God... and it shall be given him. — James 1:5 (KJV)",
    devotional:
      "Exploits require wisdom, not zeal alone. Ask God for divine strategy, clean discernment, and timing. He gives liberally.",
    declaration: "I receive wisdom from above for the days ahead.",
  },
  {
    day: 16,
    title: "Faith That Moves",
    scripture: "If ye have faith as a grain of mustard seed... nothing shall be impossible unto you. — Matthew 17:20 (KJV)",
    devotional:
      "Faith does not need to be loud to be living. Bring your mustard seed to God and obey the next instruction. Movement begins there.",
    declaration: "My faith is alive. I obey God, and nothing shall be impossible.",
  },
  {
    day: 17,
    title: "Love Made Strong",
    scripture: "By this shall all men know that ye are my disciples, if ye have love one to another. — John 13:35 (KJV)",
    devotional:
      "Spiritual strength without love misrepresents Christ. Let the fast tenderize your heart, heal offence, and restore compassion.",
    declaration: "The love of Christ is strong in me and visible through me.",
  },
  {
    day: 18,
    title: "Boldness to Witness",
    scripture: "And with great power gave the apostles witness of the resurrection of the Lord Jesus... — Acts 4:33 (KJV)",
    devotional:
      "Power is given for witness. Ask God for boldness that is humble, clear, and full of grace. Let your life point to Jesus.",
    declaration: "I receive boldness and grace to witness of Jesus Christ.",
  },
  {
    day: 19,
    title: "Fire on the Altar",
    scripture: "The fire shall ever be burning upon the altar; it shall never go out. — Leviticus 6:13 (KJV)",
    devotional:
      "Sustained fire requires tending. Protect what God has stirred in you. Do not let distraction carry away what prayer has kindled.",
    declaration: "The fire of God burns on the altar of my heart and shall not go out.",
  },
  {
    day: 20,
    title: "Ready for the Assembly",
    scripture: "I was glad when they said unto me, Let us go into the house of the LORD. — Psalm 122:1 (KJV)",
    devotional:
      "The fast is forming expectation for gathering. Prepare to come with gratitude, obedience, and hunger. The Assembly is near.",
    declaration: "I come to the house of the Lord with gladness and holy expectation.",
  },
  {
    day: 21,
    title: "Loaded for Exploits",
    scripture: "But the prince of the kingdom of Persia withstood me one and twenty days... and, behold, Michael, one of the chief princes, came to help me. — Daniel 10:13 (KJV)",
    devotional:
      "Daniel's twenty-one days were not wasted days. Heaven was moving while he waited. Today we finish knowing this: waiting has weight, prayer has effect, and God's people rise strengthened for exploits.",
    declaration: "The twenty-one days are fulfilled. I do not come empty; I come loaded for EXPLOITS.",
  },
];

export const getJourneyPhase = (now = new Date()): JourneyPhase => {
  if (now < FAST_START) {
    const daysUntilFast = Math.max(0, Math.ceil((FAST_START.getTime() - now.getTime()) / DAY_MS));
    const preparationIndex = Math.min(
      preparationContent.length - 1,
      Math.max(0, preparationContent.length - Math.ceil(daysUntilFast / 7))
    );
    return { phase: "preparation", preparationIndex, daysUntilFast };
  }

  if (now <= FAST_END) {
    const day = Math.min(21, Math.max(1, Math.floor((now.getTime() - FAST_START.getTime()) / DAY_MS) + 1));
    return { phase: "fast", day };
  }

  return { phase: "post" };
};

export const getCurrentJourneyEntry = (phase: JourneyPhase) => {
  if (phase.phase === "fast") return fastDayContent[phase.day - 1];
  if (phase.phase === "preparation") return preparationContent[phase.preparationIndex];
  return fastDayContent[20];
};
