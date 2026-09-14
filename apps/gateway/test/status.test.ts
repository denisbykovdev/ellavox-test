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
): Promise<{ status: number; json: { skill?: string; result?: { text: string } } }> {
  const res = await fetch(`http://127.0.0.1:${port}/message`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: res.status, json: (await res.json()) as { skill?: string; result?: { text: string } } };
}

describe("gateway status routing", () => {
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

  it("routes STATUS to statusSkill with session data on MessageContext", async () => {
    let now = 1_000_000;
    const server = createGateway({ now: () => now });
    servers.push(server);
    const port = await listen(server);

    await postMessage(port, { channel: "webchat", sender: "u1", text: "echo one" });
    now = 1_005_000;
    const res = await postMessage(port, { channel: "webchat", sender: "u1", text: "STATUS" });

    expect(res.status).toBe(200);
    expect(res.json.skill).toBe("status");
    expect(res.json.result?.text).toContain("messages: 2");
    expect(res.json.result?.text).toContain("ageSeconds: 5");
    expect(res.json.result?.text).toContain("echo one");
  });
});
