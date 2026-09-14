/**
 * Phone helpers.
 */
export type E164 = `+${number}`;
/**
 * Normalize a US number to +1XXXXXXXXXX.
 * Accepts 10 digits, 11 digits with a leading 1, already-E.164, and junk punctuation.
 */
export declare function normalizePhone(input: string): E164;
//# sourceMappingURL=phone.d.ts.map