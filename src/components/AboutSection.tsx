import { BookOpen, Crown, Landmark, MoveRight, Waves } from "lucide-react";
import { motion } from "framer-motion";

const sequence = [
  {
    title: "WE WAIT",
    label: "21 Days of Fasting & Prayer",
    dates: "August 13 – September 2, 2026",
    body: "A season of consecration, intercession, and spiritual sharpening. The altar is prepared before the Assembly begins.",
  },
  {
    title: "MTA 2026",
    label: "Mighty Turn Around Assembly",
    dates: "September 4–6, 2026",
    body: "You come from the secret place into the gathering. The fast prepares the ground. MTA is the harvest.",
  },
];

const features = [
  { icon: Crown, label: "3 Days of EXPLOITS" },
  { icon: Waves, label: "Prophetic Prayer" },
  { icon: BookOpen, label: "Mighty Word" },
  { icon: Landmark, label: "Akute & Online" },
];

const AboutSection = () => (
  <section id="about" className="mta-section">
    <div className="mta-container">
      <motion.div
        className="mb-20 rounded-[2rem] p-6 mta-panel sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="mta-kicker mb-6">Divine Sequence — The Road to MTA</p>
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/[0.045] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
          >
            <p className="mta-kicker mb-3">{sequence[0].label}</p>
            <h3 className="mb-3 text-2xl font-black tracking-wide text-white">{sequence[0].title}</h3>
            <p className="mb-4 text-sm font-semibold text-[#d7b767]">{sequence[0].dates}</p>
            <p className="text-sm leading-relaxed text-white/58">{sequence[0].body}</p>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs italic text-white/44">
              “You do not come to MTA empty — you come loaded from 21 days in His presence.”
            </p>
          </motion.div>
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d7b767]/35 bg-[#d7b767]/10 text-[#d7b767]">
              <MoveRight className="h-5 w-5" />
            </div>
          </motion.div>
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/[0.045] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <p className="mta-kicker mb-3">{sequence[1].label}</p>
            <h3 className="mb-3 text-2xl font-black tracking-wide text-white">{sequence[1].title}</h3>
            <p className="mb-4 text-sm font-semibold text-[#d7b767]">{sequence[1].dates}</p>
            <p className="text-sm leading-relaxed text-white/58">{sequence[1].body}</p>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="mta-kicker mb-4">About The Assembly</p>
          <h2 className="mb-6 text-4xl font-black leading-tight text-white sm:text-6xl">
            A mature gathering for people rising into <span className="mta-gold-text">EXPLOITS</span>.
          </h2>
          <p className="mb-5 text-base leading-relaxed text-white/62">
            MTA is <strong className="text-white">HBG Ministry's major annual gathering</strong> — a multi-day conference of worship, prayer, the Word of God, and the tangible move of the Holy Spirit.
          </p>
          <p className="mb-8 text-base leading-relaxed text-white/62">
            Coming directly out of 21 days of corporate fasting and prayer, the atmosphere at MTA is already charged. The people arrive hungry, sharpened, and expectant. <strong className="text-white">Expect miracles. Expect the unusual. Expect your turnaround.</strong>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                className="mta-glass flex items-center gap-3 rounded-2xl p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
              >
                <Icon className="h-5 w-5 shrink-0 text-[#d7b767]" />
                <span className="text-sm font-semibold text-white/82">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mta-glass relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-10"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#d7b767]/60 to-transparent" />
          <p className="mb-6 font-serif text-2xl italic leading-relaxed text-white/86 sm:text-3xl">
            “The people that do know their God shall be strong, and do exploits.”
          </p>
          <p className="mta-kicker mb-8">Daniel 11:32 · KJV</p>
          <div className="mx-auto h-px w-24 bg-[#d7b767]/30" />
          <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-white/50">
            The theme is not performance. It is knowing God deeply enough to rise with strength, clarity, and holy authority.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutSection;
