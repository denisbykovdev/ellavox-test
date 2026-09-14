import { describe, expect, it } from "vitest";
import { echoSkill, pairingSkill, reportSkill } from "../src/index.js";
import { statusSkill } from "../src/skills/status.js";
import type { MessageContext, SessionMessage } from "../src/skill.js";

function ctx(
  messages: SessionMessage[],
  timestampMs: number,
  createdAt: number
): MessageContext {
  return {
    channel: "webchat",
    sender: "u1",
    text: "status",
    timestampMs,
    session: { createdAt, messages }
  };
}

describe("statusSkill", () => {
  it("summarizes a session with fewer than 5 messages", async () => {
    const messages: SessionMessage[] = [
      { from: "u1", text: "echo one", at: 1_000_000 },
      { from: "u1", text: "echo two", at: 1_001_000 },
      { from: "u1", text: "status", at: 1_005_000 }
    ];
    const res = await statusSkill.run(ctx(messages, 1_005_000, 1_000_000));

    expect(res.text).toContain("messages: 3");
    expect(res.text).toContain("ageSeconds: 5");
    expect(res.text).toContain("- echo one");
    expect(res.text).toContain("- echo two");
    expect(res.text).toContain("- status");
  });

  it("keeps the last 5 messages and truncates each to 80 characters", async () => {
    const long = "x".repeat(100);
    const messages: SessionMessage[] = [
      { from: "u1", text: "echo drop-a", at: 1 },
      { from: "u1", text: "echo drop-b", at: 2 },
      { from: "u1", text: "echo keep-1", at: 3 },
      { from: "u1", text: "echo keep-2", at: 4 },
      { from: "u1", text: "echo keep-3", at: 5 },
      { from: "u1", text: `echo ${long}`, at: 6 },
      { from: "u1", text: "status", at: 7 }
    ];
    const res = await statusSkill.run(ctx(messages, 11_000, 1_000));

    expect(res.text).toContain("messages: 7");
    expect(res.text).toContain("ageSeconds: 10");
    expect(res.text).not.toContain("drop-a");
    expect(res.text).not.toContain("drop-b");
    expect(res.text).toContain("- echo keep-1");
    expect(res.text).toContain("- echo keep-2");
    expect(res.text).toContain("- echo keep-3");
    expect(res.text).toContain("- status");

    const longLine = res.text.split("\n").find((line) => line.startsWith("- echo x"));
    expect(longLine).toBeDefined();
    expect(longLine!.slice(2).length).toBe(80);
    expect(longLine!.slice(2)).toBe(`echo ${"x".repeat(75)}`);
  });

  it("does not require echo, pairing, or report to read session", async () => {
    const base = {
      channel: "webchat" as const,
      sender: "u1",
      timestampMs: 1_000_000
    };
    await expect(echoSkill.run({ ...base, text: "echo hi" })).resolves.toMatchObject({
      text: expect.stringContaining("hi")
    });
    await expect(pairingSkill.run({ ...base, text: "pair 1234" })).resolves.toMatchObject({
      text: expect.stringContaining("Paired")
    });
    await expect(
      reportSkill.run({ ...base, text: "report (555) 123-4567 hello" })
    ).resolves.toMatchObject({
      text: expect.stringContaining("To: +15551234567")
    });
  });
});
