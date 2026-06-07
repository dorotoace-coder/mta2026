import RegistrationForm from "./RegistrationForm";

const RegisterSection = () => (
  <section id="register" className="relative py-24 overflow-hidden"
    style={{ background: "linear-gradient(180deg, #1a0008 0%, #0d0002 100%)" }}>
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, #ff4500, transparent)", filter: "blur(100px)" }} />
    </div>
    <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <p className="text-[#C9972A] text-xs font-bold tracking-widest uppercase mb-4">Secure Your Place</p>
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Register for MTA 2026</h2>
        <p className="text-white/50 text-base">Don't miss this divine appointment. Registration is absolutely <strong className="text-[#C9972A]">FREE</strong>.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-white/40">
          {["3 days of encounter", "Prophetic impartation", "Divine turnaround", "Free materials"].map((f) => (
            <span key={f} className="flex items-center gap-1">✦ {f}</span>
          ))}
        </div>
      </div>
      <RegistrationForm />
    </div>
  </section>
);

export default RegisterSection;
