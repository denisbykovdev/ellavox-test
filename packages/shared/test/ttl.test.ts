import { describe, expect, it } from "vitest";
import { isTtlExpired } from "../src/time.js";

const TTL_SECONDS = 3600;
const TTL_MS = TTL_SECONDS * 1000;

describe("isTtlExpired", () => {
  const lastSeenAt = 1_000_000;

  it("is not expired 1ms before TTL", () => {
    expect(isTtlExpired(lastSeenAt, lastSeenAt + TTL_MS - 1, TTL_SECONDS)).toBe(false);
  });

  it("is expired at exactly TTL", () => {
    expect(isTtlExpired(lastSeenAt, lastSeenAt + TTL_MS, TTL_SECONDS)).toBe(true);
  });

  it("is expired 1ms after TTL", () => {
    expect(isTtlExpired(lastSeenAt, lastSeenAt + TTL_MS + 1, TTL_SECONDS)).toBe(true);
  });
});
