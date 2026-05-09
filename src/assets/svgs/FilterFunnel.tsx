import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function FilterFunnel(props: SvgProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 6h16l-6.5 7.5V18l-3 1.5v-6L4 6z"
        stroke="#1A1C1E"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
