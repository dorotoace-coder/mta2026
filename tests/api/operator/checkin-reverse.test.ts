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

  it("returns 404 when the attendance row does not exist", async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: true, json: async () => [] } as Response));
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1", note: "Mistaken scan" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("returns 409 when the row is already reversed", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: async () => [{ id: VALID_ID, reversed: true }] } as Response)
    );
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1", note: "Mistaken scan" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "ALREADY_REVERSED" }));
  });

  it("reverses an active check-in and returns 200", async () => {
    let patchBody: unknown;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        patchBody = JSON.parse(init.body as string);
        return Promise.resolve({ ok: true, text: async () => "" } as Response);
      }
      expect(url).toContain(`/rest/v1/${ATTENDANCE_TABLE}`);
      return Promise.resolve({ ok: true, json: async () => [{ id: VALID_ID, reversed: false }] } as Response);
    });
    const handler = (await import("../../../api/operator/checkin-reverse")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { attendanceId: VALID_ID, operator: "Vol1", note: "Mistaken scan, correcting" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, attendance_id: VALID_ID }));
    expect(patchBody).toMatchObject({
      reversed: true,
      reversed_by: "Vol1",
      note: "Mistaken scan, correcting",
    });
  });
});
