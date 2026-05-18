import React from 'react';
import Svg, { G, Mask, Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function Flashlight({ fill = '#F9FAFB', ...props }: SvgProps) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" {...props}>
      <Mask
        id="mask0_1_4966"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={28}
        height={28}>
        <Rect width={28} height={28} fill="#D9D9D9" />
      </Mask>
      <G mask="url(#mask0_1_4966)">
        <Path
          d="M9.91665 25.0834V12.654L7.58331 9.15404V2.91675H20.4166V9.15404L18.0833 12.654V25.0834H9.91665ZM12.9681 17.3653C12.6838 17.0812 12.5416 16.7373 12.5416 16.3334C12.5416 15.9296 12.6838 15.5856 12.9681 15.3015C13.2521 15.0172 13.5961 14.8751 14 14.8751C14.4038 14.8751 14.7478 15.0172 15.0319 15.3015C15.3162 15.5856 15.4583 15.9296 15.4583 16.3334C15.4583 16.7373 15.3162 17.0812 15.0319 17.3653C14.7478 17.6496 14.4038 17.7917 14 17.7917C13.5961 17.7917 13.2521 17.6496 12.9681 17.3653ZM9.33331 6.12508H18.6666V4.66675H9.33331V6.12508ZM18.6666 7.87508H9.33331V8.63341L11.6666 12.1334V23.3334H16.3333V12.1334L18.6666 8.63341V7.87508Z"
          fill={fill}
        />
      </G>
    </Svg>
  );
}
