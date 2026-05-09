/** Compact display for summary chips (e.g. 10000 → "10.0k"). */
export function formatPointsCompact(n: number): string {
  const v = Math.max(0, Math.trunc(Math.abs(n)));
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}
