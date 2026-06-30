import { Heart, Sparkles } from "lucide-react";
const Footer = () => (
  <footer className="relative py-14" style={{ background: "linear-gradient(180deg, #100c30 0%, #050816 100%)" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#d7b767]" />
          <span className="text-white font-bold text-lg">MTA <span className="mta-gold-text">2026</span></span>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
          <span className="italic">"The people that do know their God shall be strong, and do exploits."</span>
        </div>
        <p className="text-white/25 text-xs sm:text-sm mb-6 max-w-md leading-relaxed">
          Mighty Turn Around Assembly — September 4–6, 2026<br/>
          HBG Ministry, 100/102 Akute Road, Martins Bus Stop, Akute, Ogun State, Nigeria<br/>
          Host: Pastor Amos Unogwu
        </p>
        <div className="w-16 h-px mb-6" style={{ background: "rgba(215,183,103,0.28)" }} />
        <p className="text-white/20 text-xs flex items-center gap-1">
          Made with <Heart className="w-3 h-3" style={{ color: "rgba(200,183,255,0.55)" }} /> for the Kingdom
        </p>
      </div>
    </div>
  </footer>
);
export default Footer;
