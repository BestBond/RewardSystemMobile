import Svg, { Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function IconGiftOrange(props: SvgProps) {
  const { color, ...rest } = props;
  const o = color || '#EF8441';
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect x={3} y={10} width={18} height={11} rx={2} fill={o} />
      <Path
        d="M12 10V7a2 2 0 114 0v3M12 10V7a2 2 0 10-4 0v3"
        stroke={o}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path d="M3 10h18" stroke={o} strokeWidth={1.5} />
    </Svg>
  );
}
