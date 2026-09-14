import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createGateway } from "../src/gateway.js";

const gatewayVersion = (
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")
  ) as { version: string }
).version;

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  return (server.address() as AddressInfo).port;
}

describe("GET /healthz", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    delete process.env.HEALTHZ_SECRET;
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
          })
      )
    );
  });

  it("returns status, uptimeSeconds, skillsLoaded, and package.json version", async () => {
    process.env.HEALTHZ_SECRET = "do-not-leak";
    const server = createGateway({ now: () => 5_000_000, startedAt: 2_000_000 });
    servers.push(server);
    const port = await listen(server);

    const healthzRes = await fetch(`http://127.0.0.1:${port}/healthz`);
    const healthz = (await healthzRes.json()) as Record<string, unknown>;

    expect(healthzRes.status).toBe(200);
    expect(Object.keys(healthz).sort()).toEqual(
      ["skillsLoaded", "status", "uptimeSeconds", "version"].sort()
    );
    expect(healthz).toEqual({
      status: "ok",
      uptimeSeconds: 3000,
      skillsLoaded: 4,
      version: gatewayVersion
    });
    expect(JSON.stringify(healthz)).not.toContain("do-not-leak");
    expect(healthz).not.toHaveProperty("env");

    const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
    expect(healthRes.status).toBe(200);
    expect(await healthRes.json()).toEqual({ ok: true, sessions: 0 });
  });
});
