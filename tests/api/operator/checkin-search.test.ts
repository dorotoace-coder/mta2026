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

describe("api/operator/checkin-search", () => {
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

  it("returns 503 when not configured", async () => {
    delete process.env.MTA_CHECKIN_OPERATOR_SECRET;
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({ query: { query: "Synthetic" } });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(503);
  });

  it("returns 401 for a bad secret", async () => {
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: "Bearer wrong" },
      query: { query: "Synthetic" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it("returns 400 for a query shorter than 2 characters", async () => {
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "a" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns matching registrations with only the minimum-necessary fields", async () => {
    fetchMock.mockImplementation((url: string) => {
      expect(url).toContain("select=id,full_name,attendance_mode");
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: "reg-1", full_name: "Synthetic Tester", attendance_mode: "in_person" }],
      } as Response);
    });
    const handler = (await import("../../../api/operator/checkin-search")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      query: { query: "Synthetic" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      results: [{ id: "reg-1", full_name: "Synthetic Tester", attendance_mode: "in_person" }],
    });
  });
});
