import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { makeSeq, mulberry32, PANOS } from '../engine/levels';
import { RingPaths } from '../components/RingPaths';
import { Btn } from '../components/ui';
import { C, SERIF } from '../theme';

const RADII: [number, number][] = [[70, 96], [42, 66], [18, 38]];

export function HomeScreen({ onPlay, onMap, onSettings }: { onPlay: () => void; onMap: () => void; onSettings: () => void }) {
  const { t, save } = useApp();
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const seqs = useMemo(() => {
    const rng = mulberry32(42);
    return [0, 1, 2].map(() => makeSeq(rng, 12, 5));
  }, []);

  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [spin]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.top}>
        <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <Svg width={260} height={260} viewBox="-100 -100 200 200">
            {seqs.map((s, i) => (
              <RingPaths key={i} seq={s} pal={PANOS[2].pal} r1={RADII[i][0]} r2={RADII[i][1]} />
            ))}
          </Svg>
        </Animated.View>
        <Text style={styles.title}>Kilim Rings</Text>
        <Text style={styles.tag}>{t('tagline')}</Text>
      </View>
      <View style={{ gap: 12 }}>
        <Btn testID="btn-play" big kind="primary" label={save.unlocked > 0 ? t('cont') : t('play')} onPress={onPlay} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Btn testID="btn-map" label={t('collection')} onPress={onMap} />
          <Btn testID="btn-settings" label={t('settings')} onPress={onSettings} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontFamily: SERIF, fontSize: 42, color: C.ink, marginTop: 10, letterSpacing: 0.5 },
  tag: { color: C.gold, fontSize: 17, textAlign: 'center' },
});
