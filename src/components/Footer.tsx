import { Heart } from "lucide-react";
import { currentEvent } from "@/config/events";

const Footer = () => (
  <footer className="relative border-t border-white/10 bg-[#120c2e]/70">
    <div aria-hidden className="absolute inset-x-0 top-0 mx-auto h-px max-w-xl bg-gradient-to-r from-transparent via-[#e8c977]/60 to-transparent" />
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="flex flex-col items-center text-center">
        <img src="/hbg-logo.svg" alt="HBG Ministry" className="mb-4 h-10 w-16 object-contain opacity-90" />
        <p className="text-lg font-extrabold tracking-wide text-white">
          {currentEvent.name} <span className="font-semibold text-white/50">·</span>{" "}
          <span className="mta-gold-text">{currentEvent.subtitle}</span>
        </p>
        <p className="mta-scripture mx-auto mt-4 max-w-2xl text-lg leading-snug text-white/55">
          &ldquo;{currentEvent.scripture.text}&rdquo;
        </p>

        <div className="mta-ornament my-8 text-[9px]" aria-hidden>◆</div>

        <address className="max-w-md text-sm not-italic leading-relaxed text-white/45">
          {currentEvent.dateLabel}
          <br />
          HBG Ministry, 100/102 Akute Road, Martins Bus Stop, Akute, Ogun State, Nigeria
          <br />
          Hosted by Intimacy
        </address>

        <p className="mt-8 flex items-center gap-1.5 text-xs text-white/35">
          Made with <Heart className="h-3 w-3 fill-current text-[#c8b7ff]/60" aria-hidden /> for the Kingdom
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
