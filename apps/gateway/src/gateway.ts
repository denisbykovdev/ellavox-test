import http from "node:http";
import { URL } from "node:url";
import { isTtlExpired, sanitizeInboundText, stableHash } from "@openclaw-eval/shared";
import {
  echoSkill,
  pairingSkill,
  reportSkill,
  type MessageContext,
  type Skill
} from "@openclaw-eval/skills";
import { readSessionTtlSeconds } from "./session.js";

type Session = {
  id: string;
  createdAt: number;
  lastSeenAt: number;
  messages: Array<{ from: string; text: string; at: number }>;
};

export type GatewayDeps = {
  now?: () => number;
  ttlSeconds?: number;
};

function getSessionKey(channel: string, sender: string): string {
  return stableHash(`${channel}:${sender}`);
}

function pickSkill(text: string): Skill {
  const t = text.trim().toLowerCase();
  if (t.startsWith("pair")) return pairingSkill;
  if (t.startsWith("report")) return reportSkill;
  return echoSkill;
}

function readJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body, null, 2));
}

export function createGateway(deps: GatewayDeps = {}): http.Server {
  const nowFn = deps.now ?? Date.now;
  const ttlSeconds = deps.ttlSeconds ?? readSessionTtlSeconds();
  const sessions = new Map<string, Session>();

  function resolveSession(
    channel: string,
    sender: string,
    now: number
  ): { ok: true; session: Session } | { ok: false } {
    const key = getSessionKey(channel, sender);
    const existing = sessions.get(key);

    if (!existing) {
      const session: Session = {
        id: key,
        createdAt: now,
        lastSeenAt: now,
        messages: []
      };
      sessions.set(key, session);
      return { ok: true, session };
    }

    if (isTtlExpired(existing.lastSeenAt, now, ttlSeconds)) {
      sessions.delete(key);
      return { ok: false };
    }

    existing.lastSeenAt = now;
    return { ok: true, session: existing };
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, { ok: true, sessions: sessions.size });
    }

    if (req.method === "POST" && url.pathname === "/message") {
      const body = await readJson(req);

      const channel = String(body.channel ?? "webchat");
      const sender = String(body.sender ?? "anonymous");
      const textRaw = String(body.text ?? "");
      const text = sanitizeInboundText(textRaw);

      const now = nowFn();
      const resolved = resolveSession(channel, sender, now);
      if (!resolved.ok) {
        return send(res, 401, { error: "session_expired" });
      }

      const session = resolved.session;
      session.messages.push({ from: sender, text, at: now });

      const skill = pickSkill(text);

      const ctx: MessageContext = {
        channel: channel as any,
        sender,
        text,
        timestampMs: now
      };

      const result = await skill.run(ctx);

      return send(res, 200, {
        sessionId: session.id,
        skill: skill.name,
        result
      });
    }

    return send(res, 404, { error: "not_found" });
  });
}
