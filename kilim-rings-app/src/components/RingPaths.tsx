import React from 'react';
import { G, Path } from 'react-native-svg';
import { lum, pt, SHAPES, wedge } from '../engine/geometry';

interface Props {
  seq: number[];
  pal: string[];
  r1: number;
  r2: number;
  big?: boolean;
}

/** Wedges + motifs of one ring, drawn unrotated in board coordinates. */
export const RingPaths = React.memo(function RingPaths({ seq, pal, r1, r2, big }: Props) {
  const n = seq.length;
  const step = 360 / n;
  const mid = (r1 + r2) / 2;
  const out: React.ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    const a0 = j * step + 0.6;
    const a1 = (j + 1) * step - 0.6;
    const col = pal[seq[j]];
    const am = a0 + (a1 - a0) / 2;
    const m = pt(mid, am);
    const sz = (r2 - r1) * (big ? 0.34 : 0.26);
    const ink = lum(col) > 0.55 ? '#2a1f3d' : '#fff6df';
    out.push(
      <Path key={`w${j}`} d={wedge(r1, r2, a0, a1)} fill={col} stroke="#241a3d" strokeWidth={2} />,
      <G key={`m${j}`} transform={`translate(${m[0].toFixed(2)} ${m[1].toFixed(2)}) rotate(${am.toFixed(1)})`}>
        <Path d={SHAPES[seq[j] % SHAPES.length](sz)} fill={ink} />
      </G>,
    );
  }
  return <G>{out}</G>;
});
