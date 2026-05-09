import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function MapPin(props: SvgProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10z"
        stroke="#1A2B48"
        strokeWidth={1.5}
      />
      <Path
        d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
        fill="#1A2B48"
      />
    </Svg>
  );
}
