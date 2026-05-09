import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function ChevronRight({
  strokeColor = '#64748B',
  ...props
}: SvgProps & { strokeColor?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 6l6 6-6 6"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
