import RegistrationForm from "./RegistrationForm";
import { currentEvent } from "@/config/events";

const RegisterSection = () => (
  <section id="register" className="mta-section scroll-mt-20">
    {/* Glow behind the call to action */}
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
      style={{ background: "radial-gradient(circle, rgba(186,128,255,0.35), rgba(255,217,107,0.12) 50%, transparent 72%)" }}
    />
    <div className="mta-container max-w-3xl">
      <div data-reveal className="mb-12 text-center">
        <p className="mta-kicker mb-4">
          {currentEvent.registrationOpen ? "Secure Your Place" : "Save The Date"}
        </p>
        <h2 className="mta-heading text-[2.6rem] sm:text-6xl">
          {currentEvent.registrationOpen ? "Register for " : "Join us for "}
          <span className="mta-gold-text">{currentEvent.subtitle}</span>
        </h2>
        <div className="mta-ornament my-6 text-[10px]" aria-hidden>◆</div>
        <p className="mx-auto max-w-lg text-base leading-relaxed text-white/70">
          {currentEvent.registrationOpen ? (
            <>
              Don&rsquo;t miss this divine appointment. Registration is absolutely{" "}
              <strong className="text-[#ffd96b]">free</strong>.
            </>
          ) : (
            <>
              {currentEvent.dateLabel} &middot; {currentEvent.venue}
              {currentEvent.online ? " & Online" : ""}
            </>
          )}
        </p>
      </div>
      <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
        <RegistrationForm />
      </div>
    </div>
  </section>
);

export default RegisterSection;
