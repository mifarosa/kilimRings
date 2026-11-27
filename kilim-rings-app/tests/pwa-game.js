'use strict';
/* Kilim Rings - a one-thumb ring rotation puzzle (PWA).
   Working title lives in APP.name / manifest; change both to rename. */

const APP = { name: 'Kilim Rings', version: 1, storageKey: 'kilim-rings-v1' };

/* ---------- i18n ---------- */
const I18N = {
  tr: {
    tagline: 'Sana özel desen, dostum!', play: 'Oyna', cont: 'Devam et', collection: 'Koleksiyon',
    settings: 'Ayarlar', install: 'Ana ekrana ekle', sound: 'Ses', haptic: 'Titreşim',
    assist: 'Doğru halkayı göster', contrast: 'Büyük desen işaretleri', language: 'Dil', reset: 'İlerlemeyi sıfırla',
    close: 'Tamam', hint: 'İpucu', undo: 'Geri al', restart: 'Baştan', moves: 'Hamle', par: 'Hedef hamle',
    target: 'Hedef', level: 'Seviye', pano: 'Pano', next: 'Sonraki seviye', replay: 'Tekrar', map: 'Koleksiyon',
    won: 'Güzel desen!', wonInfo: 'Halkalar yerine oturdu.', allDone: 'Hepsini tamamladın! Tekrar oynayabilirsin.',
    t_drag: 'Halkayı parmağınla çevir. Desenleri sağ üstteki "Hedef" ile eşleştir.',
    t_link: 'Altın köprü: bağlı halkalar. Biri dönünce diğeri ters yöne döner.',
    t_lock: 'Kilitli halka dönmez. Diğerlerini ona göre ayarla.',
    h_ring: 'halkayı', h_cw: 'adım saat yönünde çevir', h_ccw: 'adım saat yönünün tersine çevir',
    ringNames: ['Dış','2.','3.','4.','İç'], locked: 'Bu halka kilitli', resetAsk: 'İlerleme silinsin mi? Tekrar dokun.',
    ios: 'iPhone: Paylaş düğmesi > Ana Ekrana Ekle.', stars: 'yıldız'
  },
  en: {
    tagline: 'Special pattern for you, my friend!', play: 'Play', cont: 'Continue', collection: 'Collection',
    settings: 'Settings', install: 'Add to home screen', sound: 'Sound', haptic: 'Vibration',
    assist: 'Show correct rings', contrast: 'Large pattern marks', language: 'Language', reset: 'Reset progress',
    close: 'Done', hint: 'Hint', undo: 'Undo', restart: 'Restart', moves: 'Moves', par: 'Target moves',
    target: 'Target', level: 'Level', pano: 'Panel', next: 'Next level', replay: 'Replay', map: 'Collection',
    won: 'Beautiful pattern!', wonInfo: 'The rings fell into place.', allDone: 'You finished everything! Replay any level.',
    t_drag: 'Drag a ring with your thumb. Match the patterns to the "Target" at top right.',
    t_link: 'Golden bridge: linked rings. When one turns, the other turns the opposite way.',
    t_lock: 'A locked ring will not turn. Set the others to match it.',
    h_ring: 'ring', h_cw: 'steps clockwise', h_ccw: 'steps counter-clockwise',
    ringNames: ['Outer','2nd','3rd','4th','Inner'], locked: 'This ring is locked', resetAsk: 'Erase progress? Tap again.',
    ios: 'iPhone: Share button > Add to Home Screen.', stars: 'stars'
  }
};
let LANG = (navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en';
const T = k => (I18N[LANG] && I18N[LANG][k]) || I18N.en[k] || k;

/* ---------- storage ---------- */
const defaults = () => ({ unlocked: 0, stars: {}, opt: { sound: true, haptic: true, assist: true, contrast: false, lang: null } });
let SAVE = defaults();
function load() {
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (raw) { const d = JSON.parse(raw); SAVE = Object.assign(defaults(), d); SAVE.opt = Object.assign(defaults().opt, d.opt || {}); }
  } catch (e) { /* storage may be blocked: keep defaults */ }
  if (SAVE.opt.lang) LANG = SAVE.opt.lang;
  if (/[?&]unlock=1/.test(location.search)) SAVE.unlocked = 999;
}
function save() { try { localStorage.setItem(APP.storageKey, JSON.stringify(SAVE)); } catch (e) { /* ignore */ } }

