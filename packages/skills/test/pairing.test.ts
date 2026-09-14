import { describe, expect, it } from "vitest";
import { isPairingCodeValid } from "../src/skills/pairing.js";

const TTL_MS = 10 * 60 * 1000;
const SKEW_MS = 15 * 1000;

describe("pairing", () => {
  const createdAt = 1_000_000;
  const code = "1234";

  it("treats a newly generated code as valid", () => {
    expect(isPairingCodeValid({ code, createdAt }, createdAt)).toBe(true);
  });

  it("is still valid just before the 10-minute expiry", () => {
    expect(isPairingCodeValid({ code, createdAt }, createdAt + TTL_MS - 1)).toBe(true);
  });

  it("is invalid just after the tolerated expiry", () => {
    expect(isPairingCodeValid({ code, createdAt }, createdAt + TTL_MS + SKEW_MS + 1)).toBe(
      false
    );
  });

  it("allows +15s clock skew past 10 minutes", () => {
    expect(isPairingCodeValid({ code, createdAt }, createdAt + TTL_MS + SKEW_MS)).toBe(true);
  });

  it("allows -15s clock skew before createdAt", () => {
    expect(isPairingCodeValid({ code, createdAt }, createdAt - SKEW_MS)).toBe(true);
  });

  it("rejects clocks more than 15s behind createdAt", () => {
    expect(isPairingCodeValid({ code, createdAt }, createdAt - SKEW_MS - 1)).toBe(false);
  });
});
