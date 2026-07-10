import RegistrationForm from "./RegistrationForm";
import { Check } from "lucide-react";

const RegisterSection = () => (
  <section id="register" className="mta-section">
    <div className="mta-container max-w-3xl">
      <div className="mb-12 text-center">
        <p className="mta-kicker mb-4">Secure Your Place</p>
        <h2 className="mb-4 text-4xl font-black text-white sm:text-6xl">Register for <span className="mta-gold-text">MTA 2026</span></h2>
        <p className="text-base text-white/58">Don't miss this divine appointment. Registration is absolutely <strong className="text-[#d7b767]">FREE</strong>.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-white/56">
          {["Opening Night", "Divine Turnaround", "Supernatural Encounters", "Celebration Service", "Free Registration"].map((f) => (
            <span key={f} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
              <Check className="h-3.5 w-3.5 text-[#d7b767]" /> {f}
            </span>
          ))}
        </div>
      </div>
      <RegistrationForm />
    </div>
  </section>
);

export default RegisterSection;