/* ---------- seeded RNG ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- content: panels (levels come in groups of 5) ---------- */
const PER_PANO = 5;
const PANOS = [
  { name: 'Konya',    rings: 2, n: 8,  colors: 4, links: 0, locks: 0, pal: ['#b8322a', '#e8b04a', '#1f6f78', '#f1e4c3', '#5b3a8a', '#d9702f'] },
  { name: 'Hatay',    rings: 3, n: 8,  colors: 4, links: 0, locks: 0, pal: ['#a63d40', '#f0c05a', '#2a7f62', '#f6ead0', '#4a4e9a', '#e07a3f'] },
  { name: 'Van',      rings: 3, n: 12, colors: 5, links: 0, locks: 0, pal: ['#c8452d', '#f3b94a', '#2f8f83', '#f3e6c8', '#7c4a9e', '#e07a3f'] },
  { name: 'Kars',     rings: 3, n: 12, colors: 5, links: 1, locks: 0, pal: ['#8f2d56', '#f2cc6b', '#2b6f9e', '#f4ead5', '#3f7d4e', '#d96c3a'] },
  { name: 'Denizli',  rings: 4, n: 12, colors: 5, links: 0, locks: 0, pal: ['#c0392b', '#f1c40f', '#16817a', '#f4e8cd', '#6c3f8f', '#e67e22'] },
  { name: 'Sivas',    rings: 4, n: 12, colors: 5, links: 0, locks: 1, pal: ['#a8322d', '#e9b949', '#2c6e8f', '#f1e6cc', '#58478f', '#d9763a'] },
  { name: 'Kayseri',  rings: 4, n: 12, colors: 5, links: 1, locks: 1, pal: ['#b5472f', '#eab64f', '#34857a', '#f5ebd2', '#7a4a8a', '#dd7b3c'] },
  { name: 'Muğla',    rings: 4, n: 12, colors: 5, links: 1, locks: 0, pal: ['#9d3a4e', '#efc364', '#287c8a', '#f4e9d1', '#4f5aa0', '#d8703f'] },
  { name: 'Bergama',  rings: 5, n: 12, colors: 5, links: 0, locks: 0, pal: ['#c4412c', '#f0b848', '#2e8a70', '#f2e5c6', '#6b4496', '#e27d3d'] },
  { name: 'Antep',    rings: 5, n: 12, colors: 5, links: 1, locks: 0, pal: ['#b23a35', '#ecbc55', '#2a7a86', '#f6ecd3', '#5d4a9b', '#d9733b'] },
  { name: 'Niğde',    rings: 5, n: 12, colors: 5, links: 1, locks: 1, pal: ['#a0352f', '#e8b552', '#31826f', '#f3e7cb', '#704c92', '#dd783d'] },
  { name: 'Erzurum',  rings: 5, n: 12, colors: 5, links: 2, locks: 0, pal: ['#bb4630', '#f2bd4c', '#2d8d85', '#f4e8ce', '#7e4d9d', '#e07e40'] }
];
const LEVEL_COUNT = PANOS.length * PER_PANO;

/* ---------- level generation ---------- */
function rotSeq(seq, o) { const n = seq.length; const r = new Array(n); for (let k = 0; k < n; k++) r[k] = seq[((k - o) % n + n) % n]; return r; }
function symSet(seq) { const n = seq.length, s = []; for (let o = 0; o < n; o++) { const r = rotSeq(seq, o); let ok = true; for (let k = 0; k < n; k++) if (r[k] !== seq[k]) { ok = false; break; } if (ok) s.push(o); } return s; }

function makeSeq(rng, n, colors) {
  // mirrored motif (kilim-like) with no equal neighbours, rejected if too rotationally symmetric
  for (let tries = 0; tries < 200; tries++) {
    const half = [];
    for (let k = 0; k < n / 2; k++) {
      let c, g = 0;
      do { c = Math.floor(rng() * colors); g++; } while (k > 0 && c === half[k - 1] && g < 20);
      half.push(c);
    }
    const seq = half.concat(half.slice().reverse());
    if (new Set(seq).size < Math.min(3, colors)) continue;
    if (symSet(seq).length <= 2) return seq;
  }
  return Array.from({ length: n }, (_, k) => k % colors);
}

