import http from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { isTtlExpired, sanitizeInboundText, stableHash } from "@openclaw-eval/shared";
import {
  echoSkill,
  pairingSkill,
  reportSkill,
  statusSkill,
  type Channel,
  type MessageContext,
  type Skill
} from "@openclaw-eval/skills";
import { readSessionTtlSeconds } from "./session.js";

const skills: Skill[] = [pairingSkill, reportSkill, echoSkill, statusSkill];
const CHANNELS: readonly Channel[] = ["telegram", "whatsapp", "slack", "webchat"];

const version = readGatewayVersion();

type JsonObject = Record<string, unknown>;

function readGatewayVersion(): string {
  const parsed: unknown = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")
  );
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    typeof parsed.version === "string"
  ) {
    return parsed.version;
  }
  throw new Error("gateway package.json is missing a string version");
}

function parseChannel(value: unknown): Channel {
  return CHANNELS.find((c) => c === value) ?? "webchat";
}

function asJsonObject(value: unknown): JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

type Session = {
  id: string;
  createdAt: number;
  lastSeenAt: number;
  messages: Array<{ from: string; text: string; at: number }>;
};

export type GatewayDeps = {
  now?: () => number;
  ttlSeconds?: number;
  startedAt?: number;
};

function getSessionKey(channel: string, sender: string): string {
  return stableHash(`${channel}:${sender}`);
}

function firstToken(text: string): string {
  return text.trim().split(/\s+/)[0] ?? "";
}

function resolveSkill(
  text: string,
  requestedName: string | undefined
): { ok: true; skill: Skill } | { ok: false; provided: string } {
  if (requestedName) {
    const found = skills.find((s) => s.name.toLowerCase() === requestedName.toLowerCase());
    if (!found) return { ok: false, provided: requestedName };
    return { ok: true, skill: found };
  }

  const token = firstToken(text);
  switch (token.toLowerCase()) {
    case "pair":
    case "pairing":
      return { ok: true, skill: pairingSkill };
    case "report":
      return { ok: true, skill: reportSkill };
    case "status":
      return { ok: true, skill: statusSkill };
    case "echo":
      return { ok: true, skill: echoSkill };
    default:
      return { ok: false, provided: token };
  }
}

function availableSkillNames(): string[] {
  return skills.map((s) => s.name);
}

function readJson(req: http.IncomingMessage): Promise<JsonObject> {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try {
        resolve(buf ? asJsonObject(JSON.parse(buf) as unknown) : {});
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
  const startedAt = deps.startedAt ?? nowFn();
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

    if (req.method === "GET" && url.pathname === "/healthz") {
      const uptimeSeconds = Math.max(0, Math.floor((nowFn() - startedAt) / 1000));
      return send(res, 200, {
        status: "ok",
        uptimeSeconds,
        skillsLoaded: skills.length,
        version
      });
    }

    if (req.method === "POST" && url.pathname === "/message") {
      let body: JsonObject;
      try {
        body = await readJson(req);
      } catch {
        return send(res, 400, { error: "invalid_json" });
      }

      const channel = parseChannel(body.channel);
      const sender = String(body.sender ?? "anonymous");
      const textRaw = String(body.text ?? "");
      const text = sanitizeInboundText(textRaw);
      const requestedName =
        body.skill == null || String(body.skill).trim() === ""
          ? undefined
          : String(body.skill).trim();

      const picked = resolveSkill(text, requestedName);
      if (!picked.ok) {
        return send(res, 400, {
          error: "unknown_skill",
          errorCode: "UNKNOWN_SKILL",
          skill: picked.provided,
          availableSkills: availableSkillNames()
        });
      }

      const now = nowFn();
      const resolved = resolveSession(channel, sender, now);
      if (!resolved.ok) {
        return send(res, 401, { error: "session_expired" });
      }

      const session = resolved.session;
      session.messages.push({ from: sender, text, at: now });

      const skill = picked.skill;

      const ctx: MessageContext = {
        channel,
        sender,
        text,
        timestampMs: now,
        session: {
          createdAt: session.createdAt,
          messages: session.messages
        }
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
