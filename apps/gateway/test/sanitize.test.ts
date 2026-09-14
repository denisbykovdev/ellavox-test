import { describe, expect, it } from "vitest";
import { httpJson, useGateway } from "./helpers.js";

describe("gateway inbound sanitization", () => {
  const gw = useGateway();

  it("sanitizes inbound /message text with the shared helper", async () => {
    const port = await gw.start({ now: () => 1_000_000 });
    const res = await httpJson(port, "POST", "/message", {
      channel: "webchat",
      sender: "u1",
      text: "echo hello  \r\nworld\u2028"
    });
    const json = res.json as { result: { text: string } };

    expect(res.status).toBe(200);
    expect(json.result.text).toContain("hello\nworld");
    expect(json.result.text).not.toContain("\r");
    expect(json.result.text).not.toContain("hello world");
  });
});
