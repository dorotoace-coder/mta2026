// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import OperatorCheckIn from "./OperatorCheckIn";

let capturedOnDecoded: ((text: string) => void) | null = null;
let capturedActive = false;
vi.mock("@/hooks/useQrScanner", () => ({
  useQrScanner: (active: boolean, onDecoded: (text: string) => void) => {
    capturedActive = active;
    capturedOnDecoded = onDecoded;
    return { videoRef: { current: null }, canvasRef: { current: null }, error: null };
  },
}));

const SECRET = "test-operator-secret";
const OPERATOR_ID = "MTA-STAGING-OPERATOR-01";
const REG_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

type RouteHandler = (url: string, init?: RequestInit) => unknown;
let routes: Record<string, RouteHandler>;

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function setupFetchMock() {
  routes = {};
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes("/api/operator/validate-session")) return Promise.resolve(routes.validateSession(url, init));
    if (url.includes("/api/operator/checkin-search") && url.includes("registrationId=")) {
      return Promise.resolve(routes.searchById(url, init));
    }
    if (url.includes("/api/operator/checkin-search")) return Promise.resolve(routes.searchByQuery(url, init));
    if (url.includes("/api/operator/checkin-confirm")) return Promise.resolve(routes.confirm(url, init));
    if (url.includes("/api/operator/checkin-reverse")) return Promise.resolve(routes.reverse(url, init));
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function signIn() {
  fireEvent.change(screen.getByPlaceholderText("Operator secret"), { target: { value: SECRET } });
  fireEvent.change(screen.getByPlaceholderText(/Your operator ID/), { target: { value: OPERATOR_ID } });
  fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
  await screen.findByText("Scan QR");
}

