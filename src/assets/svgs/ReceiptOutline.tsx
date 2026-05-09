import Svg, { Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function ReceiptOutline(props: SvgProps) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={6}
        y={4}
        width={12}
        height={16}
        rx={2}
        stroke="#C4C4C4"
        strokeWidth={1.5}
      />
      <Path
        d="M9 9h6M9 12h6M9 15h4"
        stroke="#C4C4C4"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
