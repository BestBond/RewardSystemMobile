import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function HeaderShoppingBag(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6 8h12l1 12H5L6 8z"
        stroke="#1A1C1E"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 8V6a3 3 0 116 0v2"
        stroke="#1A1C1E"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
