import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Real network delivery is never exercised by these tests — Resend is
// mocked outright, and fetch is a controlled stub (see below). No real
// email, QR delivery, or external communication occurs during this suite.
// Shared across every `new Resend()` instance so tests can assert on it
// regardless of how many times the handler constructs a client.
const mockResendSend = vi.fn().mockResolvedValue({ data: { id: "mock" }, error: null });
vi.mock("resend", () => {
  class Resend {
    emails = { send: mockResendSend };
    constructor(_key?: string) {}
  }
  return { Resend };
});

function makeReqRes(body: Record<string, unknown>) {
  const req = { method: "POST", body } as VercelRequest;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status } as unknown as VercelResponse;
  return { req, res, status, json };
}

const VALID_BODY = {
  fullName: "Synthetic WA Endpoint Tester",
  email: "dor-aios-mta-04-wa-test-endpoint@example.invalid",
  phone: "000-000-0000",
  ministry: "Test Ministry",
  designation: "Test Designation",
  attendanceMode: "online" as const,
  fastCommitment: "no" as const,
  desire: "DOR-AIOS-MTA-04-WA-TEST:ENDPOINT-UNIT-TEST",
};

describe("api/register duplicate handling", () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.SUPABASE_URL = "https://staging.example.invalid";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.MTA_PUBLIC_BASE_URL = "https://mta2026-staging.example.invalid";
    delete process.env.VERCEL_ENV;
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mockResendSend.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 409 DUPLICATE_REGISTRATION when the pre-check RPC reports an existing composite identity, without attempting an insert or sending email", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/rest/v1/rpc/mta_registration_composite_exists")) {
        return Promise.resolve({ ok: true, json: async () => true } as Response);
      }
      throw new Error(`Unexpected fetch call in this test: ${url}`);
    });

    const handler = (await import("../../api/register")).default;
    const { req, res, status, json } = makeReqRes(VALID_BODY);
    await handler(req, res);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: "DUPLICATE_REGISTRATION" })
    );
    // Only the RPC pre-check call was made — no insert attempt.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/rest/v1/rpc/mta_registration_composite_exists");
  });

  it("succeeds normally when the pre-check reports no duplicate and the insert succeeds", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/rest/v1/rpc/mta_registration_composite_exists")) {
        return Promise.resolve({ ok: true, json: async () => false } as Response);
      }
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      throw new Error(`Unexpected fetch call in this test: ${url}`);
    });

    const handler = (await import("../../api/register")).default;
    const { req, res, status, json } = makeReqRes(VALID_BODY);
    await handler(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("returns the same 409 DUPLICATE_REGISTRATION response for a race-condition collision caught only by the database's 23505 (pre-check missed it)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/rest/v1/rpc/mta_registration_composite_exists")) {
        // Pre-check says "no duplicate" — simulates the race window.
        return Promise.resolve({ ok: true, json: async () => false } as Response);
      }
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: false,
          status: 409,
          text: async () =>
            JSON.stringify({
              code: "23505",
              message: "duplicate key value violates unique constraint",
            }),
        } as Response);
      }
      throw new Error(`Unexpected fetch call in this test: ${url}`);
    });

    const handler = (await import("../../api/register")).default;
    const { req, res, status, json } = makeReqRes(VALID_BODY);
    await handler(req, res);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: "DUPLICATE_REGISTRATION" })
    );
    // No raw DB error, SQL detail, or constraint name reached the client response.
    const responseBody = json.mock.calls[0][0];
    expect(JSON.stringify(responseBody)).not.toMatch(/23505|constraint|mta_registrations_composite_identity_uidx/i);
    // A race-condition duplicate is a correctly-blocked resubmission, not a
    // failure needing the email fallback-capture path — no email attempt.
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("pre-check failure (network error) does not block registration — the DB index remains authoritative", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/rest/v1/rpc/mta_registration_composite_exists")) {
        return Promise.reject(new Error("simulated network failure"));
      }
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      throw new Error(`Unexpected fetch call in this test: ${url}`);
    });

    const handler = (await import("../../api/register")).default;
    const { req, res, status, json } = makeReqRes(VALID_BODY);
    await handler(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