function buildLevel(idx) {
  const pano = Math.floor(idx / PER_PANO), inP = idx % PER_PANO, P = PANOS[pano];
  const rng = mulberry32(1000 + idx * 7919);
  const k = P.rings, n = P.n;
  const L = { idx, pano, inP, k, n, pal: P.pal, seqs: [], sym: [], locked: new Array(k).fill(false), links: [], tips: [] };
  for (let i = 0; i < k; i++) { L.seqs.push(makeSeq(rng, n, P.colors)); L.sym.push(symSet(L.seqs[i])); }
  const adv = inP >= 2; // links and locks appear from the 3rd level of a panel
  if (adv && P.locks) { L.locked[rng() < .5 ? 0 : k - 1] = true; L.tips.push('t_lock'); }
  const free = []; for (let i = 0; i < k; i++) if (!L.locked[i]) free.push(i);
  if (adv && P.links && free.length >= 2) {
    const used = new Set();
    for (let q = 0; q < P.links; q++) {
      const cand = free.filter(i => !used.has(i)); if (cand.length < 2) break;
      const a = cand[Math.floor(rng() * cand.length)];
      const rest = cand.filter(i => i !== a);
      const b = rest[Math.floor(rng() * rest.length)];
      used.add(a); used.add(b);
      L.links.push([a, b, rng() < .75 ? -1 : 1]);
    }
    if (L.links.length) L.tips.push('t_link');
  }
  if (idx === 0) L.tips = ['t_drag'];
  // BFS distances to the solved set, then pick a start state
  solveSpace(L);
  const dof = free.length - L.links.length; // independent rotations after links couple rings
  const tp = Math.max(2, Math.min(9, dof + Math.floor(inP / 2)));
  let best = null, bestD = 99;
  for (let s = 0; s < 800; s++) {
    const offs = new Array(k).fill(0);
    for (const i of free) offs[i] = Math.floor(rng() * n);
    const d = L.dist[encode(L, offs)];
    if (d === 255 || d === 0) continue;
    const diff = Math.abs(d - tp);
    if (diff < bestD) { bestD = diff; best = offs; if (diff === 0) break; }
  }
  if (!best) { best = new Array(k).fill(0); best[free[0]] = 1; }
  L.start = best; L.par = L.dist[encode(L, best)];
  return L;
}

function encode(L, offs) { let s = 0, m = 1; for (let i = 0; i < L.k; i++) { s += (((offs[i] % L.n) + L.n) % L.n) * m; m *= L.n; } return s; }
function decode(L, s, out) { for (let i = 0; i < L.k; i++) { out[i] = s % L.n; s = (s - out[i]) / L.n; } return out; }
function applyMove(L, offs, i, d) {
  const r = offs.slice(); r[i] += d;
  for (const [a, b, ratio] of L.links) { if (a === i) r[b] += ratio * d; else if (b === i) r[a] += ratio * d; }
  for (let q = 0; q < L.k; q++) r[q] = ((r[q] % L.n) + L.n) % L.n;
  return r;
}
function isSolved(L, offs) { for (let i = 0; i < L.k; i++) if (L.sym[i].indexOf(((offs[i] % L.n) + L.n) % L.n) < 0) return false; return true; }

function solveSpace(L) {
  const k = L.k, n = L.n, size = Math.pow(n, k);
  const dist = new Uint8Array(size).fill(255);
  const queue = new Int32Array(size); let qh = 0, qt = 0;
  // multi-source: every combination of symmetric offsets (locked rings stay at 0)
  const lists = L.sym.map((s, i) => L.locked[i] ? [0] : s);
  const build = (i, cur) => { if (i === k) { const e = encode(L, cur); if (dist[e] === 255) { dist[e] = 0; queue[qt++] = e; } return; } for (const o of lists[i]) { cur[i] = o; build(i + 1, cur); } };
  build(0, new Array(k).fill(0));
  const movable = []; for (let i = 0; i < k; i++) if (!L.locked[i]) movable.push(i);
  const pw = []; for (let i = 0, m = 1; i < k; i++, m *= n) pw.push(m);
  // moves[i] = list of [ring, ratio] that change when ring i is dragged (itself ratio 1 + linked partners)
  const moves = movable.map(i => [[i, 1]].concat(L.links.filter(l => l[0] === i || l[1] === i).map(l => [l[0] === i ? l[1] : l[0], l[2]])));
  const cur = new Array(k);
  while (qh < qt) {
    const s = queue[qh++]; const ds = dist[s] + 1;
    decode(L, s, cur);
    for (let mi = 0; mi < moves.length; mi++) {
      const mv = moves[mi];
      for (let d = 1; d < n; d++) {
        // encoding is linear in the digits, so the neighbour index is a sum of per-ring digit changes (no allocation)
        let nx = s;
        for (let q = 0; q < mv.length; q++) {
          const r = mv[q][0], od = cur[r], nd = (((od + mv[q][1] * d) % n) + n) % n;
          nx += (nd - od) * pw[r];
        }
        if (dist[nx] === 255) { dist[nx] = ds; queue[qt++] = nx; }
      }
    }
  }
  L.dist = dist;
}

function hintFor(L, offs) {
  const cur = L.dist[encode(L, offs)]; if (cur === 0 || cur === 255) return null;
  let best = null;
  for (let i = 0; i < L.k; i++) {
    if (L.locked[i]) continue;
    for (let d = 1; d < L.n; d++) {
      const nx = applyMove(L, offs, i, d);
      if (L.dist[encode(L, nx)] === cur - 1) {
        const signed = d > L.n / 2 ? d - L.n : d;
        const cand = { ring: i, steps: signed };
        if (!best || Math.abs(signed) < Math.abs(best.steps)) best = cand;
      }
    }
  }
  return best;
}

/* ---------- geometry / drawing ---------- */
const OUTER = 180, INNER = 52, GAP = 4;
function ringRadii(k) {
  const th = (OUTER - INNER - GAP * (k - 1)) / k, out = [];
  for (let i = 0; i < k; i++) { const r2 = OUTER - i * (th + GAP); out.push([r2 - th, r2]); }
  return out;
}
const pt = (r, a) => { const t = (a - 90) * Math.PI / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
function wedge(r1, r2, a0, a1) {
  const p1 = pt(r2, a0), p2 = pt(r2, a1), p3 = pt(r1, a1), p4 = pt(r1, a0);
  return 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2) +
    ' L' + p3[0].toFixed(2) + ' ' + p3[1].toFixed(2) + ' A' + r1 + ' ' + r1 + ' 0 0 0 ' + p4[0].toFixed(2) + ' ' + p4[1].toFixed(2) + 'Z';
}
function lum(hex) { const v = parseInt(hex.slice(1), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
const SHAPES = [
  s => 'M0 ' + -s + 'L' + .72 * s + ' 0L0 ' + s + 'L' + -.72 * s + ' 0Z',                       // diamond
  s => 'M0 ' + -s + 'L' + .9 * s + ' ' + .7 * s + 'L' + -.9 * s + ' ' + .7 * s + 'Z',          // triangle
  s => 'M' + -s * .8 + ' 0a' + s * .8 + ' ' + s * .8 + ' 0 1 0 ' + 1.6 * s + ' 0a' + s * .8 + ' ' + s * .8 + ' 0 1 0 ' + -1.6 * s + ' 0Z', // circle
  s => 'M' + -.7 * s + ' ' + -.7 * s + 'h' + 1.4 * s + 'v' + 1.4 * s + 'h' + -1.4 * s + 'Z',  // square
  s => { const a = s * .3; return 'M' + -a + ' ' + -s + 'h' + 2 * a + 'v' + (s - a) + 'h' + (s - a) + 'v' + 2 * a + 'h' + -(s - a) + 'v' + (s - a) + 'h' + -2 * a + 'v' + -(s - a) + 'h' + -(s - a) + 'v' + -2 * a + 'h' + (s - a) + 'Z'; }, // plus
  s => { let d = ''; for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; d += (q ? 'L' : 'M') + (s * .9 * Math.cos(a)).toFixed(2) + ' ' + (s * .9 * Math.sin(a)).toFixed(2); } return d + 'Z'; } // hexagon
];

// Draws one ring (wedges + motifs) into an HTML string; seq is drawn unrotated, rotation is applied by the group
function ringMarkup(L, i, radii, big) {
  const [r1, r2] = radii[i], n = L.n, step = 360 / n, seq = L.seqs[i], mid = (r1 + r2) / 2;
  let h = '';
  for (let j = 0; j < n; j++) {
    const a0 = j * step + .6, a1 = (j + 1) * step - .6, col = L.pal[seq[j]];
    h += '<path d="' + wedge(r1, r2, a0, a1) + '" fill="' + col + '" stroke="#241a3d" stroke-width="2"/>';
    const m = pt(mid, a0 + (a1 - a0) / 2), sz = (r2 - r1) * (big ? .34 : .26);
    const dark = lum(col) > .55 ? '#2a1f3d' : '#fff6df';
    h += '<g transform="translate(' + m[0].toFixed(2) + ' ' + m[1].toFixed(2) + ') rotate(' + (a0 + (a1 - a0) / 2).toFixed(1) + ')">' +
      '<path d="' + SHAPES[seq[j] % SHAPES.length](sz) + '" fill="' + dark + '"/></g>';
  }
  return h;
}

/* ---------- audio / haptics ---------- */
let actx = null;
function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
function tone(freq, dur, type, vol, when) {
  if (!SAVE.opt.sound) return; const c = audio(); if (!c) return;
  const t0 = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || .08, t0 + .01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + .02);
}
const sfx = {
  tick() { tone(900, .04, 'square', .025); },
  snap() { tone(220, .09, 'triangle', .1); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .35, 'triangle', .09, i * .12)); },
  bad() { tone(140, .12, 'sawtooth', .05); }
};
function buzz(ms) { if (SAVE.opt.haptic && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } } }

