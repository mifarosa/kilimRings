# iOS'a yayınlama (EAS ile, Mac gerekmez)

Bu oturumda Apple hesabına, Expo hesabına ve gerçek bir iPhone'a erişim yok. Kod, ikon, ekran görüntüleri ve yapılandırma hazır; aşağıdaki adımları kendi hesaplarınla yapman gerekiyor.

## Önkoşullar

1. **Apple Developer Program** üyeliği (yıllık 99 USD). Onay birkaç gün sürebilir; hemen başla.
2. Ücretsiz **Expo hesabı** (expo.dev).
3. Bilgisayarında Node 20+ ve `npm i -g eas-cli`.

## Adımlar

```bash
cd kilim-rings-app
npm install
eas login
eas init                      # app.json'a projectId yazar
```

1. **Bundle ID:** `app.json` içinde `ios.bundleIdentifier` şu an `com.mifarosa.kilimrings`. Beğenmediysen şimdi değiştir (yayınlandıktan sonra değişmez).
2. **App Store Connect'te uygulama kaydı oluştur** (appstoreconnect.apple.com → Apps → +): ad "Kilim Rings", dil, bundle ID, SKU. Ad doluysa bu aşamada hata verir; `docs/STORE_LISTING.md` içindeki alternatifi kullan.
3. **Build al:**
   ```bash
   eas build -p ios --profile production
   ```
   İlk seferde Apple ID ile giriş ister; sertifika ve provisioning profile'ı EAS otomatik üretir. Build bulutta yapılır (~15-30 dk, ücretsiz planda sıra bekleyebilir).
4. **TestFlight'a gönder:**
   ```bash
   eas submit -p ios --latest
   ```
   App Store Connect'in istediği ASC App ID'yi (kayıtlı uygulamanın sayısal ID'si) sorar.
5. **Gerçek iPhone'da test et** (TestFlight uygulaması üzerinden). Aşağıdaki "Gerçek cihazda bakılacaklar" listesini kontrol et.
6. **App Store Connect'te mağaza sayfasını doldur:**
   - Metinler: `docs/STORE_LISTING.md`
   - Ekran görüntüleri: `store-screenshots/` (6.9" iPhone, 1290×2796; diğer boyutları Apple bunlardan türetir)
   - Gizlilik politikası URL'si: `docs/privacy.html` dosyasını sitende yayınla, `CONTACT_EMAIL` yerine e-postanı yaz
   - App Privacy: "Data Not Collected"
   - Yaş: 4+
   - Export compliance: `ITSAppUsesNonExemptEncryption=false` zaten ayarlı, soru çıkmaz
7. Build'i sürüme bağla, **Submit for Review**. İnceleme genellikle 1-2 gün.

## Gerçek cihazda bakılacaklar (burada test edilemedi)

Web build'inde (Chromium) uçtan uca test geçti; iOS'a özgü şunlar gerçek iPhone'da doğrulanmalı:

- **Sürükleme hissi:** `Board.tsx` içindeki PanResponder. Halka dışına parmak kayarsa, hızlı döndürmede takılma var mı?
- **Ses:** `expo-audio` ile küçük efektler. Sessiz modda çalmaması beklenen davranış (`playsInSilentMode: false`).
- **Titreşim:** `expo-haptics` (iPhone'larda çalışır, iPad/simülatörde yok).
- **Seviye açılış süresi:** 6 halkalı seviyelerde çözücü (BFS) cihazda birkaç yüz ms sürebilir; "Hazırlanıyor…" ekranı görünür. Çok yavaşsa seviye tablolarını önceden hesaplayıp dosyaya gömebiliriz.
- **Küçük ekranlar** (iPhone SE) ve çentikli ekranlarda yerleşim.
- **Zorluk dengesi:** Çini/Ebru/Mozaik bölümlerinde köprü grupları halkaları birbirine bağladığı için "hedef hamle" kilim bölümünden düşük çıkabilir; zorluk hamle sayısından çok bağlantıyı çözmekten geliyor. Gerçek oynayarak ayarlanmalı (`PANOS` dizisi).

## Güncelleme yayınlamak

`app.json` içindeki `version` değerini artır (1.0.1 …). `buildNumber`'ı EAS `autoIncrement` ile kendisi artırır. Sonra `eas build` + `eas submit`.
