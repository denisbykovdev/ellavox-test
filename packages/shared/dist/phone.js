/**
 * Phone helpers.
 */
/**
 * Normalize a US number to +1XXXXXXXXXX.
 * Accepts 10 digits, 11 digits with a leading 1, already-E.164, and junk punctuation.
 */
export function normalizePhone(input) {
    const digits = input.replace(/\D/g, "");
    if (digits.length === 10)
        return (`+1${digits}`);
    if (digits.length === 11 && digits.startsWith("1"))
        return (`+${digits}`);
    return (`+${digits}`);
}
//# sourceMappingURL=phone.js.map