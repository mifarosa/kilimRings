/**
 * Pure game logic (no React / no platform APIs).
 * Ported 1:1 from the PWA so level data, pars and hints are identical.
 */

export type Style = 'kilim' | 'cini' | 'ramp' | 'mosaic';

export interface Pano {
  name: string;
  chapter: number; // 0 Kilim, 1 Cini, 2 Ebru, 3 Mozaik
  style: Style;
  rings: number;
  n: number;
  colors: number;
  /** number of bridge groups */
  links: number;
  /** rings per bridge group (2 = pair, 3 = triple, 4 = quad) */
  grp: number;
  locks: number;
  pal: string[];
}

/** Bridge group: members turn together. Member j moves by sign_j * sign_i * d when ring i is dragged by d. */
export type Group = [number, 1 | -1][];

export interface Level {
  idx: number;
  pano: number;
  inP: number;
  k: number; // ring count
  n: number; // segments per ring
  pal: string[];
  seqs: number[][]; // colour indices per ring
  sym: number[][]; // rotation offsets that look identical to the solved pattern
  locked: boolean[];
  groups: Group[];
  tips: string[]; // i18n keys
  start: number[];
  par: number;
  dist: Uint8Array;
}

export const PER_PANO = 5;

const CINI = ['#1f4e9c', '#f4f1e6', '#27a3b8', '#c8452d', '#e8b04a', '#2b6f4e'];
const EBRU = ['#2a3a8f', '#59b3c9', '#f2d16b', '#e0793b', '#a8325a', '#4c9a6a'];
const MOZAIK = ['#b3382c', '#f0c14b', '#2f7f86', '#efe4c8', '#6b3f8c', '#3f7d4e'];

export const CHAPTERS = ['Kilim', 'Çini', 'Ebru', 'Mozaik'];

