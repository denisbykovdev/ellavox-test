/**
 * Time helpers.
 */
/**
 * Parse a duration like "10s", "5m", "2h" into milliseconds.
 * Units are s/m/h/d (case-insensitive). The "ms" suffix is not supported.
 */
export declare function parseDurationToMs(input: string): number;
/**
 * True when `atMs` is at least `ttlSeconds` old relative to `nowMs`.
 * Compare in milliseconds only; no real clock.
 */
export declare function isTtlExpired(atMs: number, nowMs: number, ttlSeconds: number): boolean;
//# sourceMappingURL=time.d.ts.map