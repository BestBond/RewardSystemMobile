import {
  formatWalletExpiryMessage,
  formatWalletExpiryShort,
} from '../src/utils/walletExpiry';

describe('walletExpiry', () => {
  it('formats full expiry messages', () => {
    expect(formatWalletExpiryMessage(45)).toBe(
      'Points expire in 45 days. Unused balance resets to 0.',
    );
    expect(formatWalletExpiryMessage(1)).toBe(
      'Points expire in 1 day. Unused balance resets to 0.',
    );
    expect(formatWalletExpiryMessage(0)).toBe(
      'Points expire today. Unused balance resets to 0.',
    );
  });

  it('formats short expiry labels', () => {
    expect(formatWalletExpiryShort(12)).toBe('Expires in 12 days');
    expect(formatWalletExpiryShort(0)).toBe('Expires today');
  });
});
