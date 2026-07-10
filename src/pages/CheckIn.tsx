import { CheckCircle2, Flame, Hourglass, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fastDayContent,
  getCurrentJourneyEntry,
  getJourneyPhase,
} from "@/lib/mtaFastJourneyContent";

type CheckInResponse =
  | {
      found: true;
      registration: {
        full_name: string;
        attendance_mode: string;
      };
    }
  | {
      found: false;
      error?: string;
    };

const attendanceLabel = (mode: string) => {
  if (mode === "online") return "Online";
  if (mode === "in_person") return "In-person (Akute, Nigeria)";
  return mode;
};

const CheckIn = () => {
  const { id } = useParams();
  const [data, setData] = useState<CheckInResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const journeyPhase = useMemo(() => getJourneyPhase(), []);
  const currentEntry = useMemo(() => getCurrentJourneyEntry(journeyPhase), [journeyPhase]);

  const lookupUrl = useMemo(() => {
    if (!id) return null;
    return `/api/checkin?id=${encodeURIComponent(id)}`;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadRegistration = async () => {
      if (!lookupUrl) {
        setData({ found: false });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(lookupUrl, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const payload = (await response.json()) as CheckInResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData({ found: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [lookupUrl]);

  const registration = data?.found === true ? data.registration : null;

  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C9972A]">
            MTA 2026 — EXPLOITS
          </p>
          <p className="mt-2 text-sm text-white/55">
            WE WAIT → 21 Days of Fasting & Prayer → EXPLOITS
          </p>
        </div>

        {loading ? (
          <div className="mt-20 rounded-lg border border-[#C9972A]/30 bg-white/[0.04] p-8 text-center">
            <Hourglass className="mx-auto mb-4 h-10 w-10 text-[#C9972A]" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-[#C9972A]">Loading your journey...</h1>
            <p className="mt-3 text-sm leading-7 text-white/65">
              Please hold while we confirm this MTA 2026 link.
            </p>
          </div>
        ) : registration ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-[#C9972A]/35 bg-[#11131d] p-6 shadow-2xl shadow-black/30">
              <CheckCircle2 className="mb-5 h-12 w-12 text-[#C9972A]" aria-hidden="true" />
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                {registration.full_name}, you are rising for{" "}
                <span className="text-[#C9972A]">EXPLOITS</span>
              </h1>
              <p className="mt-5 text-sm text-white/70">
                Attending: <span className="font-semibold text-white">{attendanceLabel(registration.attendance_mode)}</span>
              </p>
              <p className="mt-2 text-sm text-white/55">
                September 4–6, 2026 · HBG Ministry, Akute, Nigeria & Online
              </p>
            </div>

            {journeyPhase.phase === "preparation" && (
              <div className="rounded-lg border border-[#C9972A]/30 bg-[#0c0e16] p-6">
                <div className="flex items-center gap-3">
                  <Hourglass className="h-6 w-6 text-[#C9972A]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9972A]">
                      Countdown to the fast
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {journeyPhase.daysUntilFast} days to August 13, 2026
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-white/70">
                  Fast dates: August 13 – September 2, 2026
                </p>
              </div>
            )}

            {journeyPhase.phase === "fast" && (
              <div className="rounded-lg border border-[#C9972A]/30 bg-[#0c0e16] p-6">
                <div className="flex items-center gap-3">
                  <Flame className="h-6 w-6 text-[#C9972A]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9972A]">
                      Day {journeyPhase.day} of 21
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">{currentEntry.title}</p>
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#C9972A]"
                    style={{ width: `${(journeyPhase.day / fastDayContent.length) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/45">Progress: Day {journeyPhase.day} / 21</p>
              </div>
            )}

            {journeyPhase.phase === "post" && (
              <div className="rounded-lg border border-[#C9972A]/30 bg-[#0c0e16] p-6">
                <Sparkles className="mb-4 h-8 w-8 text-[#C9972A]" aria-hidden="true" />
                <p className="text-2xl font-bold text-white">The 21 days are fulfilled</p>
                <p className="mt-4 text-sm leading-7 text-white/75">
                  Daniel 11:32 remains our theme: the people that do know their God shall be strong,
                  and do <span className="font-semibold text-[#C9972A]">EXPLOITS</span>.
                </p>
                <p className="mt-4 text-sm leading-7 text-white/75">
                  You do not come to MTA empty — you come loaded. Rise for{" "}
                  <span className="font-semibold text-[#C9972A]">EXPLOITS</span>.
                </p>
                <p className="mt-4 text-sm text-white/55">
                  Your registration link remains ready for assembly check-in.
                </p>
              </div>
            )}

            <article className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9972A]">
                {journeyPhase.phase === "fast" ? `Day ${currentEntry.day} devotional` : "Current journey devotional"}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-white">{currentEntry.title}</h2>
              <blockquote className="mt-5 border-l-2 border-[#C9972A] pl-4 text-sm italic leading-7 text-[#f3dfad]">
                {currentEntry.scripture}
              </blockquote>
              <p className="mt-5 text-base leading-8 text-white/78">{currentEntry.devotional}</p>
              <div className="mt-6 rounded-md bg-[#C9972A]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9972A]">
                  Declaration
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-white">{currentEntry.declaration}</p>
              </div>
            </article>
          </div>
        ) : (
          <div className="mt-20 rounded-lg border border-[#C9972A]/30 bg-white/[0.04] p-8 text-center">
            <h1 className="text-2xl font-semibold text-[#C9972A]">Registration not found</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/75">
              Registration not found — please check your link or register at mta.heartbeatofgod.ca
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CheckIn;
