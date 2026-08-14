import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockResendSend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => {
  class Resend {
    emails = { send: mockResendSend };
    constructor(_key?: string) {}
  }
  return { Resend };
});

import { runMtaDevotionalEmailSend } from "../../../api/_lib/mtaDevotionalEmailSender.js";

const TEST_EMAIL = "devotional-integrity@example.invalid";

const response = ({
  ok = true,
  status = 200,
  json = [],
  text = "",
  contentRange,
}: {
  ok?: boolean;
  status?: number;
  json?: unknown;
  text?: string;
  contentRange?: string;
} = {}) =>
  ({
    ok,
    status,
    json: async () => json,
    text: async () => text,
    headers: new Headers(contentRange ? { "content-range": contentRange } : {}),
  }) as Response;

const liveOptions = (overrides: Record<string, unknown> = {}) => ({
  date: "2026-08-14",
  email: TEST_EMAIL,
  mockRecipient: TEST_EMAIL,
  live: true,
  all: false,
  confirmSend: false,
  allowAllLive: false,
  source: "offline-integrity-test",
  ...overrides,
});

const successfulAuditFetch = () =>
  vi.fn(async (_url: string, init: RequestInit = {}) => {
    const method = (init.method || "GET").toUpperCase();
    if (method === "POST") return response({ status: 201, json: [{ id: "audit-1" }] });
    if (method === "PATCH") return response({ status: 204 });
    throw new Error(`Unexpected offline fetch method: ${method}`);
  });

const auditPatches = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls
    .filter(([, init]) => (init?.method || "GET").toUpperCase() === "PATCH")
    .map(([, init]) => JSON.parse(String(init?.body)));

