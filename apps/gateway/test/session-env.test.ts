import { describe, expect, it } from "vitest";
import { DEFAULT_SESSION_TTL_SECONDS, readSessionTtlSeconds } from "../src/session.js";

describe("readSessionTtlSeconds", () => {
  it("defaults to 3600 when unset", () => {
    expect(readSessionTtlSeconds(undefined)).toBe(DEFAULT_SESSION_TTL_SECONDS);
    expect(DEFAULT_SESSION_TTL_SECONDS).toBe(3600);
  });

  it("parses SESSION_TTL_SECONDS", () => {
    expect(readSessionTtlSeconds("120")).toBe(120);
  });
});
