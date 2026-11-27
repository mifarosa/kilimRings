import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { C } from '../theme';

type Kind = 'default' | 'primary' | 'accent' | 'danger' | 'ghost';

export function Btn({ label, onPress, kind = 'default', big, disabled, style, testID }: {
  label: string; onPress: () => void; kind?: Kind; big?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const k = styles[kind];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn, k, big && styles.big, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.97 }] }, style,
      ]}
    >
      <Text style={[styles.txt, kind === 'primary' && { color: C.darkInk }, kind === 'danger' && { color: '#ff9d8f' }, big && { fontSize: 20 }]}>{label}</Text>
    </Pressable>
  );
}

export function IconBtn({ glyph, onPress, label, testID }: { glyph: string; onPress: () => void; label: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.icon}>
      <Text style={{ color: C.ink, fontSize: 26, lineHeight: 30 }}>{glyph}</Text>
    </Pressable>
  );
}

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', gap: 12 }, style]}>{children}</View>
);

const styles = StyleSheet.create({
  btn: { backgroundColor: C.card, borderWidth: 2, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', flex: 1 },
  big: { minHeight: 64, borderRadius: 20, flex: 0, alignSelf: 'stretch' },
  txt: { color: C.ink, fontWeight: '700', fontSize: 16 },
  default: {},
  primary: { backgroundColor: C.gold, borderColor: C.gold },
  accent: { backgroundColor: C.teal, borderColor: C.teal },
  danger: { backgroundColor: 'transparent', borderColor: '#a8453a' },
  ghost: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
});
