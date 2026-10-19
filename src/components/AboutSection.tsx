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
    <section id="about" className="mta-section">
      <div className="mta-container">
        {/* Run-up season. MTA had a 21-day fast; a one-night concert has
            nothing before it, so the whole rail is skipped rather than
            rendered empty. */}
        {leadIn.length > 0 && (
          <div className="mb-20 rounded-[2rem] p-6 mta-panel sm:p-8">
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

        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mta-kicker mb-4">{about.kicker}</p>
            <h2 className="mb-6 text-4xl font-black leading-tight text-white sm:text-6xl">
              {about.headline} <span className="mta-gold-text">{about.highlight}</span>.
            </h2>
            {about.paragraphs.map((para) => (
              <p key={para} className="mb-5 text-base leading-relaxed text-white/75">
                {para}
              </p>
            ))}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {about.features.map(({ icon, label }) => {
                const Icon = ICONS[icon];
                return (
                  <div
                    key={label}
                    className="mta-glass flex items-center gap-3 rounded-2xl p-4"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#ffd96b]" />
                    <span className="text-sm font-semibold text-white/90">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mta-glass relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd96b]/70 to-transparent" />
            <p className="mb-6 font-serif text-2xl italic leading-relaxed text-white/92 sm:text-3xl">
              &ldquo;{scripture.text}&rdquo;
            </p>
            <p className="mta-kicker mb-8">{scripture.ref}</p>
            <div className="mx-auto h-px w-24 bg-[#ffd96b]/40" />
            <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-white/65">
              {currentEvent.hero.subhead}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
