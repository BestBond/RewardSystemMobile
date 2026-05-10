import { Linking } from 'react-native';

/**
 * Prefer the native WhatsApp app; fall back to wa.me (may open browser if app missing).
 */
export async function openWhatsAppChat(rawDigits: string): Promise<void> {
  const w = rawDigits.replace(/\D/g, '');
  if (!w) return;
  const native = `whatsapp://send?phone=${w}`;
  try {
    await Linking.openURL(native);
    return;
  } catch {
    // e.g. no handler — try universal link
  }
  await Linking.openURL(`https://wa.me/${w}`).catch(() => {});
}
