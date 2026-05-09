/** Filter chips aligned with Figma “Rewards & Redemption”. */

export type PointFilterId = 'all' | '1k' | '2k';

export const POINT_FILTERS: { id: PointFilterId; label: string }[] = [
  { id: 'all', label: 'All Rewards' },
  { id: '1k', label: '1,000 Pts' },
  { id: '2k', label: '2,000 Pts' },
];
