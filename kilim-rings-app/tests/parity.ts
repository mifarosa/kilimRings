// Verifies the TypeScript engine matches the PWA's game.js and that every level is solvable.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { buildLevel, hintFor, applyMove, isSolved, LEVEL_COUNT, PER_PANO, starsFor } from '../src/engine/levels';

const src = fs.readFileSync(process.argv[2], 'utf8').split('\n');
// lines 54..199 of the PWA hold the pure logic (rng, panels, generation, solver, hints)
const code = src.slice(53, 199).join('\n') + '\n;this.buildLevel=buildLevel;this.hintFor=hintFor;this.applyMove=applyMove;this.isSolved=isSolved;';
const ctx: any = {};
vm.createContext(ctx);
vm.runInContext(code, ctx);

let pars: number[] = [];
const t0 = Date.now();
const PWA_LEVELS = 60; // the PWA shipped the first 12 panels; the app extends them
for (let i = 0; i < LEVEL_COUNT; i++) {
  const a = buildLevel(i);
  const b = i < PWA_LEVELS ? ctx.buildLevel(i) : null;
  if (b) {
    for (const key of ['seqs', 'start', 'links', 'locked', 'tips']) b[key] = JSON.parse(JSON.stringify(b[key])); // drop vm-realm prototypes
    const pairs = a.groups.map((g) => [g[0][0], g[1][0], g[0][1] * g[1][1]]);
    assert.deepEqual(a.seqs, b.seqs, `seqs L${i}`);
    assert.deepEqual(a.start, b.start, `start L${i}`);
    assert.deepEqual(pairs, b.links, `links L${i}`);
    assert.deepEqual(a.locked, b.locked, `locked L${i}`);
    assert.deepEqual(a.tips, b.tips, `tips L${i}`);
    assert.equal(a.par, b.par, `par L${i}`);
    assert.deepEqual(Array.from(a.dist), Array.from(b.dist), `dist L${i}`);
  }
  assert.ok(a.par >= 1 && a.par < 255, `par range L${i}`);
  // follow hints to the end: must solve in exactly `par` moves
  let offs = a.start.slice();
  let moves = 0;
  while (!isSolved(a, offs)) {
    const h = hintFor(a, offs);
    assert.ok(h, `hint L${i}`);
    offs = applyMove(a, offs, h!.ring, h!.steps);
    moves++;
    assert.ok(moves <= 40, `loop L${i}`);
  }
  assert.ok(a.par >= 1 && a.par <= 12, `par sane L${i}: ${a.par}`);
  assert.equal(moves, a.par, `hint path = par L${i}`);
  pars.push(a.par);
}
assert.equal(starsFor(3, 3), 3);
assert.equal(starsFor(5, 3), 2);
assert.equal(starsFor(6, 3), 1);
console.log(`OK: ${LEVEL_COUNT} levels (first ${PWA_LEVELS} identical to PWA), all solved by hints in par moves (${Date.now() - t0} ms)`);
console.log('pars:', pars.join(' '));
