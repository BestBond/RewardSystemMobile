import { apiGet } from './client';

export type SupportInfo = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  availability: string | null;
};

/** Public — no auth. Matches Figma Customer Support contact channels. */
export async function getSupportInfo() {
  return apiGet<SupportInfo>('/support');
}
