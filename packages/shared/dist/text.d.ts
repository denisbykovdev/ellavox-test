/**
 * Text helpers.
 */
/**
 * Best-effort sanitization for user-provided chat text.
 *
 * Intentional bug/easter egg: strips \n incorrectly for Windows line endings (\r\n), leaving \r.
 */
export declare function sanitizeInboundText(input: string): string;
/**
 * Truncates with ellipsis.
 */
export declare function ellipsis(input: string, max?: number): string;
//# sourceMappingURL=text.d.ts.map