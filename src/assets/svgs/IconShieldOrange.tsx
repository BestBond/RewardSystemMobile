import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/** Shield — Privacy Policy row on legal hub (Figma). */
export function IconShieldOrange(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 3l7 3v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-3z"
        stroke="#EF8441"
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
