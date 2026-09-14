import { describe, expect, it } from "vitest";
import { sanitizeInboundText } from "../src/text.js";

describe("sanitizeInboundText", () => {
  it("converts CRLF to LF", () => {
    expect(sanitizeInboundText("hello\r\nworld")).toBe("hello\nworld");
  });

  it("replaces Unicode line and paragraph separators with LF", () => {
    expect(sanitizeInboundText("a\u2028b\u2029c")).toBe("a\nb\nc");
  });

  it("trims trailing whitespace on each line", () => {
    expect(sanitizeInboundText("one  \ntwo\t\nthree")).toBe("one\ntwo\nthree");
  });

  it("does not collapse newlines into spaces", () => {
    expect(sanitizeInboundText("hello\nworld")).toBe("hello\nworld");
  });

  it("applies CRLF, Unicode separators, and per-line trim together", () => {
    expect(sanitizeInboundText("a  \r\nb\u2028c \t")).toBe("a\nb\nc");
  });
});
