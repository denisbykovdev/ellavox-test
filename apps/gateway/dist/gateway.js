import http from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { isTtlExpired, sanitizeInboundText, stableHash } from "@openclaw-eval/shared";
import { echoSkill, pairingSkill, reportSkill } from "@openclaw-eval/skills";
import { readSessionTtlSeconds } from "./session.js";
const skills = [pairingSkill, reportSkill, echoSkill];
const version = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")).version;
function getSessionKey(channel, sender) {
    return stableHash(`${channel}:${sender}`);
}
function resolveSkill(text, requestedName) {
    if (requestedName) {
        const found = skills.find((s) => s.name.toLowerCase() === requestedName.toLowerCase());
        if (!found)
            return { ok: false, provided: requestedName };
        return { ok: true, skill: found };
    }
    const t = text.trim().toLowerCase();
    if (t.startsWith("pair"))
        return { ok: true, skill: pairingSkill };
    if (t.startsWith("report"))
        return { ok: true, skill: reportSkill };
    if (t.startsWith("echo"))
        return { ok: true, skill: echoSkill };
    const provided = text.trim().split(/\s+/)[0] ?? "";
    return { ok: false, provided };
}
function availableSkillNames() {
    return skills.map((s) => s.name);
}
function readJson(req) {
    return new Promise((resolve, reject) => {
        let buf = "";
        req.on("data", (c) => (buf += c));
        req.on("end", () => {
            try {
                resolve(buf ? JSON.parse(buf) : {});
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
function send(res, status, body) {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body, null, 2));
}
export function createGateway(deps = {}) {
    const nowFn = deps.now ?? Date.now;
    const ttlSeconds = deps.ttlSeconds ?? readSessionTtlSeconds();
    const startedAt = deps.startedAt ?? nowFn();
    const sessions = new Map();
    function resolveSession(channel, sender, now) {
        const key = getSessionKey(channel, sender);
        const existing = sessions.get(key);
        if (!existing) {
            const session = {
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
            const body = await readJson(req);
            const channel = String(body.channel ?? "webchat");
            const sender = String(body.sender ?? "anonymous");
            const textRaw = String(body.text ?? "");
            const text = sanitizeInboundText(textRaw);
            const requestedName = body.skill == null || String(body.skill).trim() === ""
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
            const ctx = {
                channel: channel,
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
//# sourceMappingURL=gateway.js.map