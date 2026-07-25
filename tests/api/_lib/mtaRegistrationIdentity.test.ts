import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizeFullName } from "../../../api/_lib/mtaRegistrationIdentity";

describe("normalizeEmail", () => {
  it("trims outer whitespace", () => {
    expect(normalizeEmail("  a@example.invalid  ")).toBe("a@example.invalid");
  });

  it("lowercases", () => {
    expect(normalizeEmail("A@EXAMPLE.INVALID")).toBe("a@example.invalid");
  });

  it("does not strip dots or plus-addressing (no provider-specific rewriting)", () => {
    expect(normalizeEmail("a.b+tag@example.invalid")).toBe("a.b+tag@example.invalid");
  });
});

describe("normalizeFullName — must reject (rows should be treated as duplicates)", () => {
  it("collapses repeated internal whitespace", () => {
    expect(normalizeFullName("Jane   Doe")).toBe(normalizeFullName("Jane Doe"));
  });

  it("trims outer whitespace", () => {
    expect(normalizeFullName("  Jane Doe  ")).toBe(normalizeFullName("Jane Doe"));
  });

  it("compares case-insensitively", () => {
    expect(normalizeFullName("JANE DOE")).toBe(normalizeFullName("jane doe"));
  });

  it("normalizes typographic apostrophe (U+2019) to ASCII apostrophe (U+0027)", () => {
    const typographic = `O${String.fromCharCode(0x2019)}Brien`;
    const ascii = "O'Brien";
    expect(typographic).not.toBe(ascii); // sanity: raw strings differ
    expect(normalizeFullName(typographic)).toBe(normalizeFullName(ascii));
  });

  it("normalizes non-breaking hyphen (U+2011) to ASCII hyphen (U+002D)", () => {
    const nonBreaking = `Mary${String.fromCharCode(0x2011)}Jane`;
    const ascii = "Mary-Jane";
    expect(nonBreaking).not.toBe(ascii); // sanity: raw strings differ
    expect(normalizeFullName(nonBreaking)).toBe(normalizeFullName(ascii));
  });

  it("treats Unicode NFC and canonically-equivalent NFD as identical", () => {
    // Built from explicit code points so the two forms are guaranteed to be
    // genuinely different byte sequences, not just visually identical text.
    const nfc = `Zo${String.fromCharCode(0x00e9)} Lima`; // U+00E9 — precomposed "e with acute"
    const nfd = `Zo${String.fromCharCode(0x0065)}${String.fromCharCode(0x0301)} Lima`; // U+0065 U+0301 — "e" + combining acute
    expect(nfc).not.toBe(nfd); // sanity: the raw strings really do differ byte-for-byte
    expect(nfc.normalize("NFC")).toBe(nfd.normalize("NFC")); // sanity: they are canonically equivalent
    expect(normalizeFullName(nfc)).toBe(normalizeFullName(nfd));
  });
});

describe("normalizeFullName — must remain distinct (permitted, not fuzzy-matched)", () => {
  it("preserves meaningful punctuation — space vs. hyphen are different names", () => {
    expect(normalizeFullName("Oscar Papa")).not.toBe(normalizeFullName("Oscar-Papa"));
  });

  it("preserves meaningful accents — a genuinely different letter stays different", () => {
    const withoutAccent = "Rene Quebec";
    const withAccent = `Ren${String.fromCharCode(0x00e9)} Quebec`; // "Ren" + precomposed "e with acute"
    expect(normalizeFullName(withoutAccent)).not.toBe(normalizeFullName(withAccent));
  });

  it("does not reorder names", () => {
    expect(normalizeFullName("John Smith")).not.toBe(normalizeFullName("Smith John"));
  });

  it("does not fuzzy-match near-spellings", () => {
    expect(normalizeFullName("Jon Smith")).not.toBe(normalizeFullName("John Smith"));
  });
});
