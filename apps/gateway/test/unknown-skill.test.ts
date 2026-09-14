import { describe, expect, it } from "vitest";
import { httpJson, postMessage, useGateway } from "./helpers.js";

describe("unknown skills", () => {
  const gw = useGateway();

  it("returns 400 UNKNOWN_SKILL with the provided name and availableSkills", async () => {
    const port = await gw.start({ now: () => 1_000_000 });

    const byText = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      text: "nope do something"
    });
    expect(byText.status).toBe(400);
    expect(byText.json).toMatchObject({
      error: "unknown_skill",
      errorCode: "UNKNOWN_SKILL",
      skill: "nope",
      availableSkills: ["pairing", "report", "echo", "status"]
    });

    const byField = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      skill: "missing",
      text: "echo hello"
    });
    expect(byField.status).toBe(400);
    expect(byField.json.errorCode).toBe("UNKNOWN_SKILL");
    expect(byField.json.skill).toBe("missing");
    expect(byField.json.availableSkills).toEqual(["pairing", "report", "echo", "status"]);
  });

  it("does not treat pairfoo or statusxyz as prefix matches", async () => {
    const port = await gw.start({ now: () => 1_000_000 });

    const pairfoo = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      text: "pairfoo 1234"
    });
    expect(pairfoo.status).toBe(400);
    expect(pairfoo.json.errorCode).toBe("UNKNOWN_SKILL");
    expect(pairfoo.json.skill).toBe("pairfoo");

    const statusxyz = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      text: "statusxyz"
    });
    expect(statusxyz.status).toBe(400);
    expect(statusxyz.json.skill).toBe("statusxyz");
  });

  it("keeps known skills and the success response shape working", async () => {
    const port = await gw.start({ now: () => 1_000_000 });

    const echo = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      text: "echo hello"
    });
    expect(echo.status).toBe(200);
    expect(echo.json).toMatchObject({
      sessionId: expect.any(String),
      skill: "echo",
      result: { text: expect.stringContaining("hello") }
    });

    const pairing = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      text: "pair 1234"
    });
    expect(pairing.status).toBe(200);
    expect(pairing.json.skill).toBe("pairing");
    expect(pairing.json).toHaveProperty("sessionId");
    expect(pairing.json).toHaveProperty("result");

    const report = await postMessage(port, {
      channel: "webchat",
      sender: "u1",
      text: "report (555) 123-4567 hello"
    });
    expect(report.status).toBe(200);
    expect(report.json.skill).toBe("report");
    expect(report.json).toMatchObject({
      sessionId: expect.any(String),
      result: { text: expect.stringContaining("To: +15551234567") }
    });
  });

  it("returns 400 for invalid JSON instead of hanging", async () => {
    const port = await gw.start({ now: () => 1_000_000 });
    const res = await httpJson(port, "POST", "/message", "{not json");
    expect(res.status).toBe(400);
    expect(res.json).toEqual({ error: "invalid_json" });
  });
});