describe("MTA devotional send integrity", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MTA_DEVOTIONAL_LIVE_SEND_ENABLED = "true";
    process.env.MTA_DEVOTIONAL_SENDS_DISABLED = "false";
    process.env.RESEND_API_KEY = "offline-test-resend-key";
    process.env.SUPABASE_URL = "https://supabase.example.invalid";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "offline-test-service-key";
    mockResendSend.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records sent only after provider success with a non-empty message ID", async () => {
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({ data: { id: "provider-message-1" }, error: null });

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(summary.result).toMatchObject({
      sent: 1,
      failed: 0,
      indeterminate: 0,
      provider_accepted: 1,
      reconciliation_required: false,
    });
    expect(summary.safety.provider_calls_used).toBe(1);
    expect(auditPatches(fetchMock)).toEqual([
      expect.objectContaining({ status: "sent", provider_message_id: "provider-message-1" }),
    ]);
  });

  it.each([400, 503])("records an HTTP %s provider error as failed, never sent", async (statusCode) => {
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({
      data: null,
      error: { name: "provider_error", statusCode, message: "raw provider detail must not persist" },
    });

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(summary.result).toMatchObject({ sent: 0, failed: 1, indeterminate: 0 });
    expect(auditPatches(fetchMock)).toEqual([
      { status: "failed", error_message: `Provider rejected the send (HTTP ${statusCode}).` },
    ]);
  });

  it("keeps a thrown network outcome pending and requires reconciliation", async () => {
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockRejectedValue(new Error("raw network detail must not persist"));

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(summary.result).toMatchObject({
      sent: 0,
      failed: 0,
      indeterminate: 1,
      reconciliation_required: true,
      reconciliation_reason: "provider_outcome_indeterminate",
      automatic_retry_attempted: false,
    });
    expect(auditPatches(fetchMock)).toEqual([
      {
        status: "pending",
        error_message: "Provider outcome indeterminate after a network exception; manual reconciliation is required.",
      },
    ]);
  });

  it("keeps a status-less provider error pending because delivery may be indeterminate", async () => {
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({
      data: null,
      error: { name: "application_error", statusCode: null, message: "simulated transport failure" },
    });

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(summary.result).toMatchObject({
      sent: 0,
      failed: 0,
      indeterminate: 1,
      reconciliation_required: true,
      reconciliation_reason: "provider_outcome_indeterminate",
    });
    expect(auditPatches(fetchMock)[0]).toMatchObject({ status: "pending" });
  });

  it("keeps a provider response without a message ID pending and never marks it sent", async () => {
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({ data: { id: " " }, error: null });

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(summary.result).toMatchObject({
      sent: 0,
      indeterminate: 1,
      provider_accepted: 0,
      provider_message_id_present: false,
      reconciliation_required: true,
      reconciliation_reason: "provider_response_missing_message_id",
    });
    expect(auditPatches(fetchMock)[0]).toMatchObject({ status: "pending" });
  });

  it("does not call the provider when the reservation is already present", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit = {}) => {
      if ((init.method || "GET").toUpperCase() === "POST") return response({ ok: false, status: 409 });
      throw new Error("Unexpected fetch after duplicate reservation");
    });
    vi.stubGlobal("fetch", fetchMock);

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(mockResendSend).not.toHaveBeenCalled();
    expect(summary.result).toMatchObject({ sent: 0, skipped: 1 });
    expect(summary.safety.provider_calls_used).toBe(0);
  });

  it("does not call the provider when audit reservation fails", async () => {
    const fetchMock = vi.fn(async () =>
      response({ ok: false, status: 500, text: "sanitized simulated reservation failure" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(runMtaDevotionalEmailSend(liveOptions())).rejects.toThrow("Audit reservation failed (500)");
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("surfaces provider success plus audit-finalization failure without retrying", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit = {}) => {
      const method = (init.method || "GET").toUpperCase();
      if (method === "POST") return response({ status: 201, json: [{ id: "audit-1" }] });
      if (method === "PATCH") return response({ ok: false, status: 503, text: "simulated audit outage" });
      throw new Error(`Unexpected offline fetch method: ${method}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({ data: { id: "provider-message-1" }, error: null });

    const summary = await runMtaDevotionalEmailSend(liveOptions());

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(summary.result).toMatchObject({
      sent: 0,
      provider_accepted: 1,
      reconciliation_required: true,
      reconciliation_reason: "provider_succeeded_audit_finalization_failed",
      automatic_retry_attempted: false,
    });
    expect(summary.safety.provider_calls_used).toBe(1);
  });

  it("blocks live sending when the emergency kill switch is active", async () => {
    process.env.MTA_DEVOTIONAL_SENDS_DISABLED = "true";
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);

    await expect(runMtaDevotionalEmailSend(liveOptions())).rejects.toThrow(
      "MTA_DEVOTIONAL_SENDS_DISABLED=true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("blocks live sending when affirmative authorization is unset", async () => {
    delete process.env.MTA_DEVOTIONAL_LIVE_SEND_ENABLED;
    const fetchMock = successfulAuditFetch();
    vi.stubGlobal("fetch", fetchMock);

    await expect(runMtaDevotionalEmailSend(liveOptions())).rejects.toThrow(
      "MTA_DEVOTIONAL_LIVE_SEND_ENABLED must be exactly true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it.each(["false", "TRUE", "1"])(
    "blocks live sending when affirmative authorization is %s",
    async (value) => {
      process.env.MTA_DEVOTIONAL_LIVE_SEND_ENABLED = value;
      const fetchMock = successfulAuditFetch();
      vi.stubGlobal("fetch", fetchMock);

      await expect(runMtaDevotionalEmailSend(liveOptions())).rejects.toThrow(
        "MTA_DEVOTIONAL_LIVE_SEND_ENABLED must be exactly true",
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockResendSend).not.toHaveBeenCalled();
    },
  );

  it("defensively bounds the explicit-email live path to one provider call", async () => {
    const recipients = [
      { id: "registration-1", full_name: "Recipient One", email: TEST_EMAIL, fast_commitment: "yes", joining_fast: true },
      { id: "registration-2", full_name: "Recipient Two", email: TEST_EMAIL, fast_commitment: "yes", joining_fast: true },
    ];
    const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = (init.method || "GET").toUpperCase();
      if (method === "HEAD") return response({ contentRange: "0-0/2" });
      if (method === "GET" && url.includes("/mta_registrations?")) {
        expect(url).toContain("limit=1");
        return response({ json: recipients });
      }
      if (method === "POST") return response({ status: 201, json: [{ id: "audit-1" }] });
      if (method === "PATCH") return response({ status: 204 });
      throw new Error(`Unexpected offline fetch method: ${method}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({ data: { id: "provider-message-1" }, error: null });

    const summary = await runMtaDevotionalEmailSend(
      liveOptions({ mockRecipient: undefined, limit: 99 }),
    );

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(summary.safety.provider_calls_used).toBe(1);
    expect(summary.result.sent).toBe(1);
  });

  it("allows at most one provider call across concurrent duplicate attempts", async () => {
    let reservationAttempts = 0;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit = {}) => {
      const method = (init.method || "GET").toUpperCase();
      if (method === "POST") {
        reservationAttempts += 1;
        return reservationAttempts === 1
          ? response({ status: 201, json: [{ id: "audit-1" }] })
          : response({ ok: false, status: 409 });
      }
      if (method === "PATCH") return response({ status: 204 });
      throw new Error(`Unexpected offline fetch method: ${method}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockResolvedValue({ data: { id: "provider-message-1" }, error: null });

    const summaries = await Promise.all([
      runMtaDevotionalEmailSend(liveOptions()),
      runMtaDevotionalEmailSend(liveOptions()),
    ]);

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(summaries.reduce((total, item) => total + item.safety.provider_calls_used, 0)).toBe(1);
  });
});
