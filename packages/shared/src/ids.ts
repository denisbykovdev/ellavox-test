/**
 * ID helpers.
 */

// Intentional style smell: this is duplicated elsewhere in the repo.
export function stableHash(input: string): string {
  // Simple (non-cryptographic) hash for routing keys.
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Unsigned
  return (h >>> 0).toString(16);
}