/* ---------- game state / UI ---------- */
const $ = id => document.getElementById(id);
let G = null; // active game

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function toast(msg, ms) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms || 3200); }
function starsOf(idx) { return SAVE.stars[idx] || 0; }
function firstOpen() { for (let i = 0; i < LEVEL_COUNT; i++) if (i > SAVE.unlocked) return Math.max(0, i - 1); return LEVEL_COUNT - 1; }

function applyTexts() {
  $('tagline').textContent = T('tagline');
  $('btnPlay').textContent = (SAVE.unlocked > 0 ? T('cont') : T('play'));
  $('btnMap').textContent = T('collection'); $('btnSettings').textContent = T('settings');
  $('btnInstall').textContent = T('install'); $('mapTitle').textContent = T('collection');
  $('btnUndo').textContent = '↶ ' + T('undo'); $('btnHint').textContent = '💡 ' + T('hint'); $('btnRestart').textContent = '⟲ ' + T('restart');
  $('targetLbl').textContent = T('target');
  $('setTitle').textContent = T('settings'); $('lblSound').textContent = T('sound'); $('lblHaptic').textContent = T('haptic');
  $('lblAssist').textContent = T('assist'); $('lblContrast').textContent = T('contrast'); $('lblLang').textContent = T('language');
  $('btnReset').textContent = T('reset'); $('btnCloseSettings').textContent = T('close');
  $('btnReplay').textContent = T('replay'); $('btnWinMap').textContent = T('map');
  $('iosNote').textContent = T('ios');
  document.documentElement.lang = LANG;
}

function buildLogo() {
  const L = { k: 3, n: 12, pal: PANOS[2].pal, seqs: [], sym: [] };
  const rng = mulberry32(42); for (let i = 0; i < 3; i++) L.seqs.push(makeSeq(rng, 12, 5));
  const radii = [[70, 96], [42, 66], [18, 38]];
  let h = '';
  for (let i = 0; i < 3; i++) h += '<g>' + ringMarkup(L, i, radii, false) + '</g>';
  $('logo').innerHTML = h;
}

function renderMap() {
  let total = 0, h = '';
  PANOS.forEach((P, pi) => {
    let got = 0, chips = '';
    for (let q = 0; q < PER_PANO; q++) {
      const idx = pi * PER_PANO + q, s = starsOf(idx), lock = idx > SAVE.unlocked;
      got += s; total += s;
      const cls = 'chip' + (lock ? ' locked' : '') + (s ? ' done' : '') + (!lock && !s ? ' next' : '');
      chips += '<button class="' + cls + '" data-lv="' + idx + '"' + (lock ? ' disabled' : '') + '>' + (idx + 1) + '<small>' + (s ? '★'.repeat(s) : (lock ? '·' : '')) + '</small></button>';
    }
    h += '<div class="pano"><h4>' + T('pano') + ' ' + (pi + 1) + ' · ' + P.name + '<span>' + got + '/' + PER_PANO * 3 + ' ★</span></h4><div class="chips">' + chips + '</div></div>';
  });
  $('panos').innerHTML = h; $('starTotal').textContent = total + ' ★';
  $('panos').querySelectorAll('.chip:not([disabled])').forEach(b => b.addEventListener('click', () => startLevel(+b.dataset.lv)));
}

function startLevel(idx) {
  idx = Math.max(0, Math.min(LEVEL_COUNT - 1, idx));
  clearTimeout(checkWin._t);
  const L = buildLevel(idx);
  G = { L, offs: L.start.slice(), rot: [], moves: 0, undo: [], done: false, drag: null, hintRing: -1 };
  for (let i = 0; i < L.k; i++) G.rot[i] = G.offs[i] * (360 / L.n);
  $('win').hidden = true; show('game');
  $('gTitle').textContent = T('level') + ' ' + (idx + 1) + ' / ' + LEVEL_COUNT;
  $('gSub').textContent = T('pano') + ' ' + (L.pano + 1) + ' · ' + PANOS[L.pano].name;
  drawBoard(); drawTarget(); updateStatus();
  if (L.tips.length) toast(L.tips.map(T).join('  '), 5200);
  G.t0 = performance.now();
}

function drawTarget() {
  const L = G.L, sc = 100 / OUTER;
  const rr = ringRadii(L.k).map(r => [r[0] * sc, r[1] * sc]);
  let h = ''; for (let i = 0; i < L.k; i++) h += '<g>' + ringMarkup(L, i, rr, false) + '</g>';
  $('targetSvg').innerHTML = h;
}

