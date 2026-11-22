import { Fragment } from "react";
import { BookOpen, Crown, Landmark, MoveRight, Waves } from "lucide-react";
import { currentEvent } from "@/config/events";

const ICONS = {
  crown: Crown,
  waves: Waves,
  book: BookOpen,
  landmark: Landmark,
} as const;

const AboutSection = () => {
  const { leadIn, about, scripture } = currentEvent;

  return (
    <section id="about" className="mta-section scroll-mt-20">
      <div className="mta-container">
        {/* Run-up season. MTA had a 21-day fast; a one-night concert has
            nothing before it, so the whole rail is skipped rather than
            rendered empty. */}
        {leadIn.length > 0 && (
          <div data-reveal className="mb-20 rounded-[2rem] p-6 mta-panel sm:p-8">
            <p className="mta-kicker mb-6">
              Divine Sequence — The Road to {currentEvent.name}
            </p>
            <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              {leadIn.map((step, i) => (
                <Fragment key={step.title}>
                  {i > 0 && (
                    <div className="flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ffd96b]/40 bg-[#ffd96b]/10 text-[#ffd96b]">
                        <MoveRight className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                  <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-6">
                    <p className="mta-kicker mb-3">{step.label}</p>
                    <h3 className="mb-3 text-2xl font-black tracking-wide text-white">
                      {step.title}
                    </h3>
                    <p className="mb-4 text-sm font-semibold text-[#ffd96b]">
                      {step.dates}
                    </p>
                    <p className="text-sm leading-relaxed text-white/72">{step.body}</p>
                    {step.quote && (
                      <p className="mt-5 border-t border-white/12 pt-4 text-xs italic text-white/58">
                        &ldquo;{step.quote}&rdquo;
                      </p>
                    )}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div data-reveal>
            <p className="mta-kicker mb-5">{about.kicker}</p>
            <h2 className="mta-heading mb-8 text-[2.6rem] sm:text-6xl">
              {about.headline} <span className="mta-gold-text">{about.highlight}</span>.
            </h2>

            <div className="space-y-5 border-l border-[#e8c977]/30 pl-6">
              {about.paragraphs.map((para, i) => (
                <p
                  key={para}
                  className={
                    i === 0
                      ? "text-lg leading-relaxed text-white/85"
                      : "text-base leading-relaxed text-white/68"
                  }
                >
                  {para}
                </p>
              ))}
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-3">
              {about.features.map(({ icon, label }) => {
                const Icon = ICONS[icon];
                return (
                  <li
                    key={label}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-colors hover:border-[#e8c977]/40 hover:bg-white/[0.07]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffe9a8]/25 to-[#ba80ff]/20 ring-1 ring-inset ring-[#e8c977]/30">
                      <Icon className="h-[18px] w-[18px] text-[#ffd96b]" aria-hidden />
                    </span>
                    <span className="text-sm font-bold leading-tight text-white/90">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <figure
            data-reveal
            style={{ ["--reveal-delay" as string]: "120ms" }}
            className="mta-glass relative overflow-hidden rounded-[2rem] px-8 pb-10 pt-14 text-center sm:px-12"
          >
            <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#e8c977]/80 to-transparent" />
            <div
              aria-hidden
              className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(255,217,107,0.35), transparent 70%)" }}
            />
            <span
              aria-hidden
              className="mta-scripture pointer-events-none absolute left-6 top-2 select-none text-[7rem] leading-none text-[#e8c977]/20"
            >
              &ldquo;
            </span>
            <Crown className="relative mx-auto mb-6 h-7 w-7 text-[#e8c977]" aria-hidden />
            <blockquote className="mta-scripture relative text-[1.65rem] leading-snug text-white/95 sm:text-[2rem]">
              {scripture.text}
            </blockquote>
            <figcaption className="relative mt-6">
              <span className="mta-kicker">{scripture.ref}</span>
              <div className="mta-ornament my-7 text-[10px]" aria-hidden>◆</div>
              <span className="block text-sm leading-relaxed text-white/65">{currentEvent.hero.subhead}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
