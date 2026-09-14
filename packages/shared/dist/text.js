/**
 * Normalize inbound chat text: CRLF to LF, Unicode line separators to LF,
 * trailing whitespace stripped per line. Newlines are preserved.
 */
export function sanitizeInboundText(input) {
    return input
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\u2028/g, "\n")
        .replace(/\u2029/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");
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