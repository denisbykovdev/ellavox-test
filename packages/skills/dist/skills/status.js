const LAST_N = 5;
const MAX_MESSAGE_CHARS = 80;
function truncate(text) {
    return text.length <= MAX_MESSAGE_CHARS ? text : text.slice(0, MAX_MESSAGE_CHARS);
}
export const statusSkill = {
    name: "status",
    description: "Summarize the current session.",
    async run(ctx) {
        const messages = ctx.session?.messages ?? [];
        const createdAt = ctx.session?.createdAt ?? ctx.timestampMs;
        const ageSeconds = Math.max(0, Math.floor((ctx.timestampMs - createdAt) / 1000));
        const last = messages.slice(-LAST_N).map((m) => truncate(m.text));
        return {
            text: [
                `messages: ${messages.length}`,
                `ageSeconds: ${ageSeconds}`,
                ...last.map((line) => `- ${line}`)
            ].join("\n"),
            tags: ["session"]
        };
    }
};
//# sourceMappingURL=status.js.map