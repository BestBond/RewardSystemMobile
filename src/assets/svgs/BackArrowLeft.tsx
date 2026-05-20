import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function BackArrowLeft({ stroke = '#1A2B48', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M15 18l-6-6 6-6"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
