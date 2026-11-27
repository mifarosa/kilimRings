import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocales } from 'expo-localization';
import { STRINGS, type Lang, type StringKey, type Strings } from './i18n';
import { defaultSave, loadSave, persistSave, type SaveData } from './storage';

interface Ctx {
  save: SaveData;
  update: (fn: (s: SaveData) => SaveData) => void;
  lang: Lang;
  t: (k: StringKey) => string;
  S: Strings;
}

const AppCtx = createContext<Ctx | null>(null);

const deviceLang = (): Lang => {
  try {
    return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [save, setSave] = useState<SaveData | null>(null);

  useEffect(() => {
    loadSave().then(setSave);
  }, []);

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = fn(prev ?? defaultSave());
      persistSave(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx | null>(() => {
    if (!save) return null;
    const lang = save.opt.lang ?? deviceLang();
    const S = STRINGS[lang];
    return { save, update, lang, S, t: (k) => S[k] };
  }, [save, update]);

  if (!value) return null; // storage is read in a few ms; the native splash covers this
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
