import Svg, { G, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/**
 * Sparse confetti burst: small tilted rectangles (Figma “Reward Success” style).
 * Pink, purple, blue, yellow only — arranged in a loose ring so a centered checkmark fits in the clear middle.
 */
const VB_W = 280;
const VB_H = 150;

type Piece = { x: number; y: number; w: number; h: number; rot: number; fill: string };

const PIECES: Piece[] = [
  { x: 38, y: 22, w: 11, h: 6, rot: -18, fill: '#3B82F6' },
  { x: 58, y: 12, w: 9, h: 5, rot: 24, fill: '#EC4899' },
  { x: 88, y: 8, w: 8, h: 8, rot: 12, fill: '#EAB308' },
  { x: 118, y: 4, w: 10, h: 5, rot: -8, fill: '#A855F7' },
  { x: 152, y: 6, w: 7, h: 7, rot: 32, fill: '#3B82F6' },
  { x: 182, y: 14, w: 9, h: 5, rot: -22, fill: '#EC4899' },
  { x: 208, y: 28, w: 8, h: 6, rot: 16, fill: '#EAB308' },
  { x: 232, y: 48, w: 10, h: 5, rot: -12, fill: '#A855F7' },
  { x: 246, y: 72, w: 7, h: 7, rot: 28, fill: '#3B82F6' },
  { x: 252, y: 102, w: 9, h: 5, rot: -6, fill: '#EC4899' },
  { x: 28, y: 48, w: 8, h: 6, rot: 20, fill: '#A855F7' },
  { x: 18, y: 78, w: 10, h: 5, rot: -14, fill: '#EAB308' },
  { x: 22, y: 108, w: 7, h: 7, rot: 8, fill: '#3B82F6' },
  { x: 48, y: 128, w: 9, h: 5, rot: -28, fill: '#EC4899' },
  { x: 88, y: 136, w: 8, h: 6, rot: 18, fill: '#A855F7' },
  { x: 132, y: 138, w: 10, h: 5, rot: -4, fill: '#EAB308' },
  { x: 176, y: 130, w: 7, h: 7, rot: 22, fill: '#3B82F6' },
  { x: 214, y: 118, w: 9, h: 5, rot: -20, fill: '#EC4899' },
  { x: 72, y: 38, w: 6, h: 6, rot: 40, fill: '#EAB308' },
  { x: 200, y: 44, w: 6, h: 6, rot: -35, fill: '#A855F7' },
  { x: 118, y: 24, w: 5, h: 9, rot: 55, fill: '#3B82F6' },
  { x: 156, y: 32, w: 6, h: 8, rot: -48, fill: '#EC4899' },
];

export function CelebrationBackground({
  width = VB_W,
  height = VB_H,
  ...props
}: SvgProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      {...props}>
      <G>
        {PIECES.map((p, i) => (
          <G
            key={i}
            transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
            <Rect
              x={-p.w / 2}
              y={-p.h / 2}
              width={p.w}
              height={p.h}
              rx={1.5}
              ry={1.5}
              fill={p.fill}
            />
          </G>
        ))}
      </G>
    </Svg>
  );
}
