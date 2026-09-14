import { stableHash } from "@openclaw-eval/shared";
const PAIRING_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 15 * 1000;
export function isPairingCodeValid(req, nowMs) {
    const ageMs = nowMs - req.createdAt;
    return ageMs >= -CLOCK_SKEW_MS && ageMs <= PAIRING_TTL_MS + CLOCK_SKEW_MS;
}
export const pairingSkill = {
    name: "pairing",
    description: "Simulate approving a pairing code (demo).",
    async run(ctx) {
        const code = ctx.text.trim();
        const req = { code, createdAt: ctx.timestampMs - 60_000 };
        if (!isPairingCodeValid(req, ctx.timestampMs)) {
            return { text: `Pairing code expired: ${stableHash(code)}` };
        }
        return { text: `Paired ✅ (${stableHash(code)})` };
    }
};
//# sourceMappingURL=pairing.js.map