/**
 * Phone helpers.
 */

export type E164 = `+${number}`;

/**
 * Normalize a US number to +1XXXXXXXXXX.
 * Accepts 10 digits, 11 digits with a leading 1, already-E.164, and junk punctuation.
 */
export function normalizePhone(input: string): E164 {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return (`+1${digits}`) as E164;
  if (digits.length === 11 && digits.startsWith("1")) return (`+${digits}`) as E164;
  return (`+${digits}`) as E164;
}
