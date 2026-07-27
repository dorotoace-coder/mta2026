import { useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, RotateCcw, Search, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  clearOperatorSession,
  loadOperatorSession,
  operatorFetch,
  saveOperatorSession,
  validateOperatorSession,
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
 * checkin-reverse, validate-session). Gated behind
 * VITE_ENABLE_OPERATOR_UI (see src/lib/mtaFeatureFlags.ts) and the
 * same MTA_CHECKIN_OPERATOR_SECRET the backend already enforces —
 * neither is set in production.
 */

type SearchResult = { id: string; full_name: string; attendance_mode: string; masked_contact: string | null };

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
  | { name: "reversal_success"; fullName: string };

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

const SYSTEM_UNAVAILABLE = "System temporarily unavailable. Please try again shortly.";

function OperatorSignIn({
  authNotice,
  onSignedIn,
}: {
  authNotice: string | null;
  onSignedIn: (session: OperatorSession) => void;
}) {
  const [secret, setSecret] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const candidate = { secret: secret.trim(), operatorId: operatorId.trim() };
    setChecking(true);
    setError(null);
    const result = await validateOperatorSession(candidate);
    setChecking(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    onSignedIn(candidate);
  };

  // A fresh submit failure is more relevant than a stale reason for
  // being here, so it takes precedence once the operator has tried.
  const displayMessage = error ?? authNotice;

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
        {displayMessage && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {displayMessage}
          </div>
        )}
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
          disabled={!secret.trim() || !operatorId.trim() || checking}
          onClick={() => void submit()}
        >
          {checking ? "Checking…" : "Continue"}
        </Button>
      </div>
    </main>
  );
}

