import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach } from "vitest";
import { createGateway, type GatewayDeps } from "../src/gateway.js";

export async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  return (server.address() as AddressInfo).port;
}

export async function closeServers(servers: Server[]): Promise<void> {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
    )
  );
}

export async function httpJson(
  port: number,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: unknown }> {
  const raw = typeof body === "string";
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body)
  });
  const text = await res.text();
  try {
    return { status: res.status, json: text ? JSON.parse(text) : {} };
  } catch {
    return { status: res.status, json: text };
  }
}

export async function postMessage(
  port: number,
  body: unknown
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await httpJson(port, "POST", "/message", body);
  return { status: res.status, json: res.json as Record<string, unknown> };
}

export function useGateway() {
  const servers: Server[] = [];
  afterEach(async () => {
    await closeServers(servers);
  });
  return {
    async start(deps?: GatewayDeps): Promise<number> {
      const server = createGateway(deps);
      servers.push(server);
      return listen(server);
    }
  };
}
