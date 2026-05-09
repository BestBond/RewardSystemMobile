import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/** Small ticket icon for transaction rows (orange on light circle) */
export function TxTicketOrange(props: SvgProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 8.5a1.5 1.5 0 011.5-1.5H9a2 2 0 004 0h3.5A1.5 1.5 0 0118 8.5v2a2 2 0 010 3v2A1.5 1.5 0 0116.5 17H13a2 2 0 00-4 0H5.5A1.5 1.5 0 014 15.5v-2a2 2 0 010-3v-2z"
        fill="#EF8441"
      />
      <Path
        d="M9 10.5h6M9 13.5h4"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.95}
      />
    </Svg>
  );
}
