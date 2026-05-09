import Svg, { G, Mask, Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function HomeActive(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Mask
        id="home_active_m"
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={24}
        height={24}
        style={{ maskType: 'alpha' }}>
        <Rect width={24} height={24} fill="#D9D9D9" />
      </Mask>
      <G mask="url(#home_active_m)">
        <Path
          d="M3.3999 21.65V8.72499L11.9999 2.29999L20.5999 8.72499V21.65H14.2499V14H9.7499V21.65H3.3999Z"
          fill="#1F2937"
        />
      </G>
    </Svg>
  );
}
