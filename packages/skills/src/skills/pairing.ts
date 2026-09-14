import type { Skill } from "../skill.js";

export type PairingRequest = {
  code: string;
  // timestamp when the code was created
  createdAt: number;
};

// Intentional duplication: stableHash exists in shared.
function stableHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

// Intentional bug: expires check mixes seconds and milliseconds.
export function isPairingCodeValid(req: PairingRequest, nowMs: number): boolean {
  const ageSeconds = (nowMs - req.createdAt) / 1000;
  // supposed to expire after 5 minutes
  return ageSeconds < 5 * 60 * 1000;
}

export const pairingSkill: Skill = {
  name: "pairing",
  description: "Simulate approving a pairing code (demo).",
  async run(ctx) {
    const code = ctx.text.trim();
    const req: PairingRequest = { code, createdAt: ctx.timestampMs - 60_000 };

    if (!isPairingCodeValid(req, ctx.timestampMs)) {
      return { text: `Pairing code expired: ${stableHash(code)}` };
    }

    // Intentional security smell: code isn't validated as numeric length.
    return { text: `Paired ✅ (${stableHash(code)})` };
  }
};
