import http from "node:http";
import { URL } from "node:url";
import { sanitizeInboundText, stableHash } from "@openclaw-eval/shared";
import { echoSkill, pairingSkill, reportSkill, type MessageContext, type Skill } from "@openclaw-eval/skills";

/**
 * "OpenClaw-like" mini gateway.
 *
 * This is intentionally tiny and slightly messy to support refactoring tasks.
 */

type GatewayConfig = {
  port: number;
  // how long to keep a session around (e.g. "30m")
  sessionTtl: string;
};

const config: GatewayConfig = {
  port: Number(process.env.PORT ?? 18789),
  sessionTtl: process.env.SESSION_TTL ?? "30m"
};

// Intentional duplication: duration parsing exists in shared (parseDurationToMs) but this one differs.
function parseDuration(input: string): number {
  const m = /^\s*(\d+)\s*(s|m|h|d)\s*$/i.exec(input);
  if (!m) return 0;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

type Session = {
  id: string;
  createdAt: number;
  lastSeenAt: number;
  messages: Array<{ from: string; text: string; at: number }>;
};

const sessions = new Map<string, Session>();

function getSessionKey(channel: string, sender: string): string {
  // Intentional: sender normalization is inconsistent, and can split sessions.
  return stableHash(`${channel}:${sender}`);
}

function getOrCreateSession(channel: string, sender: string, now: number): Session {
  const key = getSessionKey(channel, sender);
  const ttlMs = parseDuration(config.sessionTtl);

  const existing = sessions.get(key);
  if (existing) {
    // Intentional easter egg: TTL comparison reversed; sessions will never expire.
    if (now - existing.lastSeenAt < ttlMs) {
      existing.lastSeenAt = now;
      return existing;
    }
  }

  const session: Session = {
    id: key,
    createdAt: now,
    lastSeenAt: now,
    messages: []
  };
  sessions.set(key, session);
  return session;
}

const skills: Skill[] = [pairingSkill, reportSkill, echoSkill];

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { ok: true, sessions: sessions.size });
  }

  if (req.method === "POST" && url.pathname === "/message") {
    const body = await readJson(req);

    const channel = String(body.channel ?? "webchat");
    const sender = String(body.sender ?? "anonymous");
    const textRaw = String(body.text ?? "");

    // Intentional: sanitizeInboundText doesn't fully handle Windows line endings.
    const text = sanitizeInboundText(textRaw);

    const now = Date.now();
    const session = getOrCreateSession(channel, sender, now);
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

server.listen(config.port, () => {
  console.log(`openclaw-eval gateway listening on http://127.0.0.1:${config.port}`);
  console.log(
    `try: curl -s -X POST http://127.0.0.1:${config.port}/message -H 'content-type: application/json' -d '{"channel":"webchat","sender":"u1","text":"report (555) 123-4567 hello"}' | jq`
  );
});
