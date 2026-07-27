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

describe("api/operator/validate-session", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MTA_CHECKIN_OPERATOR_SECRET = SECRET;
    delete process.env.MTA_CHECKIN_OPERATOR_IDS;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns 503 when not configured", async () => {
    delete process.env.MTA_CHECKIN_OPERATOR_SECRET;
    const handler = (await import("../../../api/operator/validate-session")).default;
    const { req, res, status } = makeReqRes({ body: { operator: "Vol1" } });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(503);
  });

  it("returns 401 for a bad secret", async () => {
    const handler = (await import("../../../api/operator/validate-session")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: "Bearer wrong" },
      body: { operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when operator is missing", async () => {
    const handler = (await import("../../../api/operator/validate-session")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: {},
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 403 UNKNOWN_OPERATOR when an allow-list is configured and the operator is not on it", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie";
    const handler = (await import("../../../api/operator/validate-session")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { operator: "SomeoneElse" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: "UNKNOWN_OPERATOR" }));
  });

  it("returns 200 success for a valid secret and allow-listed operator", async () => {
    process.env.MTA_CHECKIN_OPERATOR_IDS = "RuthAnozie,Vol1";
    const handler = (await import("../../../api/operator/validate-session")).default;
    const { req, res, status, json } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { operator: "Vol1" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ success: true });
  });

  it("returns 200 success for a valid secret when no allow-list is configured", async () => {
    const handler = (await import("../../../api/operator/validate-session")).default;
    const { req, res, status } = makeReqRes({
      headers: { authorization: `Bearer ${SECRET}` },
      body: { operator: "AnyName" },
    });
    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);
  });
});
