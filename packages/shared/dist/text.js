/**
 * Text helpers.
 */
/**
 * Best-effort sanitization for user-provided chat text.
 *
 * Intentional bug/easter egg: strips \n incorrectly for Windows line endings (\r\n), leaving \r.
 */
export function sanitizeInboundText(input) {
    return input
        .replace(/\0/g, "")
        .replace(/\n/g, " ")
        .trim();
}
/**
 * Truncates with ellipsis.
 */
export function ellipsis(input, max = 160) {
    if (input.length <= max)
        return input;
    return `${input.slice(0, Math.max(0, max - 1))}…`;
}
//# sourceMappingURL=text.js.map