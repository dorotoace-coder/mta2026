import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

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
      { time: "12:00 PM", session: "Celebration Service & Ordination/Graduation" },
    ],
  },
];

const ScheduleSection = () => (
  <section id="schedule" className="mta-section">
    <div className="mta-container">
      <motion.div
        className="mx-auto mb-16 max-w-3xl text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="mta-kicker mb-3">Conference Programme</p>
        <h2 className="mb-4 text-4xl font-black text-white sm:text-6xl">3 Days of <span className="mta-gold-text">EXPLOITS</span></h2>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 text-sm text-white/55 sm:flex-row sm:gap-6">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[#d7b767]" /> September 4–6, 2026</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#d7b767]" /> HBG Ministry, Akute</span>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {schedule.map((day, i) => (
          <motion.div
            key={day.day}
            className="mta-glass flex flex-col overflow-hidden rounded-[1.75rem]"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
          >
            <div className="border-b border-white/10 p-6 text-center">
              <p className="mta-kicker mb-2">{day.day}</p>
              <h3 className="text-xl font-black text-white sm:text-2xl">{day.date}</h3>
            </div>
            <div className="px-6 pt-6">
              <h4 className="mb-5 text-base font-bold text-[#c8b7ff]">{day.title}</h4>
            </div>
            <div className="flex-1 space-y-4 px-6 pb-6">
              {day.events.map((ev) => (
                <div key={ev.time + ev.session} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                  <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#d7b767]" />
                    <span className="whitespace-nowrap text-xs font-semibold text-[#d7b767]">{ev.time}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-white/68">{ev.session}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ScheduleSection;
