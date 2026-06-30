const AboutSection = () => (
  <section id="about" className="relative py-24 overflow-hidden"
    style={{ background: "linear-gradient(180deg, #0d0002 0%, #150005 100%)" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">

      {/* We Wait → MTA Timeline Banner */}
      <div className="mb-20 rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,69,0,0.08), rgba(201,151,42,0.06))", border: "1px solid rgba(201,151,42,0.2)" }}>
        <div className="p-6 sm:p-8">
          <p className="text-[#C9972A] text-[10px] font-black tracking-[0.3em] uppercase mb-5">Divine Sequence — The Road to MTA</p>
          <div className="flex flex-col sm:flex-row items-stretch gap-0">

            {/* We Wait block */}
            <div className="flex-1 p-5 rounded-xl"
              style={{ background: "rgba(255,69,0,0.08)", border: "1px solid rgba(255,69,0,0.2)" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🙏</span>
                <div>
                  <p className="text-white font-black text-base">We Wait</p>
                  <p className="text-[#ff9a3c] text-xs font-bold tracking-widest uppercase">21 Days Fasting & Prayer</p>
                </div>
              </div>
              <p className="text-white/55 text-sm leading-relaxed mb-3">
                August 13 – September 2, 2026. A season of consecration, intercession and spiritual sharpening. Every fast ends with a breakthrough.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff6b2b]" style={{ boxShadow: "0 0 8px rgba(255,107,43,0.8)" }}></div>
                <span className="text-[#ff9a3c] text-xs font-bold">Aug 13 → Sep 2</span>
              </div>
            </div>

            {/* Arrow connector */}
            <div className="flex items-center justify-center px-4 py-4 sm:py-0">
              <div className="flex flex-col items-center gap-1">
                <div className="hidden sm:block w-px h-8" style={{ background: "linear-gradient(180deg, rgba(255,69,0,0.4), rgba(201,151,42,0.4))" }}></div>
                <span className="text-[#C9972A] font-black text-xl sm:text-2xl">→</span>
                <p className="text-white/30 text-[9px] font-bold tracking-widest uppercase">2 days</p>
                <div className="hidden sm:block w-px h-8" style={{ background: "linear-gradient(180deg, rgba(201,151,42,0.4), rgba(255,69,0,0.4))" }}></div>
              </div>
            </div>

            {/* MTA block */}
            <div className="flex-1 p-5 rounded-xl"
              style={{ background: "rgba(201,151,42,0.1)", border: "1px solid rgba(201,151,42,0.3)" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-white font-black text-base">MTA 2026</p>
                  <p className="text-[#C9972A] text-xs font-bold tracking-widest uppercase">Mighty Turn Around Assembly</p>
                </div>
              </div>
              <p className="text-white/55 text-sm leading-relaxed mb-3">
                September 4–6, 2026. You fast for 21 days — then you walk straight into your turnaround. The fast prepares the ground. MTA is the harvest.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C9972A]" style={{ boxShadow: "0 0 8px rgba(201,151,42,0.8)", animation: "pulse 2s infinite" }}></div>
                <span className="text-[#C9972A] text-xs font-bold">Sep 4 → Sep 6 · 9:00 AM Daily</span>
              </div>
            </div>

          </div>
          <p className="text-center text-white/30 text-xs mt-5 italic">
            "You don't come to MTA empty — you come loaded from 21 days in His presence."
          </p>
        </div>
      </div>

      {/* About grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[#C9972A] text-xs font-bold tracking-widest uppercase mb-4">About The Assembly</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            What Is the Mighty<br/>Turn Around Assembly?
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-6">
            MTA is <strong className="text-white">HBG Ministry's major annual gathering</strong> — a multi-day conference of prayer, prophetic worship, the Word of God, and the tangible move of the Holy Spirit. It is a season where we don't just attend a program — <strong className="text-white">we encounter God.</strong>
          </p>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            Coming directly out of 21 days of corporate fasting and prayer, the atmosphere at MTA is already charged. The people arrive hungry, sharpened and expectant. <strong className="text-white">Expect miracles. Expect the unusual. Expect your turnaround.</strong>
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🔥", label: "3 Days of EXPLOITS" },
              { icon: "🙏", label: "Prophetic Prayer" },
              { icon: "📖", label: "Mighty Word" },
              { icon: "🌊", label: "Rivers of Power" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: "rgba(255,69,0,0.06)", border: "1px solid rgba(201,151,42,0.15)" }}>
                <span className="text-2xl">{f.icon}</span>
                <span className="text-white/80 text-sm font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verse card */}
        <div className="relative">
          <div className="rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(255,69,0,0.12), rgba(201,151,42,0.08))", border: "1px solid rgba(201,151,42,0.25)" }}>
            <p className="text-5xl mb-6" style={{ filter: "drop-shadow(0 0 20px rgba(255,69,0,0.5))" }}>🔥</p>
            <p className="font-serif text-lg sm:text-2xl italic text-white/85 leading-relaxed mb-6">
              "There is a river whose streams make glad the city of God, the holy place where the Most High dwells."
            </p>
            <p className="text-[#C9972A] text-sm font-bold tracking-widest uppercase">Psalm 46 : 4</p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/35 text-xs italic">After 21 days of seeking — the river breaks through.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full calendar context */}
      <div className="mt-20">
        <p className="text-[#C9972A] text-[10px] font-black tracking-[0.3em] uppercase mb-8 text-center">2026 Ministry Sequence Leading to MTA</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { month: "Jan–Feb", name: "STIR UP", desc: "21 days prayer & fasting to open the year", icon: "⚡" },
            { month: "Jun", name: "HBG Worship Sound", desc: "Seasonal worship sound — completed ✓", icon: "🎶" },
            { month: "Aug 13–Sep 2", name: "We Wait", desc: "21 days fasting & prayer — direct entry into MTA", icon: "🙏" },
            { month: "Sep 4–6", name: "MTA 2026", desc: "Mighty Turn Around Assembly — the culmination", icon: "🔥", highlight: true },
          ].map((e) => (
            <div key={e.name} className="p-5 rounded-xl text-center"
              style={{
                background: e.highlight ? "rgba(201,151,42,0.12)" : "rgba(255,255,255,0.03)",
                border: e.highlight ? "1px solid rgba(201,151,42,0.35)" : "1px solid rgba(255,255,255,0.06)",
                boxShadow: e.highlight ? "0 0 30px rgba(201,151,42,0.1)" : "none"
              }}>
              <div className="text-3xl mb-2">{e.icon}</div>
              <p className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: e.highlight ? "#C9972A" : "rgba(255,255,255,0.3)" }}>{e.month}</p>
              <p className="text-white font-bold text-sm mb-2">{e.name}</p>
              <p className="text-white/40 text-[11px] leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  </section>
);

export default AboutSection;
