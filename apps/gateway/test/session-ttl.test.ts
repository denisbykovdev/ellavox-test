import { describe, expect, it } from "vitest";
import { DEFAULT_SESSION_TTL_SECONDS } from "../src/session.js";
import { httpJson, useGateway } from "./helpers.js";

const TTL_MS = DEFAULT_SESSION_TTL_SECONDS * 1000;

describe("gateway session TTL", () => {
  const gw = useGateway();

  it("returns 401 when the session has reached SESSION_TTL_SECONDS without sleeping", async () => {
    let now = 1_000_000;
    const port = await gw.start({
      now: () => now,
      ttlSeconds: DEFAULT_SESSION_TTL_SECONDS
    });
    const payload = { channel: "webchat", sender: "u1", text: "echo hello" };

    const first = await httpJson(port, "POST", "/message", payload);
    expect(first.status).toBe(200);

    now += TTL_MS;
    const expired = await httpJson(port, "POST", "/message", payload);
    expect(expired.status).toBe(401);
    expect(expired.json).toEqual({ error: "session_expired" });
  });

  it("keeps /message at 200 just before TTL and leaves /health unchanged", async () => {
    let now = 1_000_000;
    const port = await gw.start({
      now: () => now,
      ttlSeconds: DEFAULT_SESSION_TTL_SECONDS
    });
    const payload = { channel: "webchat", sender: "u1", text: "echo hello" };

    expect((await httpJson(port, "POST", "/message", payload)).status).toBe(200);

    now += TTL_MS - 1;
    const stillValid = await httpJson(port, "POST", "/message", payload);
    expect(stillValid.status).toBe(200);
    expect(stillValid.json).toMatchObject({ skill: "echo" });

    const health = await httpJson(port, "GET", "/health");
    expect(health.status).toBe(200);
    expect(health.json).toEqual({ ok: true, sessions: 1 });
  });
});
