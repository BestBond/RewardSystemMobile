/** Static copy aligned with `figmadesign/Account Management` (API supplies live data). */

export const MENU_SUBTITLES = {
  gift: 'Track your redeemed rewards',
  /** Dealer: no courier — collect at store after ops approves. */
  giftDealer: 'In-store pickup — track approval and collect your gift at the store',
  tx: 'View points earned and spent',
  help: 'Call, WhatsApp, or email us',
  legal: 'Terms, conditions and privacy details',
} as const;

export const SUPPORT = {
  hero: "We're here to help you.",
  callTag: 'AVAILABLE 24/7',
  callTitle: 'Call Support',
  callBody: 'Connect with a real human expert immediately',
  callCta: 'Call Now',
  waTag: 'QUICK RESPONSE',
  waTitle: 'WhatsApp Support',
  waBody: 'Send us a message on WhatsApp for an immediate response.',
  email: 'bestbond03@yahoo.com',
  /** Same line for call + WhatsApp (India); wa.me uses digits without + */
  fallbackPhone: '+919686191514',
  fallbackWhatsapp: '919686191514',
} as const;

/** Old shipped API defaults — replace so prod API does not override BestBond contacts. */
const LEGACY_API = {
  whatsappDigits: '15551234567',
  phoneDigits: '18005550199',
} as const;

/**
 * Merge GET /support with app defaults. Production may still return placeholder
 * numbers until the API is redeployed.
 */
export function resolveSupportFromApi(s: {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}) {
  const wa = s.whatsapp?.replace(/\D/g, '') ?? '';
  const phDigits = (s.phone ?? '').replace(/\D/g, '');

  const whatsapp =
    wa && wa !== LEGACY_API.whatsappDigits
      ? wa
      : SUPPORT.fallbackWhatsapp.replace(/\D/g, '');

  const phone =
    s.phone?.trim() && phDigits !== LEGACY_API.phoneDigits
      ? s.phone.trim()
      : SUPPORT.fallbackPhone;

  const email =
    s.email?.trim() && s.email.trim().length > 0 ? s.email.trim() : SUPPORT.email;

  return { phone, whatsapp, email };
}
