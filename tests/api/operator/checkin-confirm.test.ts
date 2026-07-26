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
const DAY1 = "2026-09-04";
const DAY2 = "2026-09-05";

describe("api/operator/checkin-confirm", () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.SUPABASE_URL = "https://staging.example.invalid";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    process.env.MTA_CHECKIN_OPERATOR_SECRET = SECRET;
    delete process.env.MTA_CHECKIN_OPERATOR_IDS;
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
      body: { registrationId: "not-a-uuid", method: "qr_scan", operator: "Vol1", eventDate: DAY1 },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 400 for an invalid method", async () => {
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "carrier_pigeon", operator: "Vol1", eventDate: DAY1 },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 400 for an eventDate outside the event window", async () => {
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1", eventDate: "2026-01-01" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ valid_event_dates: [DAY1, DAY2, "2026-09-06"] }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 403 UNKNOWN_OPERATOR when an allow-list is configured and the operator is not on it", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie,Vol1";
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "SomeoneElse", eventDate: DAY1 },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "UNKNOWN_OPERATOR" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a request when the operator is on the configured allow-list", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie,Vol1";
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && init?.method === "POST") {
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1", eventDate: DAY1 },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(201);
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
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1", eventDate: DAY1 },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("inserts a new attendance row and returns 201 on the first check-in for a given event day (single atomic write, no separate pre-check read)", async () => {
    const calls: string[] = [];
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && init?.method === "POST") {
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "manual_lookup", operator: "Vol1", eventDate: DAY1 },
    });
    await handler(req, res);
    // Exactly two calls: registration lookup, then the insert itself.
    // No separate "is this a duplicate?" read happens before the write —
    // the insert attempt is the atomic operation.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        attendance: expect.objectContaining({
          registration_id: VALID_ID,
          event_date: DAY1,
          full_name: "Synthetic Tester",
          checked_in_by: "Vol1",
          method: "manual_lookup",
        }),
      })
    );
  });

  it("supports independent check-ins on two different event days for the same registrant", async () => {
    for (const day of [DAY1, DAY2]) {
      fetchMock.mockReset();
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes("/rest/v1/mta_registrations")) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
          } as Response);
        }
        if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && init?.method === "POST") {
          expect(JSON.parse(init.body as string).event_date).toBe(day);
          return Promise.resolve({ ok: true, text: async () => "" } as Response);
        }
        throw new Error(`Unexpected fetch call: ${url}`);
      });
      const handler = (await import("../../../api/operator/checkin-confirm")).default;
      const { req, res, status } = makeReqRes({
        headers: { authorization: `Bearer ${SECRET}` },
        body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1", eventDate: day },
      });
      await handler(req, res);
      expect(status).toHaveBeenCalledWith(201);
    }
  });

  it("treats a concurrent-insert unique violation (23505) as an atomic, race-safe ALREADY_CHECKED_IN outcome, not a server error", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/rest/v1/mta_registrations")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: VALID_ID, full_name: "Synthetic Tester", attendance_mode: "in_person" }],
        } as Response);
      }
      if (url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) && init?.method === "POST") {
        // Simulates the partial unique index rejecting a second
        // concurrent insert for the same (registration_id, event_date) —
        // PostgREST surfaces the Postgres 23505 error code in the body.
        return Promise.resolve({
          ok: false,
          status: 409,
          text: async () => JSON.stringify({ code: "23505", message: "duplicate key value" }),
        } as Response);
      }
      if (
        url.includes(`/rest/v1/${ATTENDANCE_TABLE}`) &&
        url.includes("reversed=eq.false") &&
        (!init || init.method === "GET")
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: "att-existing", checked_in_at: "2026-09-04T07:00:00.000Z", checked_in_by: "Vol0", event_date: DAY1 },
          ],
        } as Response);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    const handler = (await import("../../../api/operator/checkin-confirm")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { registrationId: VALID_ID, method: "qr_scan", operator: "Vol1", eventDate: DAY1 },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: "ALREADY_CHECKED_IN",
        already: expect.objectContaining({ event_date: DAY1, checked_in_by: "Vol0" }),
      })
    );
  });
});
