import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createGateway } from "../src/gateway.js";

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  return (server.address() as AddressInfo).port;
}

async function postMessage(
  port: number,
  body: unknown
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`http://127.0.0.1:${port}/message`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe("unknown skills", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
          })
      )
    );
  });

  it("returns 400 UNKNOWN_SKILL with the provided name and availableSkills", async () => {
    const server = createGateway({ now: () => 1_000_000 });
    servers.push(server);
    const port = await listen(server);

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

  it("keeps known skills and the success response shape working", async () => {
    const server = createGateway({ now: () => 1_000_000 });
    servers.push(server);
    const port = await listen(server);

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
});
