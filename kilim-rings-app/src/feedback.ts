import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

type Sfx = 'tick' | 'snap' | 'win' | 'bad';

const SOURCES: Record<Sfx, number> = {
  tick: require('../assets/sfx/tick.wav'),
  snap: require('../assets/sfx/snap.wav'),
  win: require('../assets/sfx/win.wav'),
  bad: require('../assets/sfx/bad.wav'),
};

const players: Partial<Record<Sfx, AudioPlayer>> = {};
let ready = false;

function init() {
  if (ready) return;
  ready = true;
  // respect the iPhone silent switch and never stop the user's music
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

export function playSfx(name: Sfx, enabled: boolean) {
  if (!enabled) return;
  try {
    init();
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players[name] = p;
    }
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    /* sound is optional */
  }
}

export const haptic = {
  tick: (on: boolean) => on && Haptics.selectionAsync().catch(() => {}),
  snap: (on: boolean) => on && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  win: (on: boolean) => on && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: (on: boolean) => on && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
