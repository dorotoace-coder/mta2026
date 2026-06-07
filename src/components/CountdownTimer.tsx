import { useState, useEffect } from "react";

const CountdownTimer = () => {
  const target = new Date("2026-09-04T09:00:00").getTime();
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      setTime({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const Unit = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-4xl sm:text-6xl font-black text-white tabular-nums"
        style={{ textShadow: "0 0 30px rgba(255,69,0,0.5)" }}>
        {String(val).padStart(2, "0")}
      </div>
      <div className="text-[10px] font-bold tracking-widest uppercase mt-1" style={{ color: "#C9972A" }}>{label}</div>
    </div>
  );

  return (
    <div className="flex items-center gap-4 sm:gap-8">
      <Unit val={time.days}  label="Days" />
      <span className="text-3xl font-bold" style={{ color: "#C9972A" }}>:</span>
      <Unit val={time.hours} label="Hours" />
      <span className="text-3xl font-bold" style={{ color: "#C9972A" }}>:</span>
      <Unit val={time.mins}  label="Mins" />
      <span className="text-3xl font-bold" style={{ color: "#C9972A" }}>:</span>
      <Unit val={time.secs}  label="Secs" />
    </div>
  );
};

export default CountdownTimer;
