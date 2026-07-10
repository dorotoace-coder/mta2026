import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "Register", href: "#register" },
];
const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{ background: "rgba(5,8,22,0.82)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(200,183,255,0.14)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <img src="/hbg-logo.svg" alt="HBG" className="h-9 w-14 object-contain" style={{ filter: "drop-shadow(0 0 12px rgba(200,183,255,0.28))" }} />
        <div>
          <div className="text-sm font-bold text-white">MTA <span className="mta-gold-text">2026</span></div>
          <div className="text-[9px] uppercase tracking-widest text-white/45">Mighty Turn Around Assembly</div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="text-sm font-medium text-white/62 transition-colors hover:text-white">{l.label}</a>
        ))}
        <a href="#register" className="mta-primary-button rounded-full px-5 py-2 text-sm font-bold transition-all hover:scale-105">Register Free</a>
      </div>
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/75 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      </div>
      {open && (
        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-[#07142b]/95 p-4 md:hidden">
          <div className="grid gap-2">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
