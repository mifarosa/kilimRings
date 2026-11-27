/** Board geometry in a 400x400 viewBox centred on (0,0). */
export const OUTER = 180;
export const INNER = 52;
export const GAP = 4;

/** Inner edge of the innermost ring: 6-ring boards shrink the hub so rings stay easy to hit. */
export const innerFor = (k: number) => (k >= 6 ? 34 : INNER);

export function ringRadii(k: number): [number, number][] {
  const th = (OUTER - innerFor(k) - GAP * (k - 1)) / k;
  const out: [number, number][] = [];
  for (let i = 0; i < k; i++) {
    const r2 = OUTER - i * (th + GAP);
    out.push([r2 - th, r2]);
  }
  return out;
}

export const pt = (r: number, a: number): [number, number] => {
  const t = ((a - 90) * Math.PI) / 180;
  return [r * Math.cos(t), r * Math.sin(t)];
};

export function wedge(r1: number, r2: number, a0: number, a1: number): string {
  const p1 = pt(r2, a0), p2 = pt(r2, a1), p3 = pt(r1, a1), p4 = pt(r1, a0);
  const f = (v: number) => v.toFixed(2);
  return `M${f(p1[0])} ${f(p1[1])} A${r2} ${r2} 0 0 1 ${f(p2[0])} ${f(p2[1])} L${f(p3[0])} ${f(p3[1])} A${r1} ${r1} 0 0 0 ${f(p4[0])} ${f(p4[1])}Z`;
}

export function lum(hex: string): number {
  const v = parseInt(hex.slice(1), 16);
  const r = v >> 16, g = (v >> 8) & 255, b = v & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** One distinct motif per colour index so the game stays playable without telling colours apart. */
export const SHAPES: ((s: number) => string)[] = [
  (s) => `M0 ${-s}L${0.72 * s} 0L0 ${s}L${-0.72 * s} 0Z`, // diamond
  (s) => `M0 ${-s}L${0.9 * s} ${0.7 * s}L${-0.9 * s} ${0.7 * s}Z`, // triangle
  (s) => `M${-s * 0.8} 0a${s * 0.8} ${s * 0.8} 0 1 0 ${1.6 * s} 0a${s * 0.8} ${s * 0.8} 0 1 0 ${-1.6 * s} 0Z`, // circle
  (s) => `M${-0.7 * s} ${-0.7 * s}h${1.4 * s}v${1.4 * s}h${-1.4 * s}Z`, // square
  (s) => {
    const a = s * 0.3; // plus
    return `M${-a} ${-s}h${2 * a}v${s - a}h${s - a}v${2 * a}h${-(s - a)}v${s - a}h${-2 * a}v${-(s - a)}h${-(s - a)}v${-2 * a}h${s - a}Z`;
  },
  (s) => {
    let d = ''; // hexagon
    for (let q = 0; q < 6; q++) {
      const a = (q * Math.PI) / 3;
      d += `${q ? 'L' : 'M'}${(s * 0.9 * Math.cos(a)).toFixed(2)} ${(s * 0.9 * Math.sin(a)).toFixed(2)}`;
    }
    return d + 'Z';
  },
];
