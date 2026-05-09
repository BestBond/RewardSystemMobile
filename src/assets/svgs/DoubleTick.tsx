import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

type DoubleTickProps = SvgProps & {
  color?: string;
};

export function DoubleTick({ color = '#A6AAB3', ...props }: DoubleTickProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6.69999 17.6538L1.39624 12.3501L2.46549 11.2963L6.71549 15.5463L7.06149 15.2001L8.11549 16.2538L6.69999 17.6538ZM12.35 17.6538L7.04624 12.3501L8.09999 11.2808L12.35 15.5308L21.55 6.33081L22.6037 7.40006L12.35 17.6538ZM12.0037 12.3501L10.9345 11.2963L15.8845 6.34631L16.9537 7.40006L12.0037 12.3501Z"
        fill={color}
      />
    </Svg>
  );
}
