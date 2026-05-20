import type { RedemptionListItem } from '../api/rewards';

export type StatusChipVariant = 'success' | 'danger' | 'muted';

/** Dealer redemptions are picked up in-store after ops approval — not shipped. */
export function redemptionIsDealerPickup(
  r: Pick<RedemptionListItem, 'channel' | 'deliveryLabel'>,
): boolean {
  if (r.channel === 'DEALER_STORE') return true;
  if (r.channel === 'CUSTOMER_APP') return false;
  return (r.deliveryLabel ?? '').toLowerCase().includes('in-store');
}

export function consumerRedemptionStatusPresentation(
  status: string,
  isDealerPickup: boolean,
): { label: string; chip: StatusChipVariant } {
  const s = status.toUpperCase();
  if (s === 'CANCELLED') {
    return { label: 'Cancelled', chip: 'danger' };
  }
  if (isDealerPickup) {
    if (s === 'PROCESSING') {
      return { label: 'Pending store approval', chip: 'muted' };
    }
    if (s === 'SHIPPED') {
      return { label: 'Approved — visit store', chip: 'success' };
    }
    if (s === 'DELIVERED') {
      return { label: 'Collected at store', chip: 'success' };
    }
  } else {
    if (s === 'PROCESSING') {
      return { label: 'Pending approval', chip: 'muted' };
    }
    if (s === 'SHIPPED') {
      return { label: 'Shipped', chip: 'success' };
    }
    if (s === 'DELIVERED') {
      return { label: 'Delivered', chip: 'success' };
    }
  }
  return {
    label: s
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' '),
    chip: 'muted',
  };
}

/** Card subtitle under reward title (Figma: Tracking ID #… · status/ETA). */
export function redemptionListSubline(
  r: Pick<RedemptionListItem, 'trackingId' | 'etaText' | 'channel' | 'deliveryLabel'>,
): string {
  const inStore = redemptionIsDealerPickup(r);
  if (inStore) {
    return `Ref #${r.trackingId} · ${r.etaText ?? 'Awaiting ops approval at the store.'}`;
  }
  const eta = r.etaText?.trim();
  return eta
    ? `Tracking ID #${r.trackingId} · ${eta}`
    : `Tracking ID #${r.trackingId} · ETA TBD`;
}

const PENDING_ADMIN_ETA =
  'Pending admin approval. You will be notified when your request is approved.';

/** ISO / short ETA strings → "April 15, 2026"; sentences pass through unchanged. */
export function formatRedemptionEtaDate(etaText: string | null): string | null {
  const eta = etaText?.trim();
  if (!eta) return null;
  if (/approval|business|pending|notified/i.test(eta)) return null;
  if (eta.length > 40) return null;
  const d = new Date(eta);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** EST. DELIVERY column on detail screen. */
export function redemptionEstDeliveryDisplay(
  status: string,
  etaText: string | null,
  isDealerPickup: boolean,
): string {
  const pres = consumerRedemptionStatusPresentation(status, isDealerPickup);
  if (isDealerPickup) return pres.label;
  const s = status.toUpperCase();
  const eta = etaText?.trim();
  const etaDate = formatRedemptionEtaDate(etaText);
  if (s === 'PROCESSING') return etaDate || eta || PENDING_ADMIN_ETA;
  if (s === 'SHIPPED') return etaDate || eta || '5-7 Business Days';
  if (s === 'DELIVERED') return 'Delivered';
  if (s === 'CANCELLED') return 'Cancelled';
  return etaDate || eta || 'TBD';
}

/** Second timeline step subtitle on detail screen. */
export function redemptionTimelineStep2Detail(
  status: string,
  etaText: string | null,
  isDealerPickup: boolean,
): string {
  if (isDealerPickup) {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return 'Completed';
    if (s === 'SHIPPED') return 'Approved — bring ID if asked';
    return (
      etaText?.trim() ||
      'Pending ops approval. Visit your nearest authorized Best Bond store once approved.'
    );
  }
  const s = status.toUpperCase();
  const etaDate = formatRedemptionEtaDate(etaText);
  if (s === 'DELIVERED') return 'Delivered';
  if (s === 'SHIPPED') return etaDate || etaText?.trim() || '5-7 Business Days';
  return etaDate || etaText?.trim() || PENDING_ADMIN_ETA;
}
