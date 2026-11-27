import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { LEVEL_COUNT, PANOS, PER_PANO } from '../engine/levels';
import { IconBtn } from '../components/ui';
import { C, SERIF } from '../theme';

export function MapScreen({ onBack, onPick }: { onBack: () => void; onPick: (idx: number) => void }) {
  const { t, S, save } = useApp();
  const insets = useSafeAreaInsets();
  let total = 0;
  const panos = PANOS.map((P, pi) => {
    let got = 0;
    const chips = [];
    for (let q = 0; q < PER_PANO; q++) {
      const idx = pi * PER_PANO + q;
      const s = save.stars[idx] || 0;
      const lock = idx > save.unlocked;
      got += s;
      total += s;
      chips.push(
        <Pressable
          key={idx}
          testID={`chip-${idx}`}
          disabled={lock}
          accessibilityRole="button"
          accessibilityLabel={`${t('level')} ${idx + 1}`}
          onPress={() => onPick(idx)}
          style={[styles.chip, lock && { opacity: 0.35 }, s > 0 && { borderColor: C.gold }, !lock && !s && { borderColor: C.teal, borderWidth: 3 }]}
        >
          <Text style={styles.chipN}>{idx + 1}</Text>
          <Text style={styles.chipS}>{s ? '★'.repeat(s) : lock ? '·' : ' '}</Text>
        </Pressable>,
      );
    }
    const heading = pi === 0 || PANOS[pi - 1].chapter !== P.chapter ? (
      <Text key={`ch${P.chapter}`} style={styles.chapter}>{S.chapters[P.chapter]}</Text>
    ) : null;
    return (
      <React.Fragment key={P.name}>
      {heading}
      <View style={styles.pano}>
        <View style={styles.panoHead}>
          <Text style={styles.panoTitle}>{t('pano')} {pi + 1} · {P.name}</Text>
          <Text style={styles.panoStars}>{got}/{PER_PANO * 3} ★</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>{chips}</View>
      </View>
      </React.Fragment>
    );
  });
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.bar}>
        <IconBtn testID="map-back" glyph="‹" label={t('back')} onPress={onBack} />
        <Text style={styles.h2}>{t('collection')}</Text>
        <Text style={styles.total} testID="star-total">{total} / {LEVEL_COUNT * 3} ★</Text>
      </View>
      <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {panos}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 },
  h2: { color: C.ink, fontSize: 20, fontWeight: '700', flex: 1 },
  total: { color: C.gold, fontWeight: '700' },
  chapter: { color: C.gold, fontFamily: SERIF, fontSize: 22, marginTop: 8, marginLeft: 4 },
  pano: { backgroundColor: C.card, borderWidth: 2, borderColor: C.line, borderRadius: 18, padding: 12 },
  panoHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  panoTitle: { color: C.ink, fontSize: 16, fontWeight: '700' },
  panoStars: { color: C.gold, fontSize: 13 },
  chip: { flex: 1, aspectRatio: 1 / 1.05, borderRadius: 12, backgroundColor: C.bg2, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  chipN: { color: C.ink, fontWeight: '800', fontSize: 18 },
  chipS: { color: C.gold, fontSize: 11, minHeight: 14, letterSpacing: 1 },
});
