import { useState } from "react";
const links = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "Register", href: "#register" },
];
const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: "rgba(10,0,3,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(201,151,42,0.1)" }}>
      <div className="flex items-center gap-3">
        <img src="/hbg-logo.svg" alt="HBG" className="w-9 h-9" style={{ filter: "drop-shadow(0 0 8px rgba(255,69,0,0.6))" }} />
        <div>
          <div className="text-white font-bold text-sm">MTA <span style={{ color: "#C9972A" }}>2026</span></div>
          <div className="text-white/40 text-[9px] tracking-widest uppercase">Mighty Turn Around Assembly</div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="text-white/60 hover:text-white text-sm font-medium transition-colors">{l.label}</a>
        ))}
        <a href="#register" className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #C9972A, #d4af37)", color: "#0d0002" }}>Register Free</a>
      </div>
    </nav>
  );
};
export default Navbar;
