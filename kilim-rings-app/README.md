# Kilim Rings (Expo / iOS)

Tek parmakla oynanan halka döndürme bulmacası. 120 seviye, 4 bölüm (Kilim → Çini → Ebru → Mozaik).
Zamanlayıcı yok, can yok, reklam yok, hesap yok, internet gerekmez.

Stack: Expo SDK 58, React Native 0.88, TypeScript, `react-native-svg`, `expo-audio`, `expo-haptics`, AsyncStorage.

## Çalıştırma

```bash
npm install
npx expo start          # telefonda Expo Go ile aç (QR) veya `i` ile iOS simülatör (macOS)
npx expo start --web    # tarayıcıda hızlı kontrol
npm run typecheck       # tsc --noEmit
npm test                # motor testleri (aşağıya bak)
```

## Yapı

```
src/engine/levels.ts    Saf oyun mantığı: seviye üretimi, BFS çözücü, ipucu, yıldız (UI bağımsız)
src/engine/geometry.ts  Halka/dilim geometrisi, desen şekilleri
src/components/Board.tsx  Sürükleme (PanResponder) + halka animasyonları
src/screens/            Home, Map, Game, Settings
src/feedback.ts         Ses (expo-audio) ve titreşim (expo-haptics)
assets/sfx/*.wav        Üretilmiş küçük efektler
tests/parity.ts         Motor testi
docs/                   Gizlilik politikası, mağaza metni
RELEASE.md              iOS yayın adımları
```

## Seviye sistemi

- 24 pano × 5 seviye. Pano tanımları `PANOS` dizisinde (halka sayısı, dilim sayısı, renk sayısı, köprü grubu boyutu, kilit).
- Bölümler: **Kilim** (simetrik motif, ikili köprü) → **Çini** (iki renk + vurgu, üçlü köprü) → **Ebru** (renk geçişi, üçlü/dörtlü) → **Mozaik** (düzensiz desen, kilit + büyük gruplar).
- Köprü grubu: gruptaki halkalardan birini çevirince hepsi (işaretli yönde) birlikte döner.
- Seviyeler deterministik (mulberry32, tohum = seviye indeksi). Her seviye çok kaynaklı BFS ile çözülür: `par` en kısa çözümdür, ipucu hep optimal hamleyi verir.
- Yıldız: ≤ par → 3, ≤ par+2 → 2, aksi 1.

## Testler

`npm test` şunları doğrular: (1) ilk 60 seviye PWA sürümüyle birebir aynı (tohum, başlangıç, par, mesafe tablosu), (2) 120 seviyenin hepsi ipucuları takip ederek tam `par` hamlede çözülüyor.
`tests/pwa-game.js` PWA sürümünün kopyasıdır, yalnızca bu karşılaştırma için tutuluyor.
