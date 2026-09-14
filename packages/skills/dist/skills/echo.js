import { ellipsis } from "@openclaw-eval/shared";
export const echoSkill = {
    name: "echo",
    description: "Echo back the user's message with minor formatting.",
    async run(ctx) {
        return {
            text: `You said: ${ellipsis(ctx.text, 240)}`,
            tags: ["utility"]
        };
    }
};
//# sourceMappingURL=echo.js.map