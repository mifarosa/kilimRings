import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { GAP, INNER, innerFor, OUTER, ringRadii } from '../engine/geometry';
import type { Level } from '../engine/levels';
import { RingPaths } from './RingPaths';

export interface BoardHandle {
  /** Animate rings to the given offsets (undo / restart). */
  animateTo: (offs: number[], done?: () => void) => void;
  /** Jump rings to the given offsets without animation. */
  snapTo: (offs: number[]) => void;
}

interface Props {
  level: Level;
  size: number;
  big: boolean;
  /** Current logical offsets (used to draw the "correct ring" outline). */
  offs: number[];
  assist: boolean;
  hintRing: number;
  celebrate: boolean;
  disabled: boolean;
  onTick: () => void;
  onLockedTap: () => void;
  /** Called after a drag settles; steps is the signed number of segments (0 = no move). */
  onMove: (ring: number, steps: number) => void;
  handleRef: React.MutableRefObject<BoardHandle | null>;
}

const VB = '-200 -200 400 400';
const DUR = 130;

export function Board({ level: L, size, big, offs, assist, hintRing, celebrate, disabled, onTick, onLockedTap, onMove, handleRef }: Props) {
  const radii = useMemo(() => ringRadii(L.k), [L.k]);
  const stepDeg = 360 / L.n;
  const rot = useRef<Animated.Value[]>([]);
  const rotNum = useRef<number[]>([]);
  if (rot.current.length !== L.k || (rot.current as any).__lvl !== L.idx) {
    rot.current = L.start.map((o) => new Animated.Value(o * stepDeg));
    (rot.current as any).__lvl = L.idx;
    rotNum.current = L.start.map((o) => o * stepDeg);
  }

  // latest props for the (created-once) responder callbacks
  const live = useRef({ L, size, disabled, onTick, onLockedTap, onMove, radii });
  live.current = { L, size, disabled, onTick, onLockedTap, onMove, radii };
  const anim = useRef(false);
  const drag = useRef<null | {
    ring: number; last: number; total: number; base: number; lastStep: number;
    parts: { j: number; r: number; base: number }[]; ox: number; oy: number;
  }>(null);

  const setRot = (i: number, deg: number) => {
    rotNum.current[i] = deg;
    rot.current[i].setValue(deg);
  };

  const run = (targets: [number, number][], done?: () => void) => {
    anim.current = true;
    Animated.parallel(
      targets.map(([i, to]) =>
        Animated.timing(rot.current[i], { toValue: to, duration: DUR, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ),
    ).start(() => {
      targets.forEach(([i, to]) => (rotNum.current[i] = to));
      anim.current = false;
      done?.();
    });
  };

  useEffect(() => {
    handleRef.current = {
      animateTo: (o, done) => {
        // take the shortest way round for each ring
        const targets: [number, number][] = o.map((v, i) => {
          const cur = rotNum.current[i];
          const want = v * (360 / live.current.L.n);
          let d = (((want - cur) % 360) + 540) % 360 - 180;
          if (Math.abs(d) < 1e-6) d = 0;
          return [i, cur + d];
        });
        run(targets, () => {
          o.forEach((v, i) => setRot(i, v * (360 / live.current.L.n)));
          done?.();
        });
      },
      snapTo: (o) => o.forEach((v, i) => setRot(i, v * (360 / live.current.L.n))),
    };
    return () => {
      handleRef.current = null;
    };
  });

  const toBoard = (px: number, py: number, ox: number, oy: number) => {
    const sc = 400 / live.current.size;
    return { x: (px - ox - live.current.size / 2) * sc, y: (py - oy - live.current.size / 2) * sc };
  };
  const ringAt = (x: number, y: number) => {
    const r = Math.hypot(x, y);
    const rad = live.current.radii;
    if (r < innerFor(live.current.L.k) - 4 || r > OUTER + 14) return -1;
    for (let i = 0; i < rad.length; i++) {
      if (r >= rad[i][0] - GAP / 2 && r <= rad[i][1] + GAP / 2 + (i === 0 ? 14 : 0)) return i;
    }
    return -1;
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) => {
          const c = live.current;
          if (c.disabled || anim.current) return false;
          const ne = e.nativeEvent;
          // location of the touch inside the board gives us the board's page origin for later moves
          const ox = ne.pageX - ne.locationX;
          const oy = ne.pageY - ne.locationY;
          const p = toBoard(ne.pageX, ne.pageY, ox, oy);
          const i = ringAt(p.x, p.y);
          if (i < 0) return false;
          if (c.L.locked[i]) {
            c.onLockedTap();
            return false;
          }
          const me = c.L.groups.flatMap((g) => g).find(([ring]) => ring === i);
          const grp = c.L.groups.find((g) => g.some(([ring]) => ring === i));
          const partners = grp && me
            ? grp.filter(([j]) => j !== i).map(([j, sj]) => ({ j, r: sj * me[1], base: rotNum.current[j] }))
            : [];
          drag.current = {
            ring: i,
            last: (Math.atan2(p.y, p.x) * 180) / Math.PI,
            total: 0,
            base: rotNum.current[i],
            lastStep: Math.floor(rotNum.current[i] / (360 / c.L.n)),
            parts: partners,
            ox,
            oy,
          };
          return true;
        },
        onPanResponderMove: (e) => {
          const d = drag.current;
          if (!d) return;
          const ne = e.nativeEvent;
          const p = toBoard(ne.pageX, ne.pageY, d.ox, d.oy);
          const ang = (Math.atan2(p.y, p.x) * 180) / Math.PI;
          let diff = ang - d.last;
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          d.total += diff;
          d.last = ang;
          setRot(d.ring, d.base + d.total);
          d.parts.forEach((q) => setRot(q.j, q.base + q.r * d.total));
          const st = Math.floor((d.base + d.total) / (360 / live.current.L.n));
          if (st !== d.lastStep) {
            d.lastStep = st;
            live.current.onTick();
          }
        },
        onPanResponderRelease: () => finish(),
        onPanResponderTerminate: () => finish(),
        onPanResponderTerminationRequest: () => false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function finish() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const sd = 360 / live.current.L.n;
    const steps = Math.round(d.total / sd);
    const targets: [number, number][] = [[d.ring, d.base + steps * sd]];
    d.parts.forEach((q) => targets.push([q.j, q.base + q.r * steps * sd]));
    run(targets, () => {
      live.current.onMove(d.ring, steps);
    });
  }

  // pulsing glow for hint ring / celebration
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (hintRing < 0 && !celebrate) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hintRing, celebrate, pulse]);

  const hub = (
    <G transform={`scale(${innerFor(L.k) / INNER})`}>
      <Circle r={INNER - 4} fill="#3a2c52" stroke="#f3b94a" strokeWidth={3} />
      <Circle r={INNER - 20} fill="#f3b94a" />
      <Path d="M0 -20L14 0L0 20L-14 0Z" fill="#c8452d" />
      <Path d="M0 -9L6.5 0L0 9L-6.5 0Z" fill="#f6ecd2" />
    </G>
  );

  return (
    <View
      {...responder.panHandlers}
      style={{ width: size, height: size }}
      accessibilityLabel="puzzle board"
      testID="board"
    >
      {L.seqs.map((seq, i) => (
        <Animated.View
          key={`${L.idx}-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute', left: 0, top: 0, width: size, height: size,
            transform: [{ rotate: rot.current[i].interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
          }}
        >
          <Svg width={size} height={size} viewBox={VB}>
            <RingPaths seq={seq} pal={L.pal} r1={radii[i][0]} r2={radii[i][1]} big={big} />
          </Svg>
        </Animated.View>
      ))}
      {/* static overlay: locks, bridges, hub, top marker */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Svg width={size} height={size} viewBox={VB}>
          {L.locked.map((lk, i) =>
            lk ? (
              <G key={`lk${i}`} transform={`translate(0 ${-(radii[i][0] + radii[i][1]) / 2})`}>
                <Rect x={-9} y={-3} width={18} height={14} rx={3} fill="#2a1f3d" stroke="#f3b94a" strokeWidth={2} />
                <Path d="M-5 -3v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#f3b94a" strokeWidth={2.4} />
              </G>
            ) : null,
          )}
          {L.groups.map((g, gi) => {
            // one dotted bridge per group, each group on its own spoke so they never overlap
            const ys = g.map(([ring]) => (radii[ring][0] + radii[ring][1]) / 2).sort((x, y) => x - y);
            return (
              <G key={`bl${gi}`} transform={`rotate(${gi * 40})`}>
                <Line x1={ys[ys.length - 1]} y1={0} x2={ys[0]} y2={0} stroke="#f3b94a" strokeWidth={5} strokeLinecap="round" strokeDasharray="1 9" />
                {ys.map((y, q) => (
                  <Circle key={q} cx={y} cy={0} r={4.5} fill="#f3b94a" />
                ))}
              </G>
            );
          })}
          {hub}
          <Path d="M-10 -199L10 -199L0 -184Z" fill="#f3b94a" />
        </Svg>
      </View>
      {/* "this ring is in place" outlines */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: celebrate ? pulse : 1 }}>
        <Svg width={size} height={size} viewBox={VB}>
          {L.seqs.map((_, i) => {
            const ok = L.sym[i].indexOf(((offs[i] % L.n) + L.n) % L.n) >= 0;
            return (celebrate || (assist && ok && !L.locked[i])) ? (
              <Circle key={`ok${i}`} r={radii[i][1] + 1.5} fill="none" stroke="#f3b94a" strokeWidth={3} />
            ) : null;
          })}
        </Svg>
      </Animated.View>
      {/* hint ring */}
      {hintRing >= 0 && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: pulse }}>
          <Svg width={size} height={size} viewBox={VB}>
            <Circle r={radii[hintRing][1] + 1.5} fill="none" stroke="#ffffff" strokeWidth={5} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
