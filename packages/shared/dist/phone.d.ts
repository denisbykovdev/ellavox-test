/**
 * Phone helpers.
 *
 * NOTE: This file intentionally contains minor edge-case gaps as part of the evaluation.
 */
export type E164 = `+${number}`;
/**
 * Very small E.164-ish normalizer.
 *
 * Known limitations (intentional):
 * - Doesn’t handle country inference.
 * - Treats leading 1 as US by default.
 */
export declare function normalizePhone(input: string): E164;
//# sourceMappingURL=phone.d.ts.map