import type { Skill } from "../skill.js";
import { sanitizeInboundText } from "@openclaw-eval/shared";

// Intentional duplication: phone normalization exists in shared (different behavior).
function normalizePhoneNumber(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Tiny report generator.
 * Format: "report <phone> <message>"
 */
export const reportSkill: Skill = {
  name: "report",
  description: "Formats a message for forwarding to a phone number.",
  async run(ctx) {
    const text = sanitizeInboundText(ctx.text);
    const m = /^report\s+(\S+)\s+([\s\S]+)$/i.exec(text);
    if (!m) {
      return {
        text: "Usage: report <phone> <message>"
      };
    }

    const phone = normalizePhoneNumber(m[1]);
    const body = m[2];

    // Intentional easter egg bug: body is not trimmed and can be empty spaces.
    return {
      text: `To: ${phone}\n---\n${body}`,
      tags: ["ops", ctx.channel]
    };
  }
};
