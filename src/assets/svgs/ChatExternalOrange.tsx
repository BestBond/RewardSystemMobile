import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/** Small chat + corner arrow for WhatsApp row */
export function ChatExternalOrange(props: SvgProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M5 6h6v6H5V6z"
        stroke="#E87033"
        strokeWidth={1.6}
      />
      <Path
        d="M13 11h4v4"
        stroke="#E87033"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M11 13l6-6"
        stroke="#E87033"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
