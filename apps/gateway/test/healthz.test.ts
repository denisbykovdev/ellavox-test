import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { httpJson, useGateway } from "./helpers.js";

const gatewayVersion = (
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")
  ) as { version: string }
).version;

describe("GET /healthz", () => {
  const gw = useGateway();

  afterEach(() => {
    delete process.env.HEALTHZ_SECRET;
  });

  it("returns status, uptimeSeconds, skillsLoaded, and package.json version", async () => {
    process.env.HEALTHZ_SECRET = "do-not-leak";
    const port = await gw.start({ now: () => 5_000_000, startedAt: 2_000_000 });

    const healthzRes = await httpJson(port, "GET", "/healthz");
    const healthz = healthzRes.json as Record<string, unknown>;

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

    const health = await httpJson(port, "GET", "/health");
    expect(health.status).toBe(200);
    expect(health.json).toEqual({ ok: true, sessions: 0 });
  });
});
