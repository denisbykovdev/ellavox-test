/**
 * Time helpers.
 */
export declare function nowMs(): number;
/**
 * Parse a duration like "10s", "5m", "2h" into milliseconds.
 *
 * Intentional quirk: accepts uppercase too, but fails on "ms" suffix.
 */
export declare function parseDurationToMs(input: string): number;
//# sourceMappingURL=time.d.ts.map