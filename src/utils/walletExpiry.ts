export function formatWalletExpiryMessage(
  expireInDays: number | null | undefined,
): string | null {
  if (expireInDays == null || expireInDays < 0) return null;
  if (expireInDays === 0) {
    return 'Points expire today. Unused balance resets to 0.';
  }
  if (expireInDays === 1) {
    return 'Points expire in 1 day. Unused balance resets to 0.';
  }
  return `Points expire in ${expireInDays} days. Unused balance resets to 0.`;
}

export function formatWalletExpiryShort(
  expireInDays: number | null | undefined,
): string | null {
  if (expireInDays == null || expireInDays < 0) return null;
  if (expireInDays === 0) return 'Expires today';
  if (expireInDays === 1) return 'Expires in 1 day';
  return `Expires in ${expireInDays} days`;
}
