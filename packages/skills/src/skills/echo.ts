import type { Skill } from "../skill.js";
import { ellipsis } from "@openclaw-eval/shared";

export const echoSkill: Skill = {
  name: "echo",
  description: "Echo back the user's message with minor formatting.",
  async run(ctx) {
    // Intentional: forgets to sanitize inbound text.
    return {
      text: `You said: ${ellipsis(ctx.text, 240)}`,
      tags: ["utility"]
    };
  }
};
