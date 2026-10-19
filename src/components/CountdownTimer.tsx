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

  return (
    <section id="countdown" className="mta-section">
      <div className="mta-container text-center">
        <p className="mta-kicker mb-4">
          {phase === "live"
            ? "It's Happening Now"
            : phase === "past"
              ? "Thank You For Joining Us"
              : "Mark Your Calendar"}
        </p>
        <h2 className="mb-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
          {phase === "past" ? (
            <>
              <span className="mta-gold-text">{currentEvent.subtitle}</span> Has Ended
            </>
          ) : (
            <>
              Countdown to{" "}
              <span className="mta-gold-text">{currentEvent.subtitle}</span>
            </>
          )}
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-sm uppercase tracking-[0.32em] text-white/70 sm:text-base">
          {currentEvent.dateLabel} · {currentEvent.venue}
          {currentEvent.online ? " & Online" : ""}
        </p>

        {/* A row of zeros after the event is noise — hide it once past. */}
        <div
          className={`mx-auto flex max-w-4xl items-stretch justify-center gap-3 sm:gap-6 ${
            phase === "past" ? "hidden" : ""
          }`}
        >
          {units.map((unit) => (
            <div
              key={unit.label}
              className="mta-glass flex flex-1 flex-col items-center justify-center rounded-3xl px-2 py-6 sm:py-9"
            >
              <div
                className="mta-gold-text text-5xl font-black leading-none tabular-nums sm:text-8xl"
                style={{ textShadow: "0 18px 40px rgba(126,115,255,0.25)" }}
              >
                {String(unit.value).padStart(2, "0")}
              </div>
              <div className="mta-kicker mt-3 text-[10px] sm:text-xs">{unit.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CountdownTimer;
