import { Calendar, Clock, MapPin } from "lucide-react";
import { currentEvent } from "@/config/events";

/**
 * One renderer for every programme shape.
 *
 * MTA was three days in three columns; TRIBE X is a single evening. Rather
 * than branch on shape, the programme is a flat list and the `time` field
 * carries whatever granularity the event needs — "7:00 PM" for one night,
 * "Day 2 · 9:00 AM" for an assembly. Adding a new event never requires
 * touching this file.
 */
const ScheduleSection = () => {
  const { programme, dateLabel, venue, subtitle } = currentEvent;
  const isSingleSession = programme.length <= 6;

  return (
    <section id="schedule" className="mta-section">
      <div className="mta-container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mta-kicker mb-3">Programme</p>
          <h2 className="mb-4 text-4xl font-black text-white sm:text-6xl">
            Order of <span className="mta-gold-text">{subtitle}</span>
          </h2>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 text-sm text-white/70 sm:flex-row sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#ffd96b]" /> {dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#ffd96b]" /> {venue}
            </span>
          </div>
        </div>

        <div
          className={
            isSingleSession
              ? "mx-auto max-w-3xl space-y-4"
              : "grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3"
          }
        >
          {programme.map((seg) => (
            <div
              key={seg.time + seg.title}
              className="mta-glass flex items-start gap-5 rounded-[1.5rem] p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6"
            >
              <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <Clock className="h-3.5 w-3.5 text-[#ffd96b]" />
                <span className="whitespace-nowrap text-xs font-semibold tracking-wide text-[#ffd96b]">
                  {seg.time}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold leading-snug text-white">
                  {seg.title}
                </p>
                {seg.lead && (
                  <p className="mt-1 text-sm text-[#d8c4ff]">{seg.lead}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
