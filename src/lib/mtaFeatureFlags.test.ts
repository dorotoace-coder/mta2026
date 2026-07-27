import { describe, it, expect, afterEach, vi } from "vitest";
import { isOperatorUiEnabled } from "./mtaFeatureFlags";

describe("isOperatorUiEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to disabled when VITE_ENABLE_OPERATOR_UI is unset", () => {
    vi.stubEnv("VITE_ENABLE_OPERATOR_UI", undefined as unknown as string);
    expect(isOperatorUiEnabled()).toBe(false);
  });

  it("is disabled for any value other than the exact string 'true'", () => {
    vi.stubEnv("VITE_ENABLE_OPERATOR_UI", "1");
    expect(isOperatorUiEnabled()).toBe(false);
  });

  it("is enabled only when explicitly set to 'true'", () => {
    vi.stubEnv("VITE_ENABLE_OPERATOR_UI", "true");
    expect(isOperatorUiEnabled()).toBe(true);
  });
});
