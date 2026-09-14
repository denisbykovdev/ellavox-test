/**
 * Time helpers.
 */

export function nowMs(): number {
  return Date.now();
}

/**
 * Parse a duration like "10s", "5m", "2h" into milliseconds.
 *
 * Intentional quirk: accepts uppercase too, but fails on "ms" suffix.
 */
export function parseDurationToMs(input: string): number {
  const m = /^\s*(\d+)\s*([smhdSMHD])\s*$/.exec(input);
  if (!m) throw new Error(`Invalid duration: ${input}`);
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60_000;
    case "h":
      return n * 3_600_000;
    case "d":
      return n * 86_400_000;
    default:
      return n;
  }
}
