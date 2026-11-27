import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { defaultSave } from '../storage';
import { Btn } from '../components/ui';
import { C } from '../theme';

export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, save, update, lang } = useApp();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const askedAt = useRef(0);

  const toggle = (k: 'sound' | 'haptic' | 'assist' | 'contrast') => (v: boolean) =>
    update((s) => ({ ...s, opt: { ...s.opt, [k]: v } }));

  const Line = ({ label, k }: { label: string; k: 'sound' | 'haptic' | 'assist' | 'contrast' }) => (
    <View style={styles.sw}>
      <Text style={styles.lbl}>{label}</Text>
      <Switch value={save.opt[k]} onValueChange={toggle(k)} trackColor={{ true: C.gold, false: C.line }} thumbColor="#fff" testID={`opt-${k}`} />
    </View>
  );

  const reset = () => {
    if (Date.now() - askedAt.current > 4000) {
      askedAt.current = Date.now();
      setNote(t('resetAsk'));
      return;
    }
    update((s) => ({ ...defaultSave(), opt: s.opt }));
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: insets.bottom + 18 }]}>
          <ScrollView contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.h3}>{t('settings')}</Text>
            <Line label={t('sound')} k="sound" />
            <Line label={t('haptic')} k="haptic" />
            <Line label={t('assist')} k="assist" />
            <Line label={t('contrast')} k="contrast" />
            <View style={styles.sw}>
              <Text style={styles.lbl}>{t('language')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['tr', 'en'] as const).map((l) => (
                  <Pressable
                    key={l}
                    testID={`lang-${l}`}
                    onPress={() => update((s) => ({ ...s, opt: { ...s.opt, lang: l } }))}
                    style={[styles.seg, lang === l && { backgroundColor: C.gold, borderColor: C.gold }]}
                  >
                    <Text style={{ color: lang === l ? C.darkInk : C.ink, fontWeight: '700' }}>{l.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {note ? <Text style={styles.note}>{note}</Text> : null}
            <Btn testID="btn-reset" kind="danger" label={t('reset')} onPress={reset} style={{ flex: 0 }} />
            <Btn testID="btn-close-settings" kind="primary" label={t('close')} onPress={() => { setNote(''); onClose(); }} style={{ flex: 0 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(21,15,38,0.85)', justifyContent: 'flex-end' },
  card: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 2, borderColor: C.line, padding: 18, maxHeight: '90%' },
  h3: { color: C.ink, fontSize: 22, fontWeight: '700' },
  sw: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  lbl: { color: C.ink, fontSize: 16, flexShrink: 1, paddingRight: 12 },
  seg: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: C.line, backgroundColor: C.bg2 },
  note: { color: C.muted, fontSize: 13 },
});