function drawBoard() {
  const L = G.L, radii = ringRadii(L.k); G.radii = radii;
  let h = '';
  for (let i = 0; i < L.k; i++) {
    h += '<g id="ring' + i + '" transform="rotate(' + G.rot[i] + ')">' + ringMarkup(L, i, radii, SAVE.opt.contrast) + '</g>';
    h += '<circle id="ok' + i + '" r="' + (radii[i][1] + 1.5) + '" fill="none" stroke="#f3b94a" stroke-width="3" opacity="0"/>';
    h += '<circle id="hl' + i + '" r="' + (radii[i][1] + 1.5) + '" fill="none" stroke="#fff" stroke-width="5" opacity="0"/>';
    if (L.locked[i]) {
      const m = (radii[i][0] + radii[i][1]) / 2;
      h += '<g transform="translate(0 ' + (-m) + ')"><rect x="-9" y="-3" width="18" height="14" rx="3" fill="#2a1f3d" stroke="#f3b94a" stroke-width="2"/><path d="M-5 -3v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#f3b94a" stroke-width="2.4"/></g>';
    }
  }
  // golden bridges for linked rings (drawn at 3 o'clock)
  for (const [a, b] of L.links) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const y1 = (radii[lo][0] + radii[lo][1]) / 2, y2 = (radii[hi][0] + radii[hi][1]) / 2;
    h += '<line x1="' + y2 + '" y1="0" x2="' + y1 + '" y2="0" stroke="#f3b94a" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>';
    h += '<circle cx="' + y1 + '" cy="0" r="4.5" fill="#f3b94a"/><circle cx="' + y2 + '" cy="0" r="4.5" fill="#f3b94a"/>';
  }
  // hub
  h += '<circle r="' + (INNER - 4) + '" fill="#3a2c52" stroke="#f3b94a" stroke-width="3"/><circle r="' + (INNER - 20) + '" fill="#f3b94a"/>' +
    '<path d="M0 -20L14 0L0 20L-14 0Z" fill="#c8452d"/><path d="M0 -9L6.5 0L0 9L-6.5 0Z" fill="#f6ecd2"/>';
  // top marker
  h += '<path d="M-10 -199L10 -199L0 -184Z" fill="#f3b94a"/>';
  $('board').innerHTML = h;
  refreshOk();
}

function setRot(i, deg) { G.rot[i] = deg; const el = $('ring' + i); if (el) el.setAttribute('transform', 'rotate(' + deg + ')'); }
function refreshOk() {
  const L = G.L;
  for (let i = 0; i < L.k; i++) {
    const ok = L.sym[i].indexOf(((G.offs[i] % L.n) + L.n) % L.n) >= 0;
    const el = $('ok' + i); if (el) el.setAttribute('opacity', (SAVE.opt.assist && ok && !L.locked[i]) ? 1 : 0);
  }
}
function updateStatus() { $('moves').textContent = T('moves') + ': ' + G.moves; $('par').textContent = T('par') + ': ' + G.L.par; $('btnUndo').disabled = !G.undo.length; }

/* ---------- interaction ---------- */
function boardPoint(e) {
  const svg = $('board'), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const m = svg.getScreenCTM(); if (!m) return null; const q = p.matrixTransform(m.inverse()); return { x: q.x, y: q.y };
}
function ringAt(x, y) {
  const r = Math.hypot(x, y), radii = G.radii; if (r < INNER - 4 || r > OUTER + 14) return -1;
  for (let i = 0; i < radii.length; i++) if (r >= radii[i][0] - GAP / 2 && r <= radii[i][1] + GAP / 2 + (i === 0 ? 14 : 0)) return i;
  return -1;
}
function partners(i) { const out = []; for (const [a, b, ratio] of G.L.links) { if (a === i) out.push([b, ratio]); else if (b === i) out.push([a, ratio]); } return out; }