export const PANOS: Pano[] = [
  { name: 'Konya', chapter: 0, style: 'kilim', grp: 2, rings: 2, n: 8, colors: 4, links: 0, locks: 0, pal: ['#b8322a', '#e8b04a', '#1f6f78', '#f1e4c3', '#5b3a8a', '#d9702f'] },
  { name: 'Hatay', chapter: 0, style: 'kilim', grp: 2, rings: 3, n: 8, colors: 4, links: 0, locks: 0, pal: ['#a63d40', '#f0c05a', '#2a7f62', '#f6ead0', '#4a4e9a', '#e07a3f'] },
  { name: 'Van', chapter: 0, style: 'kilim', grp: 2, rings: 3, n: 12, colors: 5, links: 0, locks: 0, pal: ['#c8452d', '#f3b94a', '#2f8f83', '#f3e6c8', '#7c4a9e', '#e07a3f'] },
  { name: 'Kars', chapter: 0, style: 'kilim', grp: 2, rings: 3, n: 12, colors: 5, links: 1, locks: 0, pal: ['#8f2d56', '#f2cc6b', '#2b6f9e', '#f4ead5', '#3f7d4e', '#d96c3a'] },
  { name: 'Denizli', chapter: 0, style: 'kilim', grp: 2, rings: 4, n: 12, colors: 5, links: 0, locks: 0, pal: ['#c0392b', '#f1c40f', '#16817a', '#f4e8cd', '#6c3f8f', '#e67e22'] },
  { name: 'Sivas', chapter: 0, style: 'kilim', grp: 2, rings: 4, n: 12, colors: 5, links: 0, locks: 1, pal: ['#a8322d', '#e9b949', '#2c6e8f', '#f1e6cc', '#58478f', '#d9763a'] },
  { name: 'Kayseri', chapter: 0, style: 'kilim', grp: 2, rings: 4, n: 12, colors: 5, links: 1, locks: 1, pal: ['#b5472f', '#eab64f', '#34857a', '#f5ebd2', '#7a4a8a', '#dd7b3c'] },
  { name: 'Muğla', chapter: 0, style: 'kilim', grp: 2, rings: 4, n: 12, colors: 5, links: 1, locks: 0, pal: ['#9d3a4e', '#efc364', '#287c8a', '#f4e9d1', '#4f5aa0', '#d8703f'] },
  { name: 'Bergama', chapter: 0, style: 'kilim', grp: 2, rings: 5, n: 12, colors: 5, links: 0, locks: 0, pal: ['#c4412c', '#f0b848', '#2e8a70', '#f2e5c6', '#6b4496', '#e27d3d'] },
  { name: 'Antep', chapter: 0, style: 'kilim', grp: 2, rings: 5, n: 12, colors: 5, links: 1, locks: 0, pal: ['#b23a35', '#ecbc55', '#2a7a86', '#f6ecd3', '#5d4a9b', '#d9733b'] },
  { name: 'Niğde', chapter: 0, style: 'kilim', grp: 2, rings: 5, n: 12, colors: 5, links: 1, locks: 1, pal: ['#a0352f', '#e8b552', '#31826f', '#f3e7cb', '#704c92', '#dd783d'] },
  { name: 'Erzurum', chapter: 0, style: 'kilim', grp: 2, rings: 5, n: 12, colors: 5, links: 2, locks: 0, pal: ['#bb4630', '#f2bd4c', '#2d8d85', '#f4e8ce', '#7e4d9d', '#e07e40'] },
  // Chapters 2-4 use 5-6 rings (6 rings need n = 8 to keep the state space small).
  // A bridge group couples rings, so independent knobs (= par) drop; difficulty comes from the coupling instead.
  // ---- chapter 2: Cini (triple bridges), two-tone tiles with one or two accents
  { name: 'İznik', chapter: 1, style: 'cini', grp: 3, rings: 5, n: 8, colors: 4, links: 1, locks: 0, pal: CINI },
  { name: 'Kütahya', chapter: 1, style: 'cini', grp: 3, rings: 6, n: 8, colors: 5, links: 1, locks: 0, pal: CINI },
  { name: 'Bursa', chapter: 1, style: 'cini', grp: 3, rings: 6, n: 8, colors: 5, links: 1, locks: 1, pal: CINI },
  { name: 'Edirne', chapter: 1, style: 'cini', grp: 3, rings: 6, n: 8, colors: 6, links: 1, locks: 0, pal: CINI },
  // ---- chapter 3: Ebru (triple, then quad bridges), colour ramps
  { name: 'Manisa', chapter: 2, style: 'ramp', grp: 3, rings: 6, n: 8, colors: 5, links: 1, locks: 0, pal: EBRU },
  { name: 'Aydın', chapter: 2, style: 'ramp', grp: 3, rings: 6, n: 8, colors: 6, links: 1, locks: 1, pal: EBRU },
  { name: 'Uşak', chapter: 2, style: 'ramp', grp: 4, rings: 6, n: 8, colors: 5, links: 1, locks: 0, pal: EBRU },
  { name: 'Sinop', chapter: 2, style: 'ramp', grp: 4, rings: 6, n: 8, colors: 6, links: 1, locks: 0, pal: EBRU },
  // ---- chapter 4: Mozaik, irregular patterns with locks and big bridge groups
  { name: 'Muş', chapter: 3, style: 'mosaic', grp: 3, rings: 6, n: 8, colors: 5, links: 1, locks: 0, pal: MOZAIK },
  { name: 'Bitlis', chapter: 3, style: 'mosaic', grp: 3, rings: 6, n: 8, colors: 5, links: 1, locks: 1, pal: MOZAIK },
  { name: 'Hakkari', chapter: 3, style: 'mosaic', grp: 4, rings: 6, n: 8, colors: 6, links: 1, locks: 0, pal: MOZAIK },
  { name: 'Ağrı', chapter: 3, style: 'mosaic', grp: 3, rings: 6, n: 8, colors: 6, links: 1, locks: 1, pal: MOZAIK },
];
export const LEVEL_COUNT = PANOS.length * PER_PANO;

