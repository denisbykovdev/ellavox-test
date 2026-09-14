import { describe, expect, it } from "vitest";
import { postMessage, useGateway } from "./helpers.js";

describe("gateway status routing", () => {
  const gw = useGateway();

  it("routes STATUS to statusSkill with session data on MessageContext", async () => {
    let now = 1_000_000;
    const port = await gw.start({ now: () => now });

    await postMessage(port, { channel: "webchat", sender: "u1", text: "echo one" });
    now = 1_005_000;
    const res = await postMessage(port, { channel: "webchat", sender: "u1", text: "STATUS" });

    expect(res.status).toBe(200);
    expect(res.json.skill).toBe("status");
    expect((res.json.result as { text: string }).text).toContain("messages: 2");
    expect((res.json.result as { text: string }).text).toContain("ageSeconds: 5");
    expect((res.json.result as { text: string }).text).toContain("echo one");
  });
});
