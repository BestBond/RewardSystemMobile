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