function onDown(e) {
  if (!G || G.done || G.anim) return;
  audio();
  const p = boardPoint(e); if (!p) return; const i = ringAt(p.x, p.y); if (i < 0) return;
  if (G.L.locked[i]) { sfx.bad(); buzz(40); $('board').classList.remove('shake'); void $('board').offsetWidth; $('board').classList.add('shake'); toast(T('locked'), 1400); return; }
  e.preventDefault(); $('board').setPointerCapture(e.pointerId);
  const ang = Math.atan2(p.y, p.x) * 180 / Math.PI;
  G.drag = { ring: i, last: ang, total: 0, base: G.rot[i], parts: partners(i).map(([j, r]) => ({ j, r, base: G.rot[j] })), lastStep: Math.floor(G.rot[i] / (360 / G.L.n)) };
  clearHint();
}
function onMove(e) {
  const d = G && G.drag; if (!d) return; const p = boardPoint(e); if (!p) return;
  const ang = Math.atan2(p.y, p.x) * 180 / Math.PI; let diff = ang - d.last; while (diff > 180) diff -= 360; while (diff < -180) diff += 360;
  d.total += diff; d.last = ang;
  setRot(d.ring, d.base + d.total); d.parts.forEach(q => setRot(q.j, q.base + q.r * d.total));
  const st = Math.floor((d.base + d.total) / (360 / G.L.n)); if (st !== d.lastStep) { d.lastStep = st; sfx.tick(); buzz(8); }
}
function onUp() {
  const d = G && G.drag; if (!d) return; G.drag = null;
  const stepDeg = 360 / G.L.n, steps = Math.round(d.total / stepDeg);
  const targets = [[d.ring, d.base + steps * stepDeg]].concat(d.parts.map(q => [q.j, q.base + q.r * steps * stepDeg]));
  animateTo(targets, () => {
    if (steps !== 0) {
      G.undo.push({ offs: G.offs.slice(), moves: G.moves });
      G.offs = applyMove(G.L, G.offs, d.ring, steps); G.moves++;
      // normalise visual rotations to the new offsets (keeps numbers small)
      for (let i = 0; i < G.L.k; i++) setRot(i, G.offs[i] * stepDeg);
      sfx.snap(); buzz(15);
    }
    refreshOk(); updateStatus(); checkWin();
  });
}
function animateTo(targets, done) {
  G.anim = true; const from = targets.map(([i]) => G.rot[i]), t0 = performance.now(), dur = 130;
  const ease = x => 1 - Math.pow(1 - x, 3);
  (function f(now) {
    const k = Math.min(1, (now - t0) / dur);
    targets.forEach(([i, to], q) => setRot(i, from[q] + (to - from[q]) * ease(k)));
    if (k < 1) requestAnimationFrame(f); else { G.anim = false; done(); }
  })(t0);
}
function checkWin() {
  if (!isSolved(G.L, G.offs) || G.done) return; G.done = true; sfx.win(); buzz([30, 40, 30]);
  const par = G.L.par, m = G.moves, st = m <= par ? 3 : (m <= par + 2 ? 2 : 1);
  const idx = G.L.idx; if (st > starsOf(idx)) SAVE.stars[idx] = st; if (SAVE.unlocked < idx + 1) SAVE.unlocked = Math.min(LEVEL_COUNT - 1, idx + 1);
  save();
  // celebrate: all rings glow
  for (let i = 0; i < G.L.k; i++) { const el = $('ok' + i); if (el) { el.setAttribute('opacity', 1); el.classList.add('pulse'); } }
  const g = G; clearTimeout(checkWin._t);
  checkWin._t = setTimeout(() => {
    if (G !== g) return; // the player already left this level
    $('winStars').innerHTML = [1, 2, 3].map(n => '<span class="' + (n <= st ? '' : 'off') + '">★</span>').join('');
    $('winTitle').textContent = T('won');
    $('winInfo').textContent = T('moves') + ': ' + m + ' · ' + T('par') + ': ' + par + (idx + 1 >= LEVEL_COUNT ? '  ' + T('allDone') : '');
    $('btnNext').textContent = T('next'); $('btnNext').style.display = idx + 1 >= LEVEL_COUNT ? 'none' : '';
    $('win').hidden = false;
  }, 700);
}
function clearHint() { if (!G) return; for (let i = 0; i < G.L.k; i++) { const h = $('hl' + i); if (h) { h.setAttribute('opacity', 0); h.classList.remove('pulse'); } } }
function doHint() {
  if (!G || G.done || G.anim) return; const h = hintFor(G.L, G.offs); if (!h) return;
  clearHint(); const el = $('hl' + h.ring); if (el) { el.setAttribute('opacity', 1); el.classList.add('pulse'); }
  const names = I18N[LANG].ringNames, nm = h.ring === G.L.k - 1 ? names[4] : names[h.ring];
  const n = Math.abs(h.steps);
  toast(nm + ' ' + T('h_ring') + ' ' + n + ' ' + (h.steps > 0 ? T('h_cw') : T('h_ccw')), 4200);
}
function doUndo() {
  if (!G || G.done || G.anim || !G.undo.length) return; const u = G.undo.pop(); clearHint();
  const sd = 360 / G.L.n; G.offs = u.offs.slice(); G.moves = u.moves;
  animateTo(G.offs.map((o, i) => [i, o * sd]), () => { refreshOk(); updateStatus(); });
}
function doRestart() {
  if (!G || G.anim) return; clearHint(); clearTimeout(checkWin._t); $('win').hidden = true; G.done = false;
  const sd = 360 / G.L.n; G.offs = G.L.start.slice(); G.moves = 0; G.undo = [];
  animateTo(G.offs.map((o, i) => [i, o * sd]), () => { for (let i = 0; i < G.L.k; i++) { const el = $('ok' + i); if (el) el.classList.remove('pulse'); } refreshOk(); updateStatus(); });
}

