import Svg, { Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function LockClosed(props: SvgProps) {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={7}
        y={11}
        width={10}
        height={9}
        rx={2}
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={1}
      />
      <Path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
