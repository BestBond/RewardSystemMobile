import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function IconHeadsetOrange(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M5 16a3 3 0 013-3h1v6H8a3 3 0 01-3-3v-3zm14 0a3 3 0 01-3 3h-1v-6h1a3 3 0 013 3v3z"
        fill="#EF8441"
      />
      <Path
        d="M8 13V9a4 4 0 118 0v4"
        stroke="#EF8441"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
