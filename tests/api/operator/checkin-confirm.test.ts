import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// No real network call, Supabase project, or participant data is ever
// exercised by this suite — fetch is a fully controlled stub.
function makeReqRes(opts: {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}) {
  const req = {
    method: opts.method ?? "POST",
    headers: opts.headers ?? {},
    body: opts.body,
  } as unknown as VercelRequest;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const setHeader = vi.fn();
  const res = { status, setHeader } as unknown as VercelResponse;
  return { req, res, status, json };
}

const SECRET = "test-operator-secret";
const VALID_ID = "11111111-1111-4111-8111-111111111111";
const ATTENDANCE_TABLE = "mta_event_attendance";

describe("api/operator/checkin-confirm", () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.SUPABASE_URL = "https://staging.example.invalid";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    process.env.MTA_CHECKIN_OPERATOR_SECRET = SECRET;
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 503 when MTA_CHECKIN_OPERATOR_SECRET is not configured", async () => {
    delete process.env.MTA_CHECKIN_OPERATOR_SECRET;
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({ body: {} });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer secret does not match", async () => {
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: "Bearer wrong-secret" },
      body: {},
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid registrationId", async () => {
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: "not-a-uuid", method: "qr_scan", operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 400 for an invalid method", async () => {
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "carrier_pigeon", operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when the registration does not exist", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("returns ALREADY_CHECKED_IN (200, success:false) without inserting when a non-reversed row already exists and confirmDuplicate is not set", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && url.includes("reversed=eq.false")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "att-1", checked_in_at: "2026-09-04T07:00:00.000Z", checked_in_by: "Vol0" }],
        } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, code: "ALREADY_CHECKED_IN" }));
    // Only two GET lookups happened — no POST insert was attempted.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("inserts a new attendance row and returns 201 for a not-yet-checked-in registrant", async () => {
    let insertCalled = false;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && (!init || init.method === "GET")) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && init?.method === "POST") {
        insertCalled = true;
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "manual_lookup", operator: "Vol1" },
    });
    await handler(req, res);
    expect(insertCalled).toBe(true);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        attendance: expect.objectContaining({
          registration_id: VALID_ID,
          full_name: "Synthetic Tester",
          checked_in_by: "Vol1",
          method: "manual_lookup",
        }),
      })
    );
  });

  it("allows a deliberate second entry when confirmDuplicate is true", async () => {
    let insertCalled = false;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && (!init || init.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "att-1", checked_in_at: "2026-09-04T07:00:00.000Z", checked_in_by: "Vol0" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && init?.method === "POST") {
        insertCalled = true;
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1", confirmDuplicate: true },
    });
    await handler(req, res);
    expect(insertCalled).toBe(true);
    expect(status).toHaveBeenCalledWith(201);
  });
});