describe("OperatorCheckIn", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.sessionStorage.clear();
    capturedOnDecoded = null;
    capturedActive = false;
    fetchMock = setupFetchMock();
    routes.validateSession = () => jsonResponse(200, { success: true });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("valid sign-in stores the session and shows the home screen", async () => {
    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();

    expect(screen.getByText(`Operator: ${OPERATOR_ID}`)).toBeTruthy();
    expect(window.sessionStorage.getItem("mta_operator_secret")).toBe(SECRET);
  });

  it("invalid secret (401) shows an error and does not store the session", async () => {
    routes.validateSession = () => jsonResponse(401, { success: false, error: "Unauthorized" });
    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    fireEvent.change(screen.getByPlaceholderText("Operator secret"), { target: { value: "wrong" } });
    fireEvent.change(screen.getByPlaceholderText(/Your operator ID/), { target: { value: OPERATOR_ID } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await screen.findByText(/Operator secret is incorrect/);
    expect(window.sessionStorage.getItem("mta_operator_secret")).toBeNull();
  });

  it("unknown operator (403) shows an error and does not store the session", async () => {
    routes.validateSession = () => jsonResponse(403, { success: false, code: "UNKNOWN_OPERATOR" });
    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    fireEvent.change(screen.getByPlaceholderText("Operator secret"), { target: { value: SECRET } });
    fireEvent.change(screen.getByPlaceholderText(/Your operator ID/), { target: { value: "NotAllowed" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await screen.findByText(/Operator ID is not recognized/);
    expect(window.sessionStorage.getItem("mta_operator_secret")).toBeNull();
  });

  it("shows a system-unavailable message (not an auth error) when sign-in gets a 503", async () => {
    routes.validateSession = () => jsonResponse(503, { success: false, error: "unavailable" });
    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    fireEvent.change(screen.getByPlaceholderText("Operator secret"), { target: { value: SECRET } });
    fireEvent.change(screen.getByPlaceholderText(/Your operator ID/), { target: { value: OPERATOR_ID } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await screen.findByText(/System temporarily unavailable/);
  });

  it("regression: a decoded QR code reaches the participant confirmation screen after sign-in", async () => {
    routes.searchById = () =>
      jsonResponse(200, { success: true, results: [{ id: REG_ID, full_name: "Scanned Person", attendance_mode: "in_person" }] });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();

    fireEvent.click(screen.getByText("Scan QR"));
    expect(capturedActive).toBe(true);

    // Simulate the scanner hook decoding a real check-in QR payload —
    // this exercises the exact handleDecoded -> openConfirmForRegistrationId
    // wiring that a stale closure previously broke after sign-in.
    capturedOnDecoded!(`https://mta.heartbeatofgod.ca/checkin/${REG_ID}`);

    await screen.findByText("Scanned Person");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`registrationId=${REG_ID}`), expect.anything());
  });

  it("manual search selecting a result reaches the confirmation screen", async () => {
    routes.searchByQuery = () =>
      jsonResponse(200, {
        success: true,
        results: [{ id: REG_ID, full_name: "Found By Search", attendance_mode: "online", masked_contact: "f***@example.com" }],
      });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();

    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "Found" } });
    fireEvent.click(screen.getByRole("button", { name: "" })); // the search icon button next to the input
    await screen.findByText("Found By Search");

    fireEvent.click(screen.getByText("Found By Search"));
    await screen.findByText("Found By Search");
    expect(screen.getByText(/Checking in for/)).toBeTruthy();
  });

  it("a successful check-in shows the success screen", async () => {
    routes.searchById = () =>
      jsonResponse(200, { success: true, results: [{ id: REG_ID, full_name: "Success Person", attendance_mode: "in_person" }] });
    routes.confirm = () =>
      jsonResponse(201, {
        success: true,
        attendance: { full_name: "Success Person", event_date: "2026-09-04" },
      });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();
    fireEvent.click(screen.getByText("Scan QR"));
    capturedOnDecoded!(`https://mta.heartbeatofgod.ca/checkin/${REG_ID}`);
    await screen.findByText("Success Person");

    fireEvent.click(screen.getByText("Check In"));

    await screen.findByText("Checked in — Day 1 — Fri, Sept 4");
  });

  it("already-checked-in: Keep Existing Check-In returns home without any further write", async () => {
    routes.searchById = () =>
      jsonResponse(200, { success: true, results: [{ id: REG_ID, full_name: "Dup Person", attendance_mode: "in_person" }] });
    routes.confirm = () =>
      jsonResponse(200, {
        success: false,
        code: "ALREADY_CHECKED_IN",
        already: { id: "att-1", checked_in_at: "x", checked_in_by: "Vol0", event_date: "2026-09-04" },
      });
    routes.reverse = vi.fn();

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();
    fireEvent.click(screen.getByText("Scan QR"));
    capturedOnDecoded!(`https://mta.heartbeatofgod.ca/checkin/${REG_ID}`);
    await screen.findByText("Dup Person");
    fireEvent.click(screen.getByText("Check In"));

    await screen.findByText(/Already checked in for/);
    fireEvent.click(screen.getByText(/Done \/ Keep Existing Check-In/));

    await screen.findByText("Scan QR");
    expect(routes.reverse).not.toHaveBeenCalled();
  });

  it("reversal-only: success shows the reversal-success screen and never issues a re-check-in request", async () => {
    routes.searchById = () =>
      jsonResponse(200, { success: true, results: [{ id: REG_ID, full_name: "Mistake Person", attendance_mode: "in_person" }] });
    routes.confirm = vi.fn(() =>
      jsonResponse(200, {
        success: false,
        code: "ALREADY_CHECKED_IN",
        already: { id: "att-1", checked_in_at: "x", checked_in_by: "Vol0", event_date: "2026-09-04" },
      }),
    );
    routes.reverse = vi.fn(() => jsonResponse(200, { success: true, attendance_id: "att-1", reversed_by: OPERATOR_ID }));

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();
    fireEvent.click(screen.getByText("Scan QR"));
    capturedOnDecoded!(`https://mta.heartbeatofgod.ca/checkin/${REG_ID}`);
    await screen.findByText("Mistake Person");
    fireEvent.click(screen.getByText("Check In"));
    await screen.findByText(/This was a mistake/);
    fireEvent.click(screen.getByText(/This was a mistake/));

    const reasonBox = await screen.findByPlaceholderText(/Reason for reversing/);
    fireEvent.change(reasonBox, { target: { value: "Wrong person scanned" } });
    fireEvent.click(screen.getByText("Confirm Reversal"));

    await screen.findByText(/Check-in reversed/);
    expect(routes.reverse).toHaveBeenCalledTimes(1);
    // Exactly one confirm call happened (the original one that produced
    // ALREADY_CHECKED_IN) — reversal must never trigger a second,
    // automatic re-check-in request.
    expect(routes.confirm).toHaveBeenCalledTimes(1);
  });

  it("reversal failure shows an error and keeps the operator on the reversal form", async () => {
    routes.searchById = () =>
      jsonResponse(200, { success: true, results: [{ id: REG_ID, full_name: "Fail Person", attendance_mode: "in_person" }] });
    routes.confirm = () =>
      jsonResponse(200, {
        success: false,
        code: "ALREADY_CHECKED_IN",
        already: { id: "att-1", checked_in_at: "x", checked_in_by: "Vol0", event_date: "2026-09-04" },
      });
    routes.reverse = () => jsonResponse(502, { success: false, error: "Reversal write failed." });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();
    fireEvent.click(screen.getByText("Scan QR"));
    capturedOnDecoded!(`https://mta.heartbeatofgod.ca/checkin/${REG_ID}`);
    await screen.findByText("Fail Person");
    fireEvent.click(screen.getByText("Check In"));
    await screen.findByText(/This was a mistake/);
    fireEvent.click(screen.getByText(/This was a mistake/));
    fireEvent.change(await screen.findByPlaceholderText(/Reason for reversing/), { target: { value: "Wrong scan" } });
    fireEvent.click(screen.getByText("Confirm Reversal"));

    await screen.findByText("Reversal write failed.");
    expect(screen.getByText("Confirm Reversal")).toBeTruthy();
  });

  it("a 401 during a normal action clears the session and returns to sign-in", async () => {
    routes.searchByQuery = () => jsonResponse(401, { success: false, error: "Unauthorized" });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();

    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "anything" } });
    fireEvent.click(screen.getByRole("button", { name: "" }));

    await screen.findByText("Operator Sign-In");
    expect(window.sessionStorage.getItem("mta_operator_secret")).toBeNull();
  });

  it("a 403 during a normal action clears the session and returns to sign-in", async () => {
    routes.searchByQuery = () => jsonResponse(403, { success: false, code: "UNKNOWN_OPERATOR" });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();

    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "anything" } });
    fireEvent.click(screen.getByRole("button", { name: "" }));

    await screen.findByText("Operator Sign-In");
  });

  it("shows a system-unavailable message (not a not-found message) for a 503 during search", async () => {
    routes.searchByQuery = () => jsonResponse(503, { success: false, error: "unavailable" });

    render(<OperatorCheckIn />);
    await screen.findByPlaceholderText("Operator secret");
    await signIn();

    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "anything" } });
    fireEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => expect(screen.getByText(/System temporarily unavailable/)).toBeTruthy());
  });
});
