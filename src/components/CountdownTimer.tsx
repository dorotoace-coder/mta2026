import { useState, useEffect } from "react";

const TARGET = new Date("2026-09-04T09:00:00").getTime();

const CountdownTimer = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [live, setLive] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = TARGET - Date.now();
      if (diff <= 0) {
        setLive(true);
        setTime({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
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
          {live ? "It's Happening Now" : "Mark Your Calendar"}
        </p>
        <h2 className="mb-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
          Countdown to <span className="mta-gold-text">MTA 2026</span>
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-sm uppercase tracking-[0.32em] text-white/55 sm:text-base">
          September 4–6, 2026 · HBG Ministry, Akute
        </p>

        <div className="mx-auto flex max-w-4xl items-stretch justify-center gap-3 sm:gap-6">
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
