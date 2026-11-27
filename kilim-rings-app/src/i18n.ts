export type Lang = 'tr' | 'en';

const tr = {
  tagline: 'Sana özel desen, dostum!', play: 'Oyna', cont: 'Devam et', collection: 'Koleksiyon',
  settings: 'Ayarlar', sound: 'Ses', haptic: 'Titreşim', assist: 'Doğru halkayı göster',
  contrast: 'Büyük desen işaretleri', language: 'Dil', reset: 'İlerlemeyi sıfırla', close: 'Tamam',
  hint: 'İpucu', undo: 'Geri al', restart: 'Baştan', moves: 'Hamle', par: 'Hedef hamle', target: 'Hedef',
  level: 'Seviye', pano: 'Pano', next: 'Sonraki seviye', replay: 'Tekrar', won: 'Güzel desen!',
  allDone: 'Hepsini tamamladın! Tekrar oynayabilirsin.',
  t_drag: 'Halkayı parmağınla çevir. Desenleri sağ üstteki "Hedef" ile eşleştir.',
  t_link: 'Altın köprü: bağlı halkalar. Biri dönünce diğeri ters yöne döner.',
  t_lock: 'Kilitli halka dönmez. Diğerlerini ona göre ayarla.',
  t_group: 'Köprüyle bağlı halkaların hepsi birlikte döner.',
  chapters: ['Kilim', 'Çini', 'Ebru', 'Mozaik'],
  h_ring: 'halkayı', h_cw: 'adım saat yönünde çevir', h_ccw: 'adım saat yönünün tersine çevir',
  ringNames: ['Dış', '2.', '3.', '4.', 'İç'], locked: 'Bu halka kilitli', resetAsk: 'İlerleme silinsin mi? Tekrar dokun.',
  back: 'Geri', loading: 'Hazırlanıyor…',
};

const en: typeof tr = {
  tagline: 'Special pattern for you, my friend!', play: 'Play', cont: 'Continue', collection: 'Collection',
  settings: 'Settings', sound: 'Sound', haptic: 'Haptics', assist: 'Show correct rings',
  contrast: 'Large pattern marks', language: 'Language', reset: 'Reset progress', close: 'Done',
  hint: 'Hint', undo: 'Undo', restart: 'Restart', moves: 'Moves', par: 'Target moves', target: 'Target',
  level: 'Level', pano: 'Panel', next: 'Next level', replay: 'Replay', won: 'Beautiful pattern!',
  allDone: 'You finished everything! Replay any level.',
  t_drag: 'Drag a ring with your thumb. Match the patterns to the "Target" at top right.',
  t_link: 'Golden bridge: linked rings. When one turns, the other turns the opposite way.',
  t_lock: 'A locked ring will not turn. Set the others to match it.',
  t_group: 'Rings joined by a bridge all turn together.',
  chapters: ['Kilim', 'Tile', 'Marbling', 'Mosaic'],
  h_ring: 'ring', h_cw: 'steps clockwise', h_ccw: 'steps counter-clockwise',
  ringNames: ['Outer', '2nd', '3rd', '4th', 'Inner'], locked: 'This ring is locked', resetAsk: 'Erase progress? Tap again.',
  back: 'Back', loading: 'Preparing…',
};

export const STRINGS = { tr, en };
export type Strings = typeof tr;
export type StringKey = Exclude<keyof Strings, 'ringNames' | 'chapters'>;
