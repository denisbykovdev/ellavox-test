/**
 * Normalize inbound chat text: CRLF to LF, Unicode line separators to LF,
 * trailing whitespace stripped per line. Newlines are preserved.
 */
export declare function sanitizeInboundText(input: string): string;
/**
 * Truncates with ellipsis.
 */
export declare function ellipsis(input: string, max?: number): string;
//# sourceMappingURL=text.d.ts.map