import { useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  clearOperatorSession,
  loadOperatorSession,
  operatorFetch,
  saveOperatorSession,
  type OperatorSession,
} from "@/lib/mtaOperatorSession";
import { EVENT_DATES, defaultEventDate, type EventDate } from "@/lib/mtaEventCalendar";
import { useQrScanner } from "@/hooks/useQrScanner";

/**
 * DOR-AIOS-MTA-06D — minimal operator check-in UI.
 *
 * Staging/preview only. Volunteers never issue a raw API call — every
 * button here performs one fixed, pre-built request against the
 * existing api/operator/* endpoints (checkin-search, checkin-confirm,
 * checkin-reverse). No production activation: this route exists but is
 * not linked from any navigation, and it requires the same
 * MTA_CHECKIN_OPERATOR_SECRET the backend already enforces — which is
 * not provisioned in production.
 */

type SearchResult = { id: string; full_name: string; attendance_mode: string };

type AlreadyCheckedIn = {
  id: string;
  checked_in_at: string;
  checked_in_by: string;
  event_date: string;
};

type Screen =
  | { name: "home" }
  | { name: "confirm"; registrationId: string; fullName: string; attendanceMode: string; method: "qr_scan" | "manual_lookup" }
  | { name: "success"; fullName: string; eventDate: string }
  | { name: "already_checked_in"; registrationId: string; fullName: string; attendanceMode: string; method: "qr_scan" | "manual_lookup"; existing: AlreadyCheckedIn }
  | { name: "reversed_success"; fullName: string; eventDate: string };

const REGISTRATION_ID_FROM_URL = /\/checkin\/([0-9a-f-]{36})/i;

const attendanceLabel = (mode: string) =>
  mode === "in_person" ? "In person" : mode === "online" ? "Online" : mode;

const eventDateLabel = (date: string) => {
  const labels: Record<string, string> = {
    "2026-09-04": "Day 1 — Fri, Sept 4",
    "2026-09-05": "Day 2 — Sat, Sept 5",
    "2026-09-06": "Day 3 — Sun, Sept 6",
  };
  return labels[date] ?? date;
};

function OperatorSignIn({ onSignedIn }: { onSignedIn: (session: OperatorSession) => void }) {
  const [secret, setSecret] = useState("");
  const [operatorId, setOperatorId] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#05060b] px-5 py-10 text-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C9972A]">MTA 2026 — EXPLOITS</p>
          <h1 className="mt-2 text-2xl font-bold">Operator Sign-In</h1>
          <p className="mt-2 text-sm text-white/60">
            One-time setup for this device. Ask the records officer for the operator secret and your operator ID.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Operator secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="h-14 text-lg"
          />
          <Input
            placeholder="Your operator ID (e.g. MTA-STAGING-OPERATOR-01)"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            className="h-14 text-lg"
          />
        </div>
        <Button
          className="h-16 w-full text-xl font-bold"
          disabled={!secret.trim() || !operatorId.trim()}
          onClick={() => onSignedIn({ secret: secret.trim(), operatorId: operatorId.trim() })}
        >
          Continue
        </Button>
      </div>
    </main>
  );
}

