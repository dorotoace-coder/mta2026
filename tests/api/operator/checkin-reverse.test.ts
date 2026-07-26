import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function makeReqRes(opts: { headers?: Record<string, string>; body?: Record<string, unknown> }) {
  const req = {
    method: "POST",
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
const VALID_ID = "22222222-2222-4222-8222-222222222222";
const ATTENDANCE_TABLE = "mta_event_attendance";

describe("api/operator/checkin-reverse", () => {
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

  it("returns 400 when note is missing", async () => {
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 403 UNKNOWN_OPERATOR when an allow-list is configured and the operator is not on it", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie";
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "SomeoneElse", note: "Mistaken scan" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "UNKNOWN_OPERATOR" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("performs the reversal as a single conditional UPDATE (no prior read) and returns 200 with the row it actually changed", async () => {
    let sawPatch = false;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      expect(url).toContain(`/rest/v1/${ATTENDANCE_TABLE}`);
      expect(url).toContain("reversed=eq.false");
      expect(init?.method).toBe("PATCH");
      sawPatch = true;
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: VALID_ID, reversed_at: "2026-09-04T08:00:00.000Z", reversed_by: "Vol1" }],
      } as Response);
    });
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1", note: "Mistaken scan, correcting" },
    });
    await handler(req, res);
    expect(sawPatch).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no separate pre-check read
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, attendance_id: VALID_ID, reversed_by: "Vol1" })
    );
  });

  it("returns 404 when the conditional UPDATE matches nothing and the row does not exist at all", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true, json: async () => [] } as Response); // zero rows matched
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response); // classification lookup: not found
    });
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1", note: "Mistaken scan" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("returns 409 ALREADY_REVERSED when the conditional UPDATE matches nothing because the row was already reversed (e.g. by a concurrent winner)", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true, json: async () => [] } as Response); // this request lost the race
      }
      return Promise.resolve({ ok: true, json: async () => [{ id: VALID_ID }] } as Response); // row exists, just already reversed
    });
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol2", note: "Attempting duplicate correction" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "ALREADY_REVERSED" }));
  });

  it("models two concurrent reversal attempts on the same row: exactly one winner (200), one loser (409), with no request ever reading before writing", async () => {
    const patchCalls: string[] = [];
    // First handler invocation: its PATCH is the one that "wins".
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      expect(init?.method).toBe("PATCH"); // winner never issues a GET
      patchCalls.push("winner");
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: VALID_ID, reversed_at: "2026-09-04T08:00:00.000Z", reversed_by: "Vol1" }],
      } as Response);
    });
    const handlerA = (await import("../../../api/operator/checkin-reverse")).default;
    const { req: reqA, res: resA, status: statusA } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1", note: "Correcting mistaken scan" },
    });
    await handlerA(reqA, resA);
    expect(statusA).toHaveBeenCalledWith(200);

    // Second, "losing" request against the now-already-reversed row.
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        patchCalls.push("loser");
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [{ id: VALID_ID }] } as Response);
    });
    vi.resetModules();
    const handlerB = (await import("../../../api/operator/checkin-reverse")).default;
    const { req: reqB, res: resB, status: statusB, json: jsonB } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol2", note: "Also attempting correction" },
    });
    await handlerB(reqB, resB);
    expect(statusB).toHaveBeenCalledWith(409);
    expect(jsonB).toHaveBeenCalledWith(expect.objectContaining({ code: "ALREADY_REVERSED" }));
    expect(patchCalls).toEqual(["winner", "loser"]);
  });
});
