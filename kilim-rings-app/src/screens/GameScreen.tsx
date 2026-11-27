import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { Board, type BoardHandle } from '../components/Board';
import { RingPaths } from '../components/RingPaths';
import { Btn, IconBtn } from '../components/ui';
import { ringRadii } from '../engine/geometry';
import { applyMove, buildLevel, hintFor, isSolved, LEVEL_COUNT, PANOS, starsFor, type Level } from '../engine/levels';
import { haptic, playSfx } from '../feedback';
import { C, SERIF } from '../theme';

interface Game {
  offs: number[];
  moves: number;
  undo: { offs: number[]; moves: number }[];
  done: boolean;
  busy: boolean;
}

export function GameScreen({ idx, onBack, onGoto, onMap }: { idx: number; onBack: () => void; onGoto: (i: number) => void; onMap: () => void }) {
  const { t, S, save, update } = useApp();
  const insets = useSafeAreaInsets();
  const [L, setL] = useState<Level | null>(null);

  // BFS for the biggest levels takes a few hundred ms: let the "loading" frame paint first
  useEffect(() => {
    setL(null);
    const h = setTimeout(() => setL(buildLevel(idx)), 30);
    return () => clearTimeout(h);
  }, [idx]);

  if (!L) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.muted }}>{t('loading')}</Text>
      </View>
    );
  }
  return <Play key={L.idx} L={L} onBack={onBack} onGoto={onGoto} onMap={onMap} t={t} S={S} save={save} update={update} insets={insets} />;
}

type PlayProps = {
  L: Level; onBack: () => void; onGoto: (i: number) => void; onMap: () => void;
  t: ReturnType<typeof useApp>['t']; S: ReturnType<typeof useApp>['S'];
  save: ReturnType<typeof useApp>['save']; update: ReturnType<typeof useApp>['update'];
  insets: { top: number; bottom: number };
};

