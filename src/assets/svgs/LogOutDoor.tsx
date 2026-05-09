import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function LogOutDoor(props: SvgProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M10 17H6a2 2 0 01-2-2V9a2 2 0 012-2h4"
        stroke="#1A1C1E"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M14 15l4-3-4-3"
        stroke="#1A1C1E"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M18 12H10" stroke="#1A1C1E" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
