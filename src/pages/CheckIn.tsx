import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

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

  const found = data?.found === true;
  const registration = found ? data.registration : null;

  return (
    <main className="min-h-screen bg-[#1A0533] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#C9972A]">
          MTA 2026 — EXPLOITS
        </p>

        <div className="w-full rounded-lg border border-[#C9972A]/35 bg-white/[0.04] px-6 py-10 shadow-2xl shadow-black/25 sm:px-10">
          {loading ? (
            <div>
              <h1 className="text-2xl font-semibold text-[#C9972A]">Checking registration...</h1>
              <p className="mt-4 text-sm leading-7 text-white/75">
                Please hold while we confirm this MTA 2026 check-in link.
              </p>
            </div>
          ) : registration ? (
            <div>
              <CheckCircle2 className="mx-auto mb-5 h-16 w-16 text-[#C9972A]" aria-hidden="true" />
              <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">
                {registration.full_name} — you're registered for MTA 2026 — EXPLOITS
              </h1>
              <p className="mt-6 text-xl font-semibold text-[#C9972A]">
                Attending: {attendanceLabel(registration.attendance_mode)}
              </p>
              <p className="mt-5 text-base leading-7 text-white/80">
                September 4–6, 2026 · HBG Ministry, Akute, Nigeria & Online
              </p>
              <p className="mt-6 text-lg leading-8 text-white/90">
                Come expecting a fresh encounter with God.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-[#C9972A]">Registration not found</h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/80">
                Registration not found — please check your link or register at mta.heartbeatofgod.ca
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default CheckIn;
