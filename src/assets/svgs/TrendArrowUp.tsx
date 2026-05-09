import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function TrendArrowUp(props: SvgProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 17l6-6 4 4 6-7"
        stroke="#EF8441"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 8h6v6"
        stroke="#EF8441"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
