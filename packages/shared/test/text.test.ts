import { describe, expect, it } from "vitest";
import { ellipsis, sanitizeInboundText } from "../src/text.js";

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

describe("ellipsis", () => {
  it("returns the input when it already fits", () => {
    expect(ellipsis("hi", 10)).toBe("hi");
  });

  it("truncates to max length including the ellipsis character", () => {
    expect(ellipsis("abcdefghij", 8)).toBe("abcdefg…");
    expect(ellipsis("abcdefghij", 8).length).toBe(8);
  });
});
