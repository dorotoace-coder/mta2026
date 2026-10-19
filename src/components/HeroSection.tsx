import { CalendarDays, MapPin, MonitorPlay, Sparkles } from "lucide-react";
import { currentEvent } from "@/config/events";

const scrollToSection = (id: string) => {
  const el = document.querySelector(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
};

const HeroSection = () => {
  const scrollToRegister = () => scrollToSection("#register");
  const scrollToSchedule = () => scrollToSection("#schedule");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-24">
      {/* Premium blue/violet atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 22%, rgba(126,115,255,0.34), transparent 34rem), radial-gradient(circle at 50% 60%, rgba(215,183,103,0.16), transparent 30rem)" }} />
        <div className="absolute left-1/2 top-[14%] h-[520px] w-[920px] -translate-x-1/2 rounded-[50%] border border-white/10 opacity-40"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.015))", transform: "translateX(-50%) perspective(900px) rotateX(62deg)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-64"
          style={{ background: "linear-gradient(0deg, rgba(5,8,22,1), rgba(5,8,22,0))" }} />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d7b767]/30 bg-white/[0.04] px-5 py-2">
          <Sparkles className="h-3.5 w-3.5 text-[#d7b767]" />
          <span className="mta-kicker">{currentEvent.kicker}</span>
        </div>

        <h1 className="mb-2 text-5xl font-black leading-none tracking-[0.12em] text-white sm:text-7xl">
          {currentEvent.name}
        </h1>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.38em] text-[#d8c4ff] sm:text-lg">
          {currentEvent.subtitle}
        </p>
        <p className="mx-auto mb-4 max-w-5xl text-[4.5rem] font-black leading-[0.84] tracking-tight sm:text-[8rem] lg:text-[10.5rem]"
          style={{ color: "#ffd96b", textShadow: "0 18px 0 rgba(28,20,64,0.9), 0 0 110px rgba(186,128,255,0.42)" }}>
          {currentEvent.theme}
        </p>
        <p className="mx-auto mb-4 max-w-2xl font-serif text-lg italic leading-relaxed text-[#faf8ff]/90 sm:text-2xl">
          &ldquo;{currentEvent.scripture.text}&rdquo;
        </p>
        <p className="mta-kicker mb-10">{currentEvent.scripture.ref}</p>
        <p className="mx-auto mb-10 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
          {currentEvent.hero.description}
        </p>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          {[
            { icon: CalendarDays, text: currentEvent.dateLabel },
            { icon: MapPin, text: currentEvent.venue },
            ...(currentEvent.online ? [{ icon: MonitorPlay, text: "Online Access" }] : []),
            ...(currentEvent.registrationOpen
              ? [{ icon: Sparkles, text: "Free Registration" }]
              : []),
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="mta-glass flex items-center gap-2 rounded-full px-4 py-2 text-white/76">
              <Icon className="h-4 w-4 text-[#d7b767]" /> {text}
            </span>
          ))}
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button onClick={scrollToRegister}
            className="mta-primary-button rounded-full px-10 py-4 text-sm font-black uppercase tracking-widest transition-all hover:scale-105">
            {currentEvent.registrationOpen ? "Register Free" : "Reserve Your Place"}
          </button>
          <button onClick={scrollToSchedule}
            className="mta-secondary-button rounded-full px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all hover:border-white/40">
            View Programme
          </button>
        </div>

        {/* Event flyer. Skipped entirely for events without one. */}
        {currentEvent.flyer && (
          <div className="mt-14 flex justify-center">
            <img
              src={currentEvent.flyer.src}
              alt={currentEvent.flyer.alt}
              width={987}
              height={1093}
              loading="lazy"
              className="w-full max-w-sm rounded-[1.75rem] border border-[#ffd96b]/25 shadow-[0_24px_80px_rgba(186,128,255,0.35)]"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
