import { Flame, Heart } from "lucide-react";
const Footer = () => (
  <footer className="relative py-12" style={{ background: "#080001" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5" style={{ color: "#C9972A" }} />
          <span className="text-white font-bold text-lg">MTA <span style={{ color: "#C9972A" }}>2026</span></span>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
          <span className="italic">"There is a river whose streams make glad the city of God"</span>
        </div>
        <p className="text-white/25 text-xs sm:text-sm mb-6 max-w-md leading-relaxed">
          Mighty Turn Around Assembly — September 4–6, 2026<br/>
          HBG Ministry, 100/102 Akute Road, Martins Bus Stop, Akute, Ogun State, Nigeria<br/>
          Host: Pastor Amos Unogwu
        </p>
        <div className="w-16 h-px mb-6" style={{ background: "rgba(201,151,42,0.2)" }} />
        <p className="text-white/20 text-xs flex items-center gap-1">
          Made with <Heart className="w-3 h-3" style={{ color: "rgba(255,69,0,0.5)" }} /> for the Kingdom
        </p>
      </div>
    </div>
  </footer>
);
export default Footer;
