import { useState } from "react";
import { UserPlus, ChevronDown, CheckCircle, Loader2 } from "lucide-react";

const designations = [
  "Pastor", "Bishop", "Apostle", "Prophet", "Prophetess",
  "Evangelist", "Deacon", "Deaconess", "Elder", "Reverend",
  "Church Leader", "Minister", "Missionary", "Christian Worker", "Other",
];

const inputStyle = { background: "rgba(255,255,255,0.055)", border: "1px solid rgba(200,183,255,0.2)" };
const inputClass =
  "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/32 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#c8b7ff]/45";
const labelClass =
  "block text-[#c8b7ff] text-xs font-semibold tracking-wider uppercase mb-1.5";

const fastOptions = [
  { value: "yes", label: "Yes, I will join", sub: "21 days of fasting & prayer" },
  { value: "try", label: "I will try / partially join", sub: "Join as grace enables" },
  { value: "no", label: "Not this time", sub: "Still receive your MTA registration" },
];

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
    ministry: "",
    designation: "",
    attendanceMode: "",
    fastCommitment: "no",
    desire: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.attendanceMode) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto mb-10">
        <div
          className="mta-glass rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(145deg, rgba(15,42,105,0.82), rgba(43,23,104,0.76))",
          }}
        >
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-[#2D0A4E]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Registration Complete!</h3>
          <p className="mb-2 text-sm leading-relaxed text-[#c8b7ff]">
            Thank you, <span className="font-semibold text-[#d7b767]">{formData.fullName}</span>!
            Your registration for MTA 2026 — EXPLOITS has been received.
          </p>
          <p className="text-white/60 text-xs leading-relaxed">
            You registered to attend{" "}
            <span className="text-white/80">
              {formData.attendanceMode === "online" ? "Online" : "In person — Akute, Nigeria"}
            </span>.<br />
            Fast commitment: <span className="text-white/80">
              {formData.fastCommitment === "yes"
                ? "Yes, I will join"
                : formData.fastCommitment === "try"
                  ? "I will try / partially join"
                  : "Not this time"}
            </span>.<br />
            A confirmation email is on its way to <span className="text-white/80">{formData.email}</span>.<br />
            <span className="text-[#d7b767]">Come expecting a fresh encounter with God.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mb-10">
      <div className="text-center mb-5">
        <p className="mta-kicker mb-3">
          Join Us
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Register Now</h3>
        <p className="text-white/50 text-sm">
          Fill in your details — a confirmation will be sent to your email
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mta-glass rounded-[1.75rem] p-6 sm:p-8"
        style={{
          background: "linear-gradient(145deg, rgba(15,42,105,0.78), rgba(43,23,104,0.72))",
        }}
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text" name="fullName" required value={formData.fullName}
              onChange={handleChange} placeholder="Enter your full name"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email" name="email" required value={formData.email}
              onChange={handleChange} placeholder="you@example.com"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              type="tel" name="phone" required value={formData.phone}
              onChange={handleChange} placeholder="+234 800 000 0000"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass}>WhatsApp Number <span className="text-white/30 normal-case">(optional)</span></label>
            <input
              type="tel" name="whatsapp" value={formData.whatsapp}
              onChange={handleChange} placeholder="If different from phone"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass}>How will you attend?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "in_person", label: "In person", sub: "Akute, Nigeria" },
                { value: "online", label: "Online", sub: "Livestream" },
              ].map((opt) => {
                const active = formData.attendanceMode === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, attendanceMode: opt.value })}
                    className="rounded-xl px-4 py-3 text-left transition-all duration-300"
                    style={{
                      background: active ? "rgba(201,151,42,0.18)" : "rgba(155,114,170,0.1)",
                      border: active ? "1px solid rgba(215,183,103,0.65)" : "1px solid rgba(200,183,255,0.2)",
                    }}
                  >
                    <span className="block text-sm font-semibold text-white">{opt.label}</span>
                    <span className="block text-[11px] text-white/40">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Will you join the 21 Days of Fasting & Prayer?</label>
            <div className="space-y-2">
              {fastOptions.map((opt) => {
                const active = formData.fastCommitment === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, fastCommitment: opt.value })}
                    className="w-full rounded-xl px-4 py-3 text-left transition-all duration-300"
                    style={{
                      background: active ? "rgba(201,151,42,0.18)" : "rgba(155,114,170,0.1)",
                      border: active ? "1px solid rgba(215,183,103,0.65)" : "1px solid rgba(200,183,255,0.2)",
                    }}
                  >
                    <span className="block text-sm font-semibold text-white">{opt.label}</span>
                    <span className="block text-[11px] text-white/40">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Ministry / Church</label>
            <input
              type="text" name="ministry" required value={formData.ministry}
              onChange={handleChange} placeholder="Your ministry or church name"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div className="relative">
            <label className={labelClass}>Designation</label>
            <div className="relative">
              <select
                name="designation" required value={formData.designation} onChange={handleChange}
                className={`${inputClass} appearance-none cursor-pointer`}
                style={{ background: "rgba(10,22,55,0.95)", border: "1px solid rgba(200,183,255,0.2)" }}
              >
                <option value="" disabled style={{ background: "#07142B", color: "#C8B7FF" }}>
                  Select your designation
                </option>
                {designations.map((d) => (
                  <option key={d} value={d} style={{ background: "#07142B", color: "#fff" }}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8b7ff]" />
            </div>
          </div>

          <div>
            <label className={labelClass}>What do you desire from MTA 2026?</label>
            <textarea
              name="desire" required value={formData.desire} onChange={handleChange}
              placeholder="Share your expectation or prayer request..." rows={3}
              className={`${inputClass} resize-none`} style={inputStyle}
            />
          </div>
        </div>

        {status === "error" && (
          <p className="text-red-400 text-xs text-center mt-3">
            {!formData.attendanceMode
              ? "Please choose how you'll attend (in person or online)."
              : "Something went wrong. Please try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mta-primary-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting"
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            : <><UserPlus className="w-4 h-4" /> Complete Registration</>
          }
        </button>

        <p className="text-white/30 text-[10px] text-center mt-3">
          Free registration • Your details go directly to the MTA team
        </p>
      </form>
    </div>
  );
};

export default RegistrationForm;