function Play({ L, onBack, onGoto, onMap, t, S, save, update, insets }: PlayProps) {
  const g = useRef<Game>({ offs: L.start.slice(), moves: 0, undo: [], done: false, busy: false });
  const handle = useRef<BoardHandle | null>(null);
  const [offs, setOffs] = useState(L.start.slice());
  const [moves, setMoves] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [done, setDone] = useState(false);
  const [hintRing, setHintRing] = useState(-1);
  const [win, setWin] = useState<null | { stars: number }>(null);
  const [boardSize, setBoardSize] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const toastOp = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const winTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const opt = save.opt;

  const toast = useCallback((msg: string, ms = 3200) => {
    setToastMsg(msg);
    Animated.timing(toastOp, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => Animated.timing(toastOp, { toValue: 0, duration: 250, useNativeDriver: true }).start(), ms);
  }, [toastOp]);

  useEffect(() => {
    if (L.tips.length) toast(L.tips.map((k) => (S as any)[k] as string).join('  '), 5200);
    return () => {
      clearTimeout(toastTimer.current);
      clearTimeout(winTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    setOffs(g.current.offs.slice());
    setMoves(g.current.moves);
    setCanUndo(g.current.undo.length > 0);
  };

  const checkWin = () => {
    const G = g.current;
    if (G.done || !isSolved(L, G.offs)) return;
    G.done = true;
    setDone(true);
    playSfx('win', opt.sound);
    haptic.win(opt.haptic);
    const st = starsFor(G.moves, L.par);
    update((s) => ({
      ...s,
      stars: { ...s.stars, [L.idx]: Math.max(s.stars[L.idx] || 0, st) },
      unlocked: Math.max(s.unlocked, Math.min(LEVEL_COUNT - 1, L.idx + 1)),
    }));
    clearTimeout(winTimer.current);
    winTimer.current = setTimeout(() => setWin({ stars: st }), 700);
  };

  const onMove = (ring: number, steps: number) => {
    const G = g.current;
    if (steps !== 0) {
      G.undo.push({ offs: G.offs.slice(), moves: G.moves });
      G.offs = applyMove(L, G.offs, ring, steps);
      G.moves++;
      handle.current?.snapTo(G.offs);
      playSfx('snap', opt.sound);
      haptic.snap(opt.haptic);
    }
    sync();
    checkWin();
  };

  const onTick = () => {
    playSfx('tick', opt.sound);
    haptic.tick(opt.haptic);
  };
  const onLockedTap = () => {
    playSfx('bad', opt.sound);
    haptic.warn(opt.haptic);
    toast(t('locked'), 1400);
  };

  const run = (fn: () => void) => {
    const G = g.current;
    if (G.done || G.busy) return;
    fn();
  };

  const doHint = () =>
    run(() => {
      const h = hintFor(L, g.current.offs);
      if (!h) return;
      setHintRing(h.ring);
      const names = S.ringNames;
      const nm = h.ring === L.k - 1 ? names[4] : names[h.ring];
      toast(`${nm} ${t('h_ring')} ${Math.abs(h.steps)} ${h.steps > 0 ? t('h_cw') : t('h_ccw')}`, 4200);
    });

  const doUndo = () =>
    run(() => {
      const G = g.current;
      const u = G.undo.pop();
      if (!u) return;
      setHintRing(-1);
      G.offs = u.offs.slice();
      G.moves = u.moves;
      G.busy = true;
      sync();
      handle.current?.animateTo(G.offs, () => (G.busy = false));
    });

  const doRestart = () => {
    const G = g.current;
    if (G.busy) return;
    clearTimeout(winTimer.current);
    setWin(null);
    setHintRing(-1);
    G.done = false;
    setDone(false);
    G.offs = L.start.slice();
    G.moves = 0;
    G.undo = [];
    G.busy = true;
    sync();
    handle.current?.animateTo(G.offs, () => (G.busy = false));
  };

  const R = ringRadii(L.k);
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.bar}>
        <IconBtn testID="game-back" glyph="‹" label={t('back')} onPress={onMap} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.gTitle} testID="g-title">{t('level')} {L.idx + 1} / {LEVEL_COUNT}</Text>
          <Text style={styles.gSub}>{t('pano')} {L.pano + 1} · {PANOS[L.pano].name}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Svg width={56} height={56} viewBox="-200 -200 400 400">
            {L.seqs.map((s, i) => (
              <RingPaths key={i} seq={s} pal={L.pal} r1={R[i][0]} r2={R[i][1]} />
            ))}
          </Svg>
          <Text style={styles.targetLbl}>{t('target')}</Text>
        </View>
      </View>

      <View
        style={styles.boardWrap}
        onLayout={(e) => setBoardSize(Math.floor(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height)))}
      >
        {boardSize > 0 && (
          <Board
            level={L}
            size={boardSize}
            big={opt.contrast}
            offs={offs}
            assist={opt.assist}
            hintRing={hintRing}
            celebrate={done}
            disabled={done}
            onTick={onTick}
            onLockedTap={onLockedTap}
            onMove={(r, s) => {
              setHintRing(-1);
              onMove(r, s);
            }}
            handleRef={handle}
          />
        )}
      </View>

      <View style={styles.status}>
        <Text style={styles.statusTxt} testID="moves">{t('moves')}: {moves}</Text>
        <Text style={styles.statusTxt}>{t('par')}: {L.par}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn testID="btn-undo" label={`↶ ${t('undo')}`} onPress={doUndo} disabled={!canUndo} />
        <Btn testID="btn-hint" label={`💡 ${t('hint')}`} onPress={doHint} kind="accent" />
        <Btn testID="btn-restart" label={`⟲ ${t('restart')}`} onPress={doRestart} />
      </View>

      <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 88, opacity: toastOp }]}>
        <Text style={{ color: C.ink, fontSize: 14, textAlign: 'center' }}>{toastMsg}</Text>
      </Animated.View>

      {win && (
        <View style={[styles.win, { paddingBottom: insets.bottom + 16 }]} testID="win">
          <View style={styles.winCard}>
            <Text style={styles.winTitle}>{t('won')}</Text>
            <Text style={styles.winStars}>
              {[1, 2, 3].map((n) => (
                <Text key={n} style={n <= win.stars ? undefined : { color: '#5a4c83' }}>★</Text>
              ))}
            </Text>
            <Text style={{ color: C.muted, textAlign: 'center' }}>
              {t('moves')}: {moves} · {t('par')}: {L.par}
              {L.idx + 1 >= LEVEL_COUNT ? `  ${t('allDone')}` : ''}
            </Text>
            {L.idx + 1 < LEVEL_COUNT && <Btn testID="btn-next" big kind="primary" label={t('next')} onPress={() => onGoto(L.idx + 1)} />}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Btn label={t('replay')} onPress={doRestart} />
              <Btn label={t('collection')} onPress={onMap} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 },
  gTitle: { color: C.ink, fontWeight: '800', fontSize: 18 },
  gSub: { color: C.muted, fontSize: 13 },
  targetLbl: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  status: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 6, paddingBottom: 10 },
  statusTxt: { color: C.muted, fontSize: 14 },
  toast: { position: 'absolute', left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.55)', padding: 10, borderRadius: 12 },
  win: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(21,15,38,0.8)', justifyContent: 'flex-end', paddingHorizontal: 16 },
  winCard: { backgroundColor: C.card, borderWidth: 2, borderColor: C.gold, borderRadius: 24, padding: 16, paddingTop: 20, gap: 12 },
  winTitle: { color: C.ink, fontFamily: SERIF, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  winStars: { fontSize: 44, letterSpacing: 6, color: C.gold, textAlign: 'center' },
});
