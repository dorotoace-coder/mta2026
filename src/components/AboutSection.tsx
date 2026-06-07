const AboutSection = () => (
  <section id="about" className="relative py-24 overflow-hidden"
    style={{ background: "linear-gradient(180deg, #0d0002 0%, #150005 100%)" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
            After the fresh oil released through ILPC 2026, MTA 2026 is the next great wave — bigger, deeper, and wider in its reach. <strong className="text-white">Expect miracles. Expect the unusual. Expect your turnaround.</strong>
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🔥", label: "3 Days of Fire" },
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
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: "repeating-linear-gradient(45deg, #C9972A 0px, #C9972A 1px, transparent 1px, transparent 20px)" }} />
            <p className="text-5xl mb-6" style={{ filter: "drop-shadow(0 0 20px rgba(255,69,0,0.5))" }}>🔥</p>
            <p className="font-serif text-lg sm:text-2xl italic text-white/85 leading-relaxed mb-6">
              "There is a river whose streams make glad the city of God, the holy place where the Most High dwells."
            </p>
            <p className="text-[#C9972A] text-sm font-bold tracking-widest uppercase">Psalm 46 : 4</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
