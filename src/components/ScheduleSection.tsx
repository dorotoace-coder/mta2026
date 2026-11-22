import { Calendar, MapPin } from "lucide-react";
import { currentEvent } from "@/config/events";

/**
 * One renderer for every programme shape.
 *
 * MTA was three days; TRIBE X is a single evening. Rather than branch on
 * shape, the programme is a flat list and the `time` field carries whatever
 * granularity the event needs — "7:00 PM" for one night, "Day 2 · 9:00 AM"
 * for an assembly. Adding a new event never requires touching this file.
 * Both render as the same vertical timeline.
 */
const ScheduleSection = () => {
  const { programme, dateLabel, venue, subtitle } = currentEvent;

  return (
    <section id="schedule" className="mta-section scroll-mt-20">
      <div className="mta-container">
        <div data-reveal className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mta-kicker mb-4">Programme</p>
          <h2 className="mta-heading text-[2.6rem] sm:text-6xl">
            Order of <span className="mta-gold-text">{subtitle}</span>
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/65">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#e8c977]" aria-hidden /> {dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#e8c977]" aria-hidden /> {venue}
            </span>
          </div>
        </div>

        <ol className="relative mx-auto max-w-3xl">
          {/* The rail */}
          <span
            aria-hidden
            className="absolute bottom-6 left-[5.5rem] top-6 w-px bg-gradient-to-b from-[#e8c977]/0 via-[#e8c977]/45 to-[#e8c977]/0 sm:left-[7.5rem]"
          />
          {programme.map((seg, i) => (
            <li
              key={seg.time + seg.title}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
              className="group relative grid grid-cols-[5.5rem_1fr] items-start py-3 sm:grid-cols-[7.5rem_1fr]"
            >
              <time className="pr-5 pt-5 text-right text-xs font-extrabold uppercase tracking-[0.12em] text-[#e8c977] sm:pr-8 sm:text-sm">
                {seg.time}
              </time>

              {/* Node on the rail */}
              <span
                aria-hidden
                className="absolute left-[5.5rem] top-[1.6rem] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[#e8c977] bg-[#2a1f5c] shadow-[0_0_0_5px_rgba(232,201,119,0.12)] transition-colors group-hover:bg-[#e8c977] sm:left-[7.5rem]"
              />

              <div className="ml-6 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-[#e8c977]/35 group-hover:bg-white/[0.07] sm:ml-8 sm:px-6">
                <p className="text-base font-bold leading-snug text-white sm:text-lg">{seg.title}</p>
                {seg.lead && <p className="mt-1 text-sm text-[#d8c4ff]/85">{seg.lead}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ScheduleSection;
