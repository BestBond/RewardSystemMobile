/** Deterministic mock codes for admin coupon batch preview (no backend yet). */
export function buildPreviewCouponCodes(quantity: number): string[] {
  const n = Math.min(Math.max(Math.floor(quantity), 1), 2000);
  return Array.from({ length: n }, (_, i) => {
    const a = String(100 + (i % 900)).padStart(3, '0');
    const b = String(10 + (i % 89)).padStart(2, '0');
    return `BB-X${a}-${b}`;
  });
}

export function randomBatchDisplayNumber(): number {
  return 4000 + Math.floor(Math.random() * 6000);
}

export function randomExportBatchId(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `GN-${n}`;
}

export function formatBatchCreatedLabel(d: Date): string {
  const t = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `Today, ${t}`;
}
