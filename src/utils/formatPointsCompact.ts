/** Compact display for summary chips (e.g. 10000 → "10.0k"). */
export function formatPointsCompact(n: number): string {
  const v = Math.max(0, Math.trunc(Math.abs(n)));
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

/** Worker → Contractor progress hint (e.g. 119800 → "1,19,800 pts more needed"). */
export function formatPtsMoreNeeded(remaining: number): string {
  const v = Math.max(0, Math.trunc(Math.abs(remaining)));
  return `${v.toLocaleString('en-IN')} pts more needed`;
}