export default function OperatorCheckIn() {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<EventDate>(defaultEventDate());
  const [dayOverrideOpen, setDayOverrideOpen] = useState(false);
  const [pendingOverrideDate, setPendingOverrideDate] = useState<EventDate | null>(null);
  const [showReversalForm, setShowReversalForm] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = loadOperatorSession();
      if (!stored) {
        if (!cancelled) setSessionLoaded(true);
        return;
      }
      // A session left in sessionStorage from an earlier tab/reload may
      // have since been revoked (secret rotated, operator ID removed
      // from the allow-list) — revalidate before ever showing the
      // operator home screen with it.
      const result = await validateOperatorSession(stored);
      if (cancelled) return;
      if (result.ok === false) {
        clearOperatorSession();
        setSession(null);
      } else {
        setSession(stored);
      }
      setSessionLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goHome = useCallback(() => {
    setScreen({ name: "home" });
    setSearchQuery("");
    setSearchResults(null);
    setErrorMessage(null);
    setShowReversalForm(false);
    setReverseReason("");
    setDayOverrideOpen(false);
    setPendingOverrideDate(null);
    setEventDate(defaultEventDate());
    setShowScanner(false);
  }, []);

  const resetToSignIn = useCallback(
    (message: string) => {
      clearOperatorSession();
      setSession(null);
      goHome();
      setAuthNotice(message || null);
    },
    [goHome],
  );

  /**
   * Central handler for the two response shapes every operator
   * endpoint can return regardless of what it does: an expired/invalid
   * session (401/403) or the backend being unconfigured (503). Returns
   * true when it already fully handled the response (caller should
   * stop), false when the caller should continue with its own
   * endpoint-specific logic.
   */
  const handleSharedFailure = useCallback(
    (status: number): boolean => {
      if (status === 401) {
        resetToSignIn("Your session is no longer valid. Please sign in again.");
        return true;
      }
      if (status === 403) {
        resetToSignIn("Your operator ID is no longer recognized. Please sign in again.");
        return true;
      }
      if (status === 503) {
        setErrorMessage(SYSTEM_UNAVAILABLE);
        return true;
      }
      return false;
    },
    [resetToSignIn],
  );

  const openConfirmForRegistrationId = useCallback(
    async (registrationId: string, method: "qr_scan" | "manual_lookup") => {
      if (!session) return;
      setBusy(true);
      setErrorMessage(null);
      try {
        const resp = await operatorFetch(
          session,
          `/api/operator/checkin-search?registrationId=${encodeURIComponent(registrationId)}&operator=${encodeURIComponent(session.operatorId)}`,
        );
        const data = await resp.json();
        if (handleSharedFailure(resp.status)) return;
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
    },
    [session, handleSharedFailure],
  );

  const handleDecoded = useCallback(
    (text: string) => {
      setShowScanner(false);
      const match = text.match(REGISTRATION_ID_FROM_URL);
      if (!match) {
        setErrorMessage("That QR code isn't a recognized MTA check-in code.");
        return;
      }
      void openConfirmForRegistrationId(match[1], "qr_scan");
    },
    [openConfirmForRegistrationId],
  );

  const scanner = useQrScanner(showScanner, handleDecoded);

  const runSearch = async () => {
    if (!session || searchQuery.trim().length < 2) return;
    setSearchLoading(true);
    setErrorMessage(null);
    try {
      const resp = await operatorFetch(
        session,
        `/api/operator/checkin-search?query=${encodeURIComponent(searchQuery.trim())}&operator=${encodeURIComponent(session.operatorId)}`,
      );
      const data = await resp.json();
      if (handleSharedFailure(resp.status)) return;
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
      if (handleSharedFailure(resp.status)) return;
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

  /**
   * Reverses a mistaken check-in only — it never automatically
   * re-checks the registrant in afterward. If a fresh check-in is
   * genuinely needed, the operator scans or searches again as its own
   * deliberate action, avoiding the earlier two-request
   * reverse-then-confirm sequence a concurrent operator action could
   * interleave with.
   */
  const confirmReversalOnly = async () => {
    if (screen.name !== "already_checked_in" || !session || !reverseReason.trim()) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const resp = await operatorFetch(session, "/api/operator/checkin-reverse", {
        method: "POST",
        body: JSON.stringify({
          attendanceId: screen.existing.id,
          operator: session.operatorId,
          note: reverseReason.trim(),
        }),
      });
      const data = await resp.json();
      if (handleSharedFailure(resp.status)) return;
      if (!resp.ok || !data.success) {
        setErrorMessage(data.error ?? "Reversal failed.");
        return;
      }
      const fullName = screen.fullName;
      setReverseReason("");
      setShowReversalForm(false);
      setScreen({ name: "reversal_success", fullName });
    } catch {
      setErrorMessage("Reversal failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const requestDayOverride = (date: EventDate) => setPendingOverrideDate(date);
  const confirmDayOverride = () => {
    if (pendingOverrideDate) setEventDate(pendingOverrideDate);
    setPendingOverrideDate(null);
    setDayOverrideOpen(false);
  };
  const cancelDayOverride = () => {
    setPendingOverrideDate(null);
    setDayOverrideOpen(false);
  };

  if (!sessionLoaded) return null;

  if (!session) {
    return (
      <OperatorSignIn
        authNotice={authNotice}
        onSignedIn={(s) => {
          saveOperatorSession(s);
          setSession(s);
          setAuthNotice(null);
        }}
      />
    );
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
            onClick={() => resetToSignIn("")}
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
                  onClick={() => setShowScanner(false)}
                >
                  <X className="mr-2 h-5 w-5" /> Cancel scan
                </Button>
              </div>
            ) : (
              <Button
                className="h-24 w-full flex-col gap-1 rounded-2xl bg-[#C9972A] text-xl font-bold text-black hover:bg-[#C9972A]/90"
                onClick={() => setShowScanner(true)}
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
                    <div className="text-sm text-white/50">
                      {attendanceLabel(result.attendance_mode)}
                      {result.masked_contact && <> · {result.masked_contact}</>}
                    </div>
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
              <div className="rounded-xl border border-[#C9972A]/50 bg-[#C9972A]/10 px-4 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#C9972A]">Checking in for</p>
                <p className="text-lg font-bold text-[#C9972A]">{eventDateLabel(eventDate)}</p>
              </div>

              {!dayOverrideOpen ? (
                <button
                  onClick={() => setDayOverrideOpen(true)}
                  className="mt-2 w-full text-center text-sm text-white/40 underline underline-offset-2"
                >
                  Wrong day? Supervisor override
                </button>
              ) : pendingOverrideDate ? (
                <div className="mt-3 space-y-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-center">
                  <p className="text-sm text-yellow-200">
                    Confirm marking attendance for {eventDateLabel(pendingOverrideDate)} instead?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" className="h-12 flex-1" onClick={confirmDayOverride}>
                      Yes, override
                    </Button>
                    <Button variant="ghost" className="h-12 flex-1 text-white/60" onClick={cancelDayOverride}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {EVENT_DATES.filter((date) => date !== eventDate).map((date) => (
                    <button
                      key={date}
                      onClick={() => requestDayOverride(date)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white/70"
                    >
                      {eventDateLabel(date)}
                    </button>
                  ))}
                  <button onClick={cancelDayOverride} className="w-full text-center text-sm text-white/40 underline">
                    Cancel
                  </button>
                </div>
              )}
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

        {screen.name === "reversal_success" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <ShieldCheck className="h-20 w-20 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{screen.fullName}</p>
              <p className="mt-1 text-white/60">
                Check-in reversed. This person is not currently marked as checked in.
              </p>
            </div>
            <Button className="h-16 w-full max-w-xs text-xl font-bold" onClick={goHome}>
              Done
            </Button>
          </div>
        )}

        {screen.name === "already_checked_in" && !showReversalForm && (
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

            <div className="mt-auto space-y-3">
              <Button
                className="h-20 w-full rounded-2xl bg-green-600 text-xl font-bold hover:bg-green-700"
                onClick={goHome}
              >
                <CheckCircle2 className="mr-2 h-6 w-6" /> Done / Keep Existing Check-In
              </Button>
              <Button
                variant="ghost"
                className="h-12 w-full text-sm text-white/50 underline underline-offset-2"
                onClick={() => setShowReversalForm(true)}
              >
                This was a mistake — reverse it
              </Button>
            </div>
          </div>
        )}

        {screen.name === "already_checked_in" && showReversalForm && (
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-center">
              <p className="font-semibold">{screen.fullName}</p>
              <p className="text-sm text-yellow-200">
                Reversing the check-in from {eventDateLabel(screen.existing.event_date)} by {screen.existing.checked_in_by}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/70">Reason for reversing (required):</p>
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
                onClick={() => void confirmReversalOnly()}
                disabled={busy || !reverseReason.trim()}
              >
                <RotateCcw className="mr-2 h-5 w-5" /> Confirm Reversal
              </Button>
              <Button
                variant="ghost"
                className="h-14 w-full text-lg text-white/60"
                onClick={() => { setShowReversalForm(false); setReverseReason(""); }}
                disabled={busy}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
