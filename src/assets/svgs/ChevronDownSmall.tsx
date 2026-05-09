import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function ChevronDownSmall(props: SvgProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6 9l6 6 6-6"
        stroke="#1A1C1E"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
