import { Calendar, Clock, MapPin, Mic } from "lucide-react";

const schedule = [
  {
    day: "Day 1", date: "Friday, September 4", title: "Opening Night",
    events: [
      { time: "5:00 PM", session: "Red Carpet" },
      { time: "6:00 PM", session: "Opening Session" },
    ],
  },
  {
    day: "Day 2", date: "Saturday, September 5", title: "Divine Turnaround",
    events: [
      { time: "9:00 AM", session: "Morning Session: Divine Turnaround" },
      { time: "5:00 PM", session: "Evening Session: Supernatural Encounters" },
    ],
  },
  {
    day: "Day 3", date: "Sunday, September 6", title: "Celebration & Graduation",
    events: [
      { time: "9:00 AM", session: "Celebration Service & Ordination/Graduation" },
    ],
  },
];

const ScheduleSection = () => (
  <section id="schedule" className="relative py-24 overflow-hidden"
    style={{ background: "linear-gradient(180deg, #150005 0%, #1a0008 50%, #150005 100%)" }}>
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, #ff4500, transparent)", filter: "blur(80px)" }} />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, #C9972A, transparent)", filter: "blur(80px)" }} />
    </div>
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <p className="text-[#C9972A] text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">Conference Programme</p>
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">3 Days of EXPLOITS</h2>
        <div className="flex items-center justify-center gap-6 text-white/40 text-sm mt-4">
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#C9972A]" /> September 4–6, 2026</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#C9972A]" /> HBG Ministry, Akute</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {schedule.map((day) => (
          <div key={day.day} className="rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,151,42,0.15)" }}>
            <div className="p-5 sm:p-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(255,69,0,0.3), rgba(201,151,42,0.2))" }}>
              <p className="text-[#C9972A]/70 text-xs font-bold tracking-widest uppercase">{day.day}</p>
              <h3 className="text-white text-lg sm:text-xl font-black">{day.date}</h3>
            </div>
            <div className="px-5 sm:px-6 pt-5">
              <h4 className="text-white font-bold text-sm mb-4">{day.title}</h4>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex-1 space-y-3">
              {day.events.map((ev) => (
                <div key={ev.time + ev.session} className="flex gap-3 items-start">
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9972A]/70" />
                    <span className="text-[#C9972A] text-xs font-semibold whitespace-nowrap">{ev.time}</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{ev.session}</p>
                    {"speaker" in ev && (ev as any).speaker && (
                      <span className="flex items-center gap-1 text-[#C9972A]/80 text-[10px] font-semibold tracking-wide mt-1">
                        <Mic className="w-2.5 h-2.5" />{(ev as any).speaker}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ScheduleSection;
