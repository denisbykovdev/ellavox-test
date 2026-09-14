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

describe("gateway inbound sanitization", () => {
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

  it("sanitizes inbound /message text with the shared helper", async () => {
    const server = createGateway({ now: () => 1_000_000 });
    servers.push(server);
    const port = await listen(server);

    const res = await fetch(`http://127.0.0.1:${port}/message`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel: "webchat",
        sender: "u1",
        text: "hello  \r\nworld\u2028"
      })
    });
    const json = (await res.json()) as { result: { text: string } };

    expect(res.status).toBe(200);
    expect(json.result.text).toContain("hello\nworld");
    expect(json.result.text).not.toContain("\r");
    expect(json.result.text).not.toContain("hello world");
  });
});
