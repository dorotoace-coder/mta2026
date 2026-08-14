import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const mocks = vi.hoisted(() => ({
  assertAuthorized: vi.fn(),
  runSender: vi.fn(),
}));

vi.mock("../../../api/_lib/mtaDevotionalEmailSender.js", () => ({
  assertMtaDevotionalLiveSendAuthorized: mocks.assertAuthorized,
  runMtaDevotionalEmailSend: mocks.runSender,
}));

import handler from "../../../api/cron/mta-devotional";

const makeReqRes = (query: Record<string, string> = {}) => {
  const req = {
    method: "POST",
    headers: { authorization: "Bearer offline-cron-secret" },
    query,
    body: {},
  } as unknown as VercelRequest;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { setHeader: vi.fn(), status } as unknown as VercelResponse;
  return { req, res, status, json };
};

const successfulSummary = {
  mode: "live",
  safety: { provider_calls_used: 1 },
  result: { sent: 1, reconciliation_required: false },
};

describe("MTA devotional cron live authorization", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CRON_SECRET = "offline-cron-secret";
    process.env.MTA_DEVOTIONAL_CRON_ENABLED = "true";
    process.env.MTA_DEVOTIONAL_SINGLE_LIVE_TEST_ENABLED = "true";
    process.env.MTA_DEVOTIONAL_LIVE_SEND_ENABLED = "true";
    process.env.MTA_DEVOTIONAL_SENDS_DISABLED = "false";
    mocks.assertAuthorized.mockReset();
    mocks.runSender.mockReset().mockResolvedValue(successfulSummary);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("blocks before the sender when affirmative live authorization is absent", async () => {
    delete process.env.MTA_DEVOTIONAL_LIVE_SEND_ENABLED;
    mocks.assertAuthorized.mockImplementation(() => {
      throw new Error("Live devotional sending is blocked: MTA_DEVOTIONAL_LIVE_SEND_ENABLED must be exactly true for live sends.");
    });
    const { req, res, status, json } = makeReqRes({ live: "true", email: "recipient@example.invalid" });

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: "live_send_blocked", provider_calls_used: 0 }));
    expect(mocks.runSender).not.toHaveBeenCalled();
  });

  it("blocks all-recipient live requests before the sender", async () => {
    const { req, res, status } = makeReqRes({ live: "true", all: "true", email: "recipient@example.invalid" });

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(403);
    expect(mocks.assertAuthorized).not.toHaveBeenCalled();
    expect(mocks.runSender).not.toHaveBeenCalled();
  });

  it("passes an exact one-recipient bound to the sender", async () => {
    const { req, res, status } = makeReqRes({ live: "true", email: "recipient@example.invalid", limit: "99" });

    await handler(req, res);

    expect(mocks.runSender).toHaveBeenCalledTimes(1);
    expect(mocks.runSender).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "recipient@example.invalid",
        limit: 1,
        live: true,
        all: false,
        allowAllLive: false,
      }),
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it("returns reconciliation-required instead of success for an ambiguous result", async () => {
    mocks.runSender.mockResolvedValue({
      mode: "live",
      safety: { provider_calls_used: 1 },
      result: {
        sent: 0,
        indeterminate: 1,
        reconciliation_required: true,
        reconciliation_reason: "provider_outcome_indeterminate",
      },
    });
    const { req, res, status, json } = makeReqRes({ live: "true", email: "recipient@example.invalid" });

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "single_live_test_reconciliation_required" }),
    );
  });

  it("returns failure instead of completion when no send is finalized", async () => {
    mocks.runSender.mockResolvedValue({
      mode: "live",
      safety: { provider_calls_used: 1 },
      result: { sent: 0, failed: 1, reconciliation_required: false },
    });
    const { req, res, status, json } = makeReqRes({ live: "true", email: "recipient@example.invalid" });

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: "single_live_test_failed" }));
  });
});
