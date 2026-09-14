import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createGateway } from "../src/gateway.js";
import { DEFAULT_SESSION_TTL_SECONDS } from "../src/session.js";

const TTL_MS = DEFAULT_SESSION_TTL_SECONDS * 1000;

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  return (server.address() as AddressInfo).port;
}

async function httpJson(
  port: number,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  return { status: res.status, json: await res.json() };
}

describe("gateway session TTL", () => {
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

  it("returns 401 when the session has reached SESSION_TTL_SECONDS without sleeping", async () => {
    let now = 1_000_000;
    const server = createGateway({
      now: () => now,
      ttlSeconds: DEFAULT_SESSION_TTL_SECONDS
    });
    servers.push(server);
    const port = await listen(server);
    const payload = { channel: "webchat", sender: "u1", text: "hello" };

    const first = await httpJson(port, "POST", "/message", payload);
    expect(first.status).toBe(200);

    now += TTL_MS;
    const expired = await httpJson(port, "POST", "/message", payload);
    expect(expired.status).toBe(401);
    expect(expired.json).toEqual({ error: "session_expired" });
  });

  it("keeps /message at 200 just before TTL and leaves /health unchanged", async () => {
    let now = 1_000_000;
    const server = createGateway({
      now: () => now,
      ttlSeconds: DEFAULT_SESSION_TTL_SECONDS
    });
    servers.push(server);
    const port = await listen(server);
    const payload = { channel: "webchat", sender: "u1", text: "hello" };

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
