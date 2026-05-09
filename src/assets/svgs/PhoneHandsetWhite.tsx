import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function PhoneHandsetWhite(props: SvgProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M8.5 3.5c.8-.2 1.6.1 2.1.8l1.5 2.1c.4.6.5 1.4.2 2.1l-.8 1.8a12 12 0 005.2 5.2l1.8-.8c.7-.3 1.5-.2 2.1.2l2.1 1.5c.7.5 1 1.3.8 2.1-.3 1.2-1.4 2.2-2.6 2.6-4.2 1.3-10.5-4.9-9.2-9.2.4-1.2 1.4-2.3 2.6-2.6z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
