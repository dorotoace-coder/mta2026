import { ArrowRight, CalendarDays, MapPin, MonitorPlay, Sparkles } from "lucide-react";
import { currentEvent } from "@/config/events";

const scrollToSection = (id: string) => {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HeroSection = () => {
  const { flyer } = currentEvent;
  const meta = [
    { icon: CalendarDays, text: currentEvent.dateLabel },
    { icon: MapPin, text: currentEvent.venue },
    ...(currentEvent.online ? [{ icon: MonitorPlay, text: "Live Online" }] : []),
  ];

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      {/* Atmosphere: a throne-light glow above, a soft floor of light below. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-[-12rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,217,107,0.22), rgba(186,128,255,0.18) 45%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[28rem] w-[70rem] -translate-x-1/2 rounded-[50%] border border-white/10 opacity-40"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.07), transparent)",
            transform: "translateX(-50%) perspective(900px) rotateX(70deg)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <div
            data-reveal
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e8c977]/30 bg-white/[0.05] px-4 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#e8c977]" />
            <span className="mta-kicker text-[0.68rem]">{currentEvent.kicker}</span>
          </div>

          <h1 data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
            <span className="block text-sm font-extrabold uppercase tracking-[0.5em] text-[#d8c4ff] sm:text-base">
              {currentEvent.name}
            </span>
            <span
              className="mt-3 block text-[3.6rem] font-extrabold leading-[0.88] tracking-[-0.035em] sm:text-[6.5rem] lg:text-[7.25rem] xl:text-[8.25rem]"
              style={{
                background: "linear-gradient(180deg, #fff6d6 0%, #ffd96b 45%, #d9a83f 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 12px 40px rgba(186,128,255,0.35))",
              }}
            >
              {currentEvent.theme.split(" ").map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <figure
            data-reveal
            style={{ ["--reveal-delay" as string]: "160ms" }}
            className="mx-auto mt-8 max-w-xl lg:mx-0"
          >
            <blockquote className="mta-scripture text-xl leading-snug text-white/90 sm:text-[1.65rem]">
              &ldquo;{currentEvent.scripture.text}&rdquo;
            </blockquote>
            <figcaption className="mta-kicker mt-3">{currentEvent.scripture.ref}</figcaption>
          </figure>

          <p
            data-reveal
            style={{ ["--reveal-delay" as string]: "220ms" }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 lg:mx-0"
          >
            {currentEvent.hero.description}
          </p>

          <ul
            data-reveal
            style={{ ["--reveal-delay" as string]: "280ms" }}
            className="mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start"
          >
            {meta.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80"
              >
                <Icon className="h-4 w-4 text-[#e8c977]" aria-hidden /> {text}
              </li>
            ))}
          </ul>

          <div
            data-reveal
            style={{ ["--reveal-delay" as string]: "340ms" }}
            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <button
              onClick={() => scrollToSection("#register")}
              className="mta-primary-button group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              {currentEvent.registrationOpen ? "Register Free" : "Reserve Your Place"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
            <button
              onClick={() => scrollToSection("#schedule")}
              className="mta-secondary-button rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.14em]"
            >
              View Programme
            </button>
          </div>
        </div>

        {/* Flyer. Skipped entirely for events without one. */}
        {flyer && (
          <div
            data-reveal
            style={{ ["--reveal-delay" as string]: "200ms" }}
            className="relative mx-auto w-full max-w-[22rem] sm:max-w-sm lg:max-w-[26rem]"
          >
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[3rem] opacity-80 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(186,128,255,0.55), rgba(255,217,107,0.18) 55%, transparent 75%)" }}
            />
            <div className="animate-float relative rounded-[1.9rem] bg-gradient-to-b from-[#ffe9a8]/70 via-[#e8c977]/25 to-[#ba80ff]/40 p-px shadow-[0_40px_100px_rgba(10,4,40,0.55)]">
              <img
                src={flyer.src}
                alt={flyer.alt}
                width={987}
                height={1093}
                fetchPriority="high"
                className="block w-full rounded-[1.85rem]"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
