import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function ChatBubbleWhite(props: SvgProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
