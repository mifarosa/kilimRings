import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from './i18n';

const KEY = 'kilim-rings-v1';

export interface SaveData {
  unlocked: number; // highest playable level index
  stars: Record<number, number>;
  opt: { sound: boolean; haptic: boolean; assist: boolean; contrast: boolean; lang: Lang | null };
}

export const defaultSave = (): SaveData => ({
  unlocked: 0,
  stars: {},
  opt: { sound: true, haptic: true, assist: true, contrast: false, lang: null },
});

export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const base = defaultSave();
      return { ...base, ...d, opt: { ...base.opt, ...(d.opt || {}) } };
    }
  } catch {
    /* corrupt or unavailable storage: start fresh */
  }
  return defaultSave();
}

export async function persistSave(s: SaveData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore: progress is best-effort */
  }
}
