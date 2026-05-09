import Svg, { G, Mask, Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function HomeInactive(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Mask
        id="home_inactive_m"
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={24}
        height={24}
        style={{ maskType: 'alpha' }}>
        <Rect width={24} height={24} fill="#D9D9D9" />
      </Mask>
      <G mask="url(#home_inactive_m)">
        <Path
          d="M6 19H9.34625V13.0578H14.6538V19H18V10L12 5.48075L6 10V19ZM4.5 20.5V9.25L12 3.60575L19.5 9.25V20.5H13.1538V14.5578H10.8463V20.5H4.5Z"
          fill="#A6AAB3"
        />
      </G>
    </Svg>
  );
}
