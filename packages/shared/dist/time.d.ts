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
/**
 * True when `atMs` is at least `ttlSeconds` old relative to `nowMs`.
 * Compare in milliseconds only; no real clock.
 */
export declare function isTtlExpired(atMs: number, nowMs: number, ttlSeconds: number): boolean;
//# sourceMappingURL=time.d.ts.map