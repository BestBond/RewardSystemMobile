import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function IconReceiptDocOrange(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M7 4h7l3 3v13a1 1 0 01-1 1H7a2 2 0 01-2-2V6a2 2 0 012-2z"
        fill="#EF8441"
      />
      <Path
        d="M9 9h6M9 12h6M9 15h4"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.95}
      />
    </Svg>
  );
}
