import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { currentEvent } from "@/config/events";

const links = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Programme", href: "#schedule" },
  { label: "Register", href: "#register" },
];

const ctaLabel = currentEvent.registrationOpen ? "Register Free" : "Reserve a Place";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid
          ? "border-b border-white/10 bg-[#140e33]/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#" className="flex items-center gap-3" aria-label={`${currentEvent.name} — back to top`}>
          <img
            src="/hbg-logo.svg"
            alt=""
            className="h-9 w-14 object-contain"
            style={{ filter: "drop-shadow(0 0 12px rgba(200,183,255,0.28))" }}
          />
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-wide text-white">{currentEvent.name}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
              {currentEvent.subtitle}
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <a href="#register" className="mta-primary-button ml-3 rounded-full px-5 py-2.5 text-sm font-extrabold">
            {ctaLabel}
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-[#1a1240]/95 p-3 shadow-2xl md:hidden">
          <div className="grid gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#register"
              onClick={() => setOpen(false)}
              className="mta-primary-button mt-2 rounded-xl px-4 py-3 text-center text-sm font-extrabold"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
