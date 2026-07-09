/**
 * Normalize Indian (+91) national mobile input for auth fields.
 * - Strips non-digits
 * - Drops trunk leading 0 (09611299129 → 9611299129)
 * - Drops pasted 91 country prefix when present
 * - Caps at 10 digits for the input field
 */
export function normalizeIndiaNationalPhoneInput(raw: string): string {
  let digits = String(raw ?? '').replace(/\D/g, '');

  if (digits.startsWith('91') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

/** True when the value is a 10-digit Indian mobile (starts 6–9). */
export function isValidIndiaMobile(national: string): boolean {
  return /^[6-9]\d{9}$/.test(national);
}
