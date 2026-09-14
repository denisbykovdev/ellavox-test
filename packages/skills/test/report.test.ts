import { describe, expect, it } from "vitest";
import { reportSkill } from "../src/skills/report.js";

describe("report", () => {
  it("normalizes US 10-digit numbers to +1...", async () => {
    const res = await reportSkill.run({
      channel: "webchat",
      sender: "u1",
      text: "report (555) 123-4567 hello",
      timestampMs: Date.now()
    });

    expect(res.text).toContain("To: +15551234567");
  });
});