/** Deterministic seeded RNG. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mod = (x: number, n: number) => ((x % n) + n) % n;

function rotSeq(seq: number[], o: number): number[] {
  const n = seq.length;
  const r = new Array<number>(n);
  for (let k = 0; k < n; k++) r[k] = seq[mod(k - o, n)];
  return r;
}

/** All rotation offsets under which the ring looks unchanged. */
export function symSet(seq: number[]): number[] {
  const n = seq.length;
  const out: number[] = [];
  for (let o = 0; o < n; o++) {
    const r = rotSeq(seq, o);
    let ok = true;
    for (let k = 0; k < n; k++) {
      if (r[k] !== seq[k]) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(o);
  }
  return out;
}

/** Mirrored motif (kilim-like), no equal neighbours, rejected if too rotationally symmetric. */
export function makeSeq(rng: () => number, n: number, colors: number, style: Style = 'kilim'): number[] {
  if (style !== 'kilim') return makeStyledSeq(rng, n, colors, style);
  for (let tries = 0; tries < 200; tries++) {
    const half: number[] = [];
    for (let k = 0; k < n / 2; k++) {
      let c: number;
      let g = 0;
      do {
        c = Math.floor(rng() * colors);
        g++;
      } while (k > 0 && c === half[k - 1] && g < 20);
      half.push(c);
    }
    const seq = half.concat(half.slice().reverse());
    if (new Set(seq).size < Math.min(3, colors)) continue;
    if (symSet(seq).length <= 2) return seq;
  }
  return Array.from({ length: n }, (_, k) => k % colors);
}

/** Non-kilim families. Each one is rejected until the ring has at most 2 rotation symmetries. */
function makeStyledSeq(rng: () => number, n: number, colors: number, style: Style): number[] {
  for (let tries = 0; tries < 400; tries++) {
    let seq: number[] = [];
    if (style === 'cini') {
      // two-tone chequer with one or two accent tiles
      const a = Math.floor(rng() * colors);
      let b = Math.floor(rng() * colors);
      if (b === a) b = (b + 1) % colors;
      seq = Array.from({ length: n }, (_, j) => (j % 2 ? b : a));
      const accents = 1 + Math.floor(rng() * 2);
      for (let q = 0; q < accents; q++) {
        let c = Math.floor(rng() * colors);
        while (c === a || c === b) c = Math.floor(rng() * colors);
        seq[Math.floor(rng() * n)] = c;
      }
    } else if (style === 'ramp') {
      // colour ramp that wraps around: the wrap point breaks the symmetry
      const step = rng() < 0.5 ? 1 : colors - 1;
      const off = Math.floor(rng() * colors);
      seq = Array.from({ length: n }, (_, j) => (off + j * step) % colors);
    } else {
      // mosaic: irregular, no equal neighbours (also around the seam)
      for (let j = 0; j < n; j++) {
        let c: number;
        let g = 0;
        do {
          c = Math.floor(rng() * colors);
          g++;
        } while (g < 30 && ((j > 0 && c === seq[j - 1]) || (j === n - 1 && c === seq[0])));
        seq.push(c);
      }
    }
    if (new Set(seq).size < Math.min(3, colors)) continue;
    if (symSet(seq).length <= 2) return seq;
  }
  return Array.from({ length: n }, (_, k) => k % colors);
}

type Space = Pick<Level, 'k' | 'n'>;

export function encode(L: Space, offs: number[]): number {
  let s = 0;
  let m = 1;
  for (let i = 0; i < L.k; i++) {
    s += mod(offs[i], L.n) * m;
    m *= L.n;
  }
  return s;
}

function decode(L: Space, s: number, out: number[]): number[] {
  for (let i = 0; i < L.k; i++) {
    out[i] = s % L.n;
    s = (s - out[i]) / L.n;
  }
  return out;
}

export function applyMove(L: Pick<Level, 'k' | 'n' | 'groups'>, offs: number[], i: number, d: number): number[] {
  const r = offs.slice();
  r[i] += d;
  for (const g of L.groups) {
    const me = g.find(([ring]) => ring === i);
    if (!me) continue;
    for (const [j, sj] of g) if (j !== i) r[j] += sj * me[1] * d;
  }
  for (let q = 0; q < L.k; q++) r[q] = mod(r[q], L.n);
  return r;
}

export function isSolved(L: Pick<Level, 'k' | 'n' | 'sym'>, offs: number[]): boolean {
  for (let i = 0; i < L.k; i++) {
    if (L.sym[i].indexOf(mod(offs[i], L.n)) < 0) return false;
  }
  return true;
}

/** Multi-source BFS from every solved state: dist[state] = minimum number of moves left. */
function solveSpace(L: Pick<Level, 'k' | 'n' | 'sym' | 'locked' | 'groups'>): Uint8Array {
  const { k, n } = L;
  const size = Math.pow(n, k);
  const dist = new Uint8Array(size).fill(255);
  const queue = new Int32Array(size);
  let qh = 0;
  let qt = 0;
  const lists = L.sym.map((s, i) => (L.locked[i] ? [0] : s));
  const build = (i: number, cur: number[]) => {
    if (i === k) {
      const e = encode(L, cur);
      if (dist[e] === 255) {
        dist[e] = 0;
        queue[qt++] = e;
      }
      return;
    }
    for (const o of lists[i]) {
      cur[i] = o;
      build(i + 1, cur);
    }
  };
  build(0, new Array<number>(k).fill(0));
  const pw: number[] = [];
  for (let i = 0, m = 1; i < k; i++, m *= n) pw.push(m);
  // moves[i] = [ring, ratio] pairs that change when ring i is dragged (itself + linked partners)
  const moves: [number, number][][] = [];
  for (let i = 0; i < k; i++) {
    if (L.locked[i]) continue;
    const mv: [number, number][] = [[i, 1]];
    for (const g of L.groups) {
      const me = g.find(([ring]) => ring === i);
      if (me) for (const [j, sj] of g) if (j !== i) mv.push([j, sj * me[1]]);
    }
    moves.push(mv);
  }
  const cur = new Array<number>(k);
  while (qh < qt) {
    const s = queue[qh++];
    const ds = dist[s] + 1;
    decode(L, s, cur);
    for (const mv of moves) {
      for (let d = 1; d < n; d++) {
        // the encoding is linear in the digits, so the neighbour index is a sum of per-ring digit changes
        let nx = s;
        for (const [r, ratio] of mv) {
          const od = cur[r];
          nx += (mod(od + ratio * d, n) - od) * pw[r];
        }
        if (dist[nx] === 255) {
          dist[nx] = ds;
          queue[qt++] = nx;
        }
      }
    }
  }
  return dist;
}

export function buildLevel(idx: number): Level {
  const pano = Math.floor(idx / PER_PANO);
  const inP = idx % PER_PANO;
  const P = PANOS[pano];
  const rng = mulberry32(1000 + idx * 7919);
  const k = P.rings;
  const n = P.n;
  const seqs: number[][] = [];
  const sym: number[][] = [];
  const locked = new Array<boolean>(k).fill(false);
  const groups: Group[] = [];
  const tips: string[] = [];
  for (let i = 0; i < k; i++) {
    seqs.push(makeSeq(rng, n, P.colors, P.style));
    sym.push(symSet(seqs[i]));
  }
  const adv = inP >= 2; // links and locks appear from the 3rd level of a panel
  if (adv && P.locks) {
    locked[rng() < 0.5 ? 0 : k - 1] = true;
    tips.push('t_lock');
  }
  const free: number[] = [];
  for (let i = 0; i < k; i++) if (!locked[i]) free.push(i);
  if (adv && P.links && free.length >= P.grp) {
    const used = new Set<number>();
    for (let q = 0; q < P.links; q++) {
      let cand = free.filter((i) => !used.has(i));
      if (cand.length < P.grp) break;
      const members: number[] = [];
      for (let m = 0; m < P.grp; m++) {
        const pick = cand[Math.floor(rng() * cand.length)];
        members.push(pick);
        cand = cand.filter((i) => i !== pick);
      }
      members.forEach((i) => used.add(i));
      // pairs keep the original 75% "opposite direction" rule; bigger groups mix directions more evenly
      const g: Group = [[members[0], 1]];
      for (let m = 1; m < members.length; m++) g.push([members[m], rng() < (P.grp === 2 ? 0.75 : 0.6) ? -1 : 1]);
      groups.push(g);
    }
    if (groups.length) tips.push(P.grp === 2 ? 't_link' : 't_group');
  }
  if (idx === 0) tips.splice(0, tips.length, 't_drag');

  const dist = solveSpace({ k, n, sym, locked, groups });
  // independent rotations left after bridge groups couple rings together
  const dof = free.length - groups.reduce((acc, g) => acc + g.length - 1, 0);
  // chapter 1 keeps the original formula (identical to the PWA); later chapters scale with ring count and group size
  // so that coupling rings together never makes a level easier than the plain levels before it
  const tp = P.chapter === 0
    ? Math.max(2, Math.min(9, dof + Math.floor(inP / 2)))
    : Math.max(3, Math.min(9, k - 1 + (P.grp - 2) + Math.floor(inP / 2)));
  let best: number[] | null = null;
  let bestD = 99;
  const big = groups.some((g) => g.length >= 3);
  for (let s = 0; s < 800; s++) {
    const offs = new Array<number>(k).fill(0);
    if (!big) {
      // pairs (and no groups): random states, keep reachable ones (identical to the original generator)
      for (const i of free) offs[i] = Math.floor(rng() * n);
    } else {
      // bigger groups: most random states are unreachable, so scramble a solved state instead
      for (let i = 0; i < k; i++) offs[i] = locked[i] ? 0 : sym[i][0];
      const steps = tp + 2 + Math.floor(rng() * 4);
      for (let m = 0; m < steps; m++) {
        const ring = free[Math.floor(rng() * free.length)];
        const cur = applyMove({ k, n, groups }, offs, ring, 1 + Math.floor(rng() * (n - 1)));
        for (let i = 0; i < k; i++) offs[i] = cur[i];
      }
    }
    const d = dist[encode({ k, n }, offs)];
    if (d === 255 || d === 0) continue;
    const diff = Math.abs(d - tp);
    if (diff < bestD) {
      bestD = diff;
      best = offs;
      if (diff === 0) break;
    }
  }
  if (!best) {
    best = new Array<number>(k).fill(0);
    best[free[0]] = 1;
  }
  const par = dist[encode({ k, n }, best)];
  return { idx, pano, inP, k, n, pal: P.pal, seqs, sym, locked, groups, tips, start: best, par, dist };
}

export interface Hint {
  ring: number;
  steps: number; // signed, + is clockwise
}

export function hintFor(L: Level, offs: number[]): Hint | null {
  const cur = L.dist[encode(L, offs)];
  if (cur === 0 || cur === 255) return null;
  let best: Hint | null = null;
  for (let i = 0; i < L.k; i++) {
    if (L.locked[i]) continue;
    for (let d = 1; d < L.n; d++) {
      const nx = applyMove(L, offs, i, d);
      if (L.dist[encode(L, nx)] === cur - 1) {
        const signed = d > L.n / 2 ? d - L.n : d;
        if (!best || Math.abs(signed) < Math.abs(best.steps)) best = { ring: i, steps: signed };
      }
    }
  }
  return best;
}

/** 3 stars if at or under par, 2 within two extra moves, otherwise 1. */
export function starsFor(moves: number, par: number): 1 | 2 | 3 {
  return moves <= par ? 3 : moves <= par + 2 ? 2 : 1;
}
