import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function ArrowRightOrange(props: SvgProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M5 12h12M13 6l6 6-6 6"
        stroke="#E87033"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