/* ---------- settings / install ---------- */
let deferredInstall = null;
function syncSettings() {
  $('optSound').checked = SAVE.opt.sound; $('optHaptic').checked = SAVE.opt.haptic; $('optAssist').checked = SAVE.opt.assist;
  $('optContrast').checked = SAVE.opt.contrast; $('optLang').value = LANG;
}
function bind() {
  $('btnPlay').addEventListener('click', () => { audio(); startLevel(firstOpen()); });
  $('btnMap').addEventListener('click', () => { renderMap(); show('map'); });
  $('mapBack').addEventListener('click', () => show('home'));
  $('gameBack').addEventListener('click', () => { renderMap(); show('map'); applyTexts(); });
  $('btnSettings').addEventListener('click', () => { syncSettings(); $('settings').hidden = false; });
  $('btnCloseSettings').addEventListener('click', () => { $('settings').hidden = true; save(); });
  $('optSound').addEventListener('change', e => { SAVE.opt.sound = e.target.checked; save(); });
  $('optHaptic').addEventListener('change', e => { SAVE.opt.haptic = e.target.checked; save(); });
  $('optAssist').addEventListener('change', e => { SAVE.opt.assist = e.target.checked; save(); if (G) refreshOk(); });
  $('optContrast').addEventListener('change', e => { SAVE.opt.contrast = e.target.checked; save(); if (G && $('game').classList.contains('active')) { drawBoard(); } });
  $('optLang').addEventListener('change', e => { LANG = e.target.value; SAVE.opt.lang = LANG; save(); applyTexts(); renderMap(); if (G) { $('gTitle').textContent = T('level') + ' ' + (G.L.idx + 1) + ' / ' + LEVEL_COUNT; updateStatus(); } });
  let ask = 0;
  $('btnReset').addEventListener('click', () => {
    if (Date.now() - ask > 4000) { ask = Date.now(); toast(T('resetAsk'), 3000); return; }
    SAVE = defaults(); if (SAVE.opt.lang) LANG = SAVE.opt.lang; save(); applyTexts(); renderMap(); syncSettings(); $('settings').hidden = true;
  });
  $('btnUndo').addEventListener('click', doUndo); $('btnHint').addEventListener('click', doHint); $('btnRestart').addEventListener('click', doRestart);
  $('btnNext').addEventListener('click', () => startLevel(G.L.idx + 1));
  $('btnReplay').addEventListener('click', () => startLevel(G.L.idx));
  $('btnWinMap').addEventListener('click', () => { renderMap(); show('map'); });
  const b = $('board'); b.addEventListener('pointerdown', onDown); b.addEventListener('pointermove', onMove);
  b.addEventListener('pointerup', onUp); b.addEventListener('pointercancel', onUp);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('btnInstall').hidden = false; });
  $('btnInstall').addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) { /* ignore */ } deferredInstall = null; $('btnInstall').hidden = true; });
  window.addEventListener('appinstalled', () => { $('btnInstall').hidden = true; });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  $('iosNote').hidden = !ios;
}

function init() {
  load(); applyTexts(); buildLogo(); bind(); syncSettings();
  document.title = APP.name; $('title').textContent = APP.name;
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  }
}
init();

// Test hooks (also handy for debugging in the browser console)
window.SP = {
  start: startLevel, build: buildLevel, solvedNow: () => isSolved(G.L, G.offs), state: () => ({ offs: G.offs.slice(), moves: G.moves, done: G.done, par: G.L.par }),
  hint: () => hintFor(G.L, G.offs), move: (i, d) => { G.undo.push({ offs: G.offs.slice(), moves: G.moves }); G.offs = applyMove(G.L, G.offs, i, d); G.moves++; for (let q = 0; q < G.L.k; q++) setRot(q, G.offs[q] * 360 / G.L.n); refreshOk(); updateStatus(); checkWin(); },
  count: LEVEL_COUNT
};
