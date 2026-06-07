import { useEffect, useRef } from "react";

const HeroSection = () => {
  const scrollToRegister = () => {
    const el = document.querySelector("#register");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToSchedule = () => {
    const el = document.querySelector("#schedule");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Fire/river ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse, #ff4500 0%, #c0392b 30%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #d4af37 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #8B0000 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#C9972A]/15 border border-[#C9972A]/35 rounded-full px-5 py-2 mb-8">
          <span className="text-[#C9972A] text-xs font-bold tracking-widest uppercase">HBG Ministry Annual Assembly</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl sm:text-8xl font-black text-white mb-3 leading-none tracking-tight"
          style={{ textShadow: "0 0 60px rgba(255,69,0,0.4), 0 0 120px rgba(201,151,42,0.2)" }}>
          MTA <span style={{ color: "#C9972A" }}>2026</span>
        </h1>
        <p className="text-lg sm:text-2xl font-bold text-white/70 tracking-[0.12em] uppercase mb-2">
          Mighty Turn Around Assembly
        </p>
        <p className="text-base sm:text-lg font-medium italic mb-8"
          style={{ color: "rgba(201,151,42,0.85)" }}>
          "There is a river whose streams make glad the city of God"
        </p>
        <p className="text-white/50 text-sm mb-10 max-w-xl mx-auto leading-relaxed">
          A gathering of fire, prayer, and prophetic power —<br/>
          where rivers of God move without restraint.
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10 text-sm">
          {[
            { icon: "📅", text: "September 4–6, 2026" },
            { icon: "📍", text: "Akute, Nigeria" },
            { icon: "🌐", text: "Zoom Livestream" },
            { icon: "✦", text: "Free Registration" },
          ].map((p) => (
            <span key={p.text} className="flex items-center gap-2 px-4 py-2 rounded-full border text-white/70"
              style={{ background: "rgba(201,151,42,0.08)", borderColor: "rgba(201,151,42,0.25)" }}>
              {p.icon} {p.text}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={scrollToRegister}
            className="px-10 py-4 rounded-full font-black text-sm tracking-widest uppercase shadow-2xl transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #C9972A, #d4af37)", color: "#1a0000", boxShadow: "0 0 30px rgba(201,151,42,0.4)" }}>
            Register Free →
          </button>
          <button onClick={scrollToSchedule}
            className="px-10 py-4 rounded-full font-bold text-sm tracking-widest uppercase border border-white/20 text-white/70 hover:border-white/40 transition-all">
            View Programme ↓
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
