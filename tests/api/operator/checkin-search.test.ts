import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function makeReqRes(opts: { headers?: Record<string, string>; query?: Record<string, unknown> }) {
  const req = {
    method: "GET",
    headers: opts.headers ?? {},
    query: opts.query ?? {},
  } as unknown as VercelRequest;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const setHeader = vi.fn();
  const res = { status, setHeader } as unknown as VercelResponse;
  return { req, res, status, json };
}

const SECRET = "test-operator-secret";
const VALID_ID = "33333333-3333-4333-8333-333333333333";
const OPERATOR = "Vol1";

describe("api/operator/checkin-search", () => {
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

  it("returns 503 when not configured", async () => {
    delete process.env.MTA_CHECKIN_OPERATOR_SECRET;
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({ query: { query: "Synthetic", operator: OPERATOR } });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(503);
  });

  it("returns 401 for a bad secret", async () => {
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: "Bearer wrong" },
      query: { query: "Synthetic", operator: OPERATOR },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when operator is missing, even with a valid secret", async () => {
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "Synthetic" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 403 UNKNOWN_OPERATOR when an allow-list is configured and the operator is not on it — a revoked operator loses read access immediately, not only on the next write", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie";
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "Synthetic", operator: "RemovedOperator" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "UNKNOWN_OPERATOR" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 403 UNKNOWN_OPERATOR for an exact-ID (QR) lookup too, not only fuzzy search", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie";
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { registrationId: VALID_ID, operator: "RemovedOperator" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "UNKNOWN_OPERATOR" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows the request when the operator is on the configured allow-list", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie,Vol1";
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] } as Response);
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "Synthetic", operator: OPERATOR },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
  });

  it("returns 400 for a query shorter than 2 characters", async () => {
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "a", operator: OPERATOR },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns fuzzy-search matches with a masked email as the disambiguation field, never the raw email", async () => {
    fetchMock.mockImplementation((url: string) => {
      expect(url).toContain("select=id,full_name,attendance_mode,email,phone");
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: "reg-1",
            full_name: "Synthetic Tester",
            attendance_mode: "in_person",
            email: "jane.doe@example.invalid",
            phone: "000-000-1234",
          },
        ],
      } as Response);
    });
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "Synthetic", operator: OPERATOR },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0][0];
    expect(payload).toEqual({
      success: true,
      results: [
        {
          id: "reg-1",
          full_name: "Synthetic Tester",
          attendance_mode: "in_person",
          masked_contact: "j•••••••@example.invalid",
        },
      ],
    });
    expect(JSON.stringify(payload)).not.toContain("jane.doe@example.invalid");
    expect(JSON.stringify(payload)).not.toContain("000-000-1234");
  });

  it("falls back to a masked phone when a result has no email", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          { id: "reg-2", full_name: "No Email Tester", attendance_mode: "online", email: null, phone: "555-123-4567" },
        ],
      } as Response)
    );
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "No Email", operator: OPERATOR },
    });
    await handler(req, res);
    expect(json).toHaveBeenCalledWith({
      success: true,
      results: [
        { id: "reg-2", full_name: "No Email Tester", attendance_mode: "online", masked_contact: "•••-•••-4567" },
      ],
    });
  });

  it("returns 400 for an invalid registrationId", async () => {
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { registrationId: "not-a-uuid", operator: OPERATOR },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("performs an exact-ID lookup (used to resolve a scanned QR code) instead of the fuzzy search when registrationId is provided", async () => {
    fetchMock.mockImplementation((url: string) => {
      expect(url).toContain(`id=eq.${VALID_ID}`);
      expect(url).not.toContain("ilike");
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: VALID_ID, full_name: "Scanned Registrant", attendance_mode: "online" }],
      } as Response);
    });
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { registrationId: VALID_ID, operator: OPERATOR },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      results: [{ id: VALID_ID, full_name: "Scanned Registrant", attendance_mode: "online" }],
    });
  });
});
