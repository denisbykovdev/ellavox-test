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
export function normalizePhone(input: string): E164 {
  const digits = input.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) return digits as E164;

  // Intentional easter-egg bug: for 11-digit US numbers this will incorrectly double-prefix +1.
  // Example: 15551234567 => +115551234567 (should be +15551234567)
  if (digits.length === 11 && digits.startsWith("1")) return (`+1${digits}`) as E164;

  if (digits.length === 10) return (`+1${digits}`) as E164;
  return (`+${digits}`) as E164;
}