export default function OperatorCheckIn() {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<EventDate>(defaultEventDate());
  const [reverseReason, setReverseReason] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    setSession(loadOperatorSession());
  }, []);

  const handleDecoded = useCallback((text: string) => {
    setShowScanner(false);
    const match = text.match(REGISTRATION_ID_FROM_URL);
    if (!match) {
      setErrorMessage("That QR code isn't a recognized MTA check-in code.");
      return;
    }
    void openConfirmForRegistrationId(match[1], "qr_scan");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanner = useQrScanner(handleDecoded);

  const openConfirmForRegistrationId = async (
    registrationId: string,
    method: "qr_scan" | "manual_lookup",
  ) => {
    if (!session) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const resp = await operatorFetch(
        session,
        `/api/operator/checkin-search?registrationId=${encodeURIComponent(registrationId)}`,
      );
      const data = await resp.json();
      if (!resp.ok || !data.success || !data.results?.[0]) {
        setErrorMessage("That QR code doesn't match any registration.");
        return;
      }
      const result = data.results[0] as SearchResult;
      setScreen({
        name: "confirm",
        registrationId: result.id,
        fullName: result.full_name,
        attendanceMode: result.attendance_mode,
        method,
      });
    } catch {
      setErrorMessage("Lookup failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    if (!session || searchQuery.trim().length < 2) return;
    setSearchLoading(true);
    setErrorMessage(null);
    try {
      const resp = await operatorFetch(session, `/api/operator/checkin-search?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setErrorMessage(data.error ?? "Search failed.");
        setSearchResults(null);
        return;
      }
      setSearchResults(data.results as SearchResult[]);
    } catch {
      setErrorMessage("Search failed. Check your connection and try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    setScreen({
      name: "confirm",
      registrationId: result.id,
      fullName: result.full_name,
      attendanceMode: result.attendance_mode,
      method: "manual_lookup",
    });
  };

  const confirmCheckIn = async () => {
    if (screen.name !== "confirm" || !session) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const resp = await operatorFetch(session, "/api/operator/checkin-confirm", {
        method: "POST",
        body: JSON.stringify({
          registrationId: screen.registrationId,
          method: screen.method,
          operator: session.operatorId,
          eventDate,
        }),
      });
      const data = await resp.json();
      if (resp.status === 201 && data.success) {
        setScreen({ name: "success", fullName: data.attendance.full_name, eventDate: data.attendance.event_date });
        return;
      }
      if (data.code === "ALREADY_CHECKED_IN") {
        setScreen({
          name: "already_checked_in",
          registrationId: screen.registrationId,
          fullName: screen.fullName,
          attendanceMode: screen.attendanceMode,
          method: screen.method,
          existing: data.already,
        });
        return;
      }
      setErrorMessage(data.error ?? "Check-in failed.");
    } catch {
      setErrorMessage("Check-in failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmReversalAndRecheck = async () => {
    if (screen.name !== "already_checked_in" || !session || !reverseReason.trim()) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const reverseResp = await operatorFetch(session, "/api/operator/checkin-reverse", {
        method: "POST",
        body: JSON.stringify({
          attendanceId: screen.existing.id,
          operator: session.operatorId,
          note: reverseReason.trim(),
        }),
      });
      const reverseData = await reverseResp.json();
      if (!reverseResp.ok || !reverseData.success) {
        setErrorMessage(reverseData.error ?? "Reversal failed.");
        return;
      }

      const confirmResp = await operatorFetch(session, "/api/operator/checkin-confirm", {
        method: "POST",
        body: JSON.stringify({
          registrationId: screen.registrationId,
          method: screen.method,
          operator: session.operatorId,
          eventDate,
        }),
      });
      const confirmData = await confirmResp.json();
      if (confirmResp.status === 201 && confirmData.success) {
        setReverseReason("");
        setScreen({ name: "reversed_success", fullName: confirmData.attendance.full_name, eventDate: confirmData.attendance.event_date });
        return;
      }
      setErrorMessage(confirmData.error ?? "Re-check-in after reversal failed.");
    } catch {
      setErrorMessage("Reversal failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const goHome = () => {
    setScreen({ name: "home" });
    setSearchQuery("");
    setSearchResults(null);
    setErrorMessage(null);
    setReverseReason("");
  };

  if (!session) {
    return <OperatorSignIn onSignedIn={(s) => { saveOperatorSession(s); setSession(s); }} />;
  }

  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C9972A]">MTA 2026 Check-In</p>
            <p className="text-sm text-white/50">Operator: {session.operatorId}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/50"
            onClick={() => { clearOperatorSession(); setSession(null); goHome(); }}
          >
            Sign out
          </Button>
        </header>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {screen.name === "home" && (
          <div className="flex flex-1 flex-col gap-6">
            {showScanner ? (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <video ref={scanner.videoRef} className="aspect-square w-full object-cover" muted playsInline />
                  <canvas ref={scanner.canvasRef} className="hidden" />
                </div>
                {scanner.error && <p className="text-sm text-red-300">{scanner.error}</p>}
                <Button
                  variant="secondary"
                  className="h-14 w-full text-lg"
                  onClick={() => { scanner.stop(); setShowScanner(false); }}
                >
                  <X className="mr-2 h-5 w-5" /> Cancel scan
                </Button>
              </div>
            ) : (
              <Button
                className="h-24 w-full flex-col gap-1 rounded-2xl bg-[#C9972A] text-xl font-bold text-black hover:bg-[#C9972A]/90"
                onClick={() => { setShowScanner(true); void scanner.start(); }}
              >
                <Camera className="h-8 w-8" />
                Scan QR
              </Button>
            )}

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/70">Or search by name, phone, or email</p>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                  placeholder="Search..."
                  className="h-14 flex-1 text-lg"
                />
                <Button className="h-14 px-5" onClick={() => void runSearch()} disabled={searchQuery.trim().length < 2 || searchLoading}>
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              {searchLoading && <p className="text-sm text-white/50">Searching…</p>}
              {searchResults && searchResults.length === 0 && (
                <p className="text-sm text-white/50">No matches found.</p>
              )}
              <div className="space-y-2">
                {searchResults?.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectSearchResult(result)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left text-lg hover:bg-white/10"
                  >
                    <div className="font-semibold">{result.full_name}</div>
                    <div className="text-sm text-white/50">{attendanceLabel(result.attendance_mode)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen.name === "confirm" && (
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-2xl font-bold">{screen.fullName}</p>
              {screen.attendanceMode && (
                <p className="mt-1 text-white/60">{attendanceLabel(screen.attendanceMode)}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-white/70">Event day</p>
              <div className="grid grid-cols-1 gap-2">
                {EVENT_DATES.map((date) => (
                  <button
                    key={date}
                    onClick={() => setEventDate(date)}
                    className={`rounded-xl border px-4 py-4 text-left text-lg font-medium transition-colors ${
                      eventDate === date
                        ? "border-[#C9972A] bg-[#C9972A]/15 text-[#C9972A]"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {eventDateLabel(date)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <Button
                className="h-20 w-full rounded-2xl bg-green-600 text-2xl font-bold hover:bg-green-700"
                onClick={() => void confirmCheckIn()}
                disabled={busy}
              >
                <CheckCircle2 className="mr-2 h-7 w-7" /> Check In
              </Button>
              <Button variant="ghost" className="h-14 w-full text-lg text-white/60" onClick={goHome} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {screen.name === "success" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{screen.fullName}</p>
              <p className="mt-1 text-white/60">Checked in — {eventDateLabel(screen.eventDate)}</p>
            </div>
            <Button className="h-16 w-full max-w-xs text-xl font-bold" onClick={goHome}>
              Scan Next
            </Button>
          </div>
        )}

        {screen.name === "reversed_success" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{screen.fullName}</p>
              <p className="mt-1 text-white/60">Previous entry reversed and re-checked in — {eventDateLabel(screen.eventDate)}</p>
            </div>
            <Button className="h-16 w-full max-w-xs text-xl font-bold" onClick={goHome}>
              Scan Next
            </Button>
          </div>
        )}

        {screen.name === "already_checked_in" && (
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-6 text-center">
              <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-yellow-400" />
              <p className="text-xl font-bold">{screen.fullName}</p>
              <p className="mt-2 text-yellow-200">
                Already checked in for {eventDateLabel(screen.existing.event_date)}
                <br />
                by {screen.existing.checked_in_by}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/70">
                Only reverse this if it was a mistake (state the reason):
              </p>
              <Textarea
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Reason for reversing this check-in..."
                className="min-h-24 text-lg"
              />
            </div>

            <div className="mt-auto space-y-3">
              <Button
                variant="destructive"
                className="h-16 w-full text-lg font-bold"
                onClick={() => void confirmReversalAndRecheck()}
                disabled={busy || !reverseReason.trim()}
              >
                <RotateCcw className="mr-2 h-5 w-5" /> Reverse & Check In Again
              </Button>
              <Button variant="ghost" className="h-14 w-full text-lg text-white/60" onClick={goHome} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
