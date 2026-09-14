/**
 * Normalize inbound chat text: CRLF to LF, Unicode line separators to LF,
 * trailing whitespace stripped per line. Newlines are preserved.
 */
export function sanitizeInboundText(input: string): string {
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
export function ellipsis(input: string, max = 160): string {
  if (input.length <= max) return input;
  const keep = Math.max(0, max - "…".length);
  return `${input.slice(0, keep)}…`;
}