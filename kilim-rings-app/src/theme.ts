import { Platform } from 'react-native';

export const C = {
  bg: '#1b1330',
  bg2: '#2a1f45',
  card: '#32265a',
  ink: '#f6ecd2',
  muted: '#b9a9d4',
  gold: '#f3b94a',
  red: '#c8452d',
  teal: '#2f8f83',
  line: '#46386f',
  darkInk: '#2a1f3d',
};

export const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });
