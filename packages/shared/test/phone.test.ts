import { describe, expect, it } from "vitest";
import { normalizePhone } from "../src/phone.js";

describe("normalizePhone", () => {
  it("normalizes a 10-digit US number to +1XXXXXXXXXX", () => {
    expect(normalizePhone("5551234567")).toBe("+15551234567");
  });

  it("normalizes an 11-digit number with leading 1 without double-prefixing", () => {
    expect(normalizePhone("15551234567")).toBe("+15551234567");
  });

  it("keeps an already-E.164 US number", () => {
    expect(normalizePhone("+15551234567")).toBe("+15551234567");
  });

  it("strips junk characters from formatted US numbers", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("555-123-4567")).toBe("+15551234567");
    expect(normalizePhone("1 (555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });
});
