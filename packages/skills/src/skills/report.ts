import { normalizePhone, sanitizeInboundText } from "@openclaw-eval/shared";
import type { Skill } from "../skill.js";

const REPORT_RE =
  /^report\s+((?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})\s+([\s\S]+)$/i;

/**
 * Tiny report generator.
 * Format: "report <phone> <message>"
 */
export const reportSkill: Skill = {
  name: "report",
  description: "Formats a message for forwarding to a phone number.",
  async run(ctx) {
    const text = sanitizeInboundText(ctx.text);
    const m = REPORT_RE.exec(text);
    if (!m) {
      return {
        text: "Usage: report <phone> <message>"
      };
    }

    const phone = normalizePhone(m[1]);
    const body = m[2];

    return {
      text: `To: ${phone}\n---\n${body}`,
      tags: ["ops", ctx.channel]
    };
  }
};
