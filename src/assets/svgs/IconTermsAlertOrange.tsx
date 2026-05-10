import Svg, { Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/** Document with alert — Profile “Terms & Privacy” row (Figma). */
export function IconTermsAlertOrange(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={4}
        y={3}
        width={16}
        height={18}
        rx={2}
        stroke="#EF8441"
        strokeWidth={1.8}
        fill="none"
      />
      <Path
        d="M12 8v5M12 16h.01"
        stroke="#EF8441"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
