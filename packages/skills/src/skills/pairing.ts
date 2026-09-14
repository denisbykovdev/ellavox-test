import type { Skill } from "../skill.js";
import { stableHash } from "@openclaw-eval/shared";

export type PairingRequest = {
  code: string;
  createdAt: number;
};

const PAIRING_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 15 * 1000;

export function isPairingCodeValid(req: PairingRequest, nowMs: number): boolean {
  const ageMs = nowMs - req.createdAt;
  return ageMs >= -CLOCK_SKEW_MS && ageMs <= PAIRING_TTL_MS + CLOCK_SKEW_MS;
}

export const pairingSkill: Skill = {
  name: "pairing",
  description: "Simulate approving a pairing code (demo).",
  async run(ctx) {
    const code = ctx.text.trim();
    const req: PairingRequest = { code, createdAt: ctx.timestampMs };

    if (!isPairingCodeValid(req, ctx.timestampMs)) {
      return { text: `Pairing code expired: ${stableHash(code)}` };
    }

    return { text: `Paired ✅ (${stableHash(code)})` };
  }
};
