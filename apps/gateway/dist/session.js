export const DEFAULT_SESSION_TTL_SECONDS = 3600;
export function readSessionTtlSeconds(raw = process.env.SESSION_TTL_SECONDS) {
    if (raw == null || raw.trim() === "")
        return DEFAULT_SESSION_TTL_SECONDS;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SESSION_TTL_SECONDS;
}
//# sourceMappingURL=session.js.map