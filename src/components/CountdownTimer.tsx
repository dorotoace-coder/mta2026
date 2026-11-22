import { useState, useEffect } from "react";
import { currentEvent, getEventPhase, type EventPhase } from "@/config/events";

const TARGET = new Date(currentEvent.start).getTime();

const CountdownTimer = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [phase, setPhase] = useState<EventPhase>("before");

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = TARGET - now;
      if (diff <= 0) {
        setPhase(getEventPhase(currentEvent, now));
        setTime({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      setPhase("before");
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.mins },
    { label: "Seconds", value: time.secs },
  ];

  const heading =
    phase === "live" ? "It's happening now" : phase === "past" ? "Thank you for joining us" : "The doors open in";

  return (
    <section id="countdown" aria-label="Countdown" className="relative px-5 sm:px-8">
      <div
        data-reveal
        className="mta-glass relative mx-auto flex max-w-5xl flex-col items-center gap-8 overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 lg:flex-row lg:justify-between lg:gap-10 lg:py-9"
      >
        <div aria-hidden className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#e8c977]/70 to-transparent" />

        <div className="text-center lg:text-left">
          <p className="mta-kicker mb-2">{phase === "past" ? currentEvent.subtitle : "Mark your calendar"}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{heading}</h2>
          <p className="mt-2 text-sm text-white/60">
            {currentEvent.dateLabel} · {currentEvent.venue}
            {currentEvent.online ? " & Online" : ""}
          </p>
        </div>

        {/* A row of zeros once the doors open is noise — only count down before. */}
        {phase === "before" && (
          <div className="grid w-full max-w-lg grid-cols-4 lg:w-auto" role="timer" aria-live="off">
            {units.map((unit, i) => (
              <div
                key={unit.label}
                className={`flex flex-col items-center px-2 sm:px-5 ${i > 0 ? "border-l border-white/10" : ""}`}
              >
                <span className="mta-gold-text text-4xl font-extrabold leading-none tabular-nums sm:text-6xl">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/50 sm:text-[11px]">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CountdownTimer;
