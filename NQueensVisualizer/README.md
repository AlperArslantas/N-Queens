## N-Queens Görsel ve Karşılaştırma Uygulaması

**Geliştirici: Alper Arslantaş**  
Canlı Demo: [n-queens-pp6e.vercel.app](https://n-queens-pp6e.vercel.app)

Bu proje, klasik **N-Queens** problemini iki farklı yaklaşımla (**Backtracking** ve **Hill Climbing**) çözüp, çözümleri **adım adım görselleştirmeyi** ve elde edilen metrikleri yan yana **karşılaştırmayı** amaçlayan bir web uygulamasıdır.

---

## Özellikler

- **İnteraktif satranç tahtası**
  - \(N \times N\) boyutlu tahta (N: 4–24 arası seçilebilir)
  - Vezirlerin yerleşimini adım adım izleyebilme
  - Son oynanan hamlenin hücresini kısa süreli vurgulama

- **İki farklı algoritma**
  - **Backtracking**
    - Sistematik arama
    - Backtrack sayısı, maksimum derinlik, ziyaret edilen durum sayısı gibi metrikler
  - **Hill Climbing (Steepest Ascent)**
    - Rastgele başlangıç + en dik yokuş tırmanışı
    - Restart sayısı, ziyaret edilen durum sayısı
    - Başarı durumu ve başarısızlık nedeni (`plateau`, `cycle`, `stuck`)

- **Adım adım animasyon**
  - Oynat / Durdur / Adım Geri / Adım İleri / Animasyonu Bitir
  - Ayarlanabilir hız (slider ile 1–20 arası)

- **Kalıcı metrikler**
  - Her algoritmanın **son koşusuna ait** metrikler `localStorage`’da saklanır
  - Uygulamayı yenilesen bile son çalışmanın sonuçlarını görebilirsin
  - “Tüm Kayıtlı Sonuçları Temizle” butonu ile temizleme

- **Açıklayıcı bilgi sayfaları**
  - Backtracking ve Hill Climbing için ayrı bilgi sayfaları (kavramsal açıklama + kullanım alanları)

---

## Kullanılan Teknolojiler

- **Frontend**
  - [React](https://react.dev/) (TypeScript ile)
  - [React Router](https://reactrouter.com/) (bilgi sayfaları ve ana uygulama için yönlendirme)
  - [Vite](https://vitejs.dev/) (geliştirme ve build aracı)

- **Dil ve araçlar**
  - **TypeScript**
  - **ESLint** (Temel kod kalitesi kontrolü)
  - Tarayıcı tarafında **`performance.now()`** ile basit süre ölçümü
  - **localStorage** ile kalıcı metrik saklama

- **Deploy**
  - [Vercel](https://vercel.com/) üzerinde barındırma  
    Canlı: [https://n-queens-pp6e.vercel.app](https://n-queens-pp6e.vercel.app)

---

## Projeyi Çalıştırma

### Gerekli Önkoşullar

- Node.js 18+ (veya Vite ile uyumlu güncel bir sürüm)
- npm (veya tercih edersen yarn/pnpm)

### Kurulum

git clone https://github.com/AlperArslantas/N-Queens.git
cd N-Queens/NQueensVisualizer
npm install
### Geliştirme Sunucusu

npm run dev Tarayıcıdan şu adrese git:

http://localhost:5173
### Production Build

npm run build Oluşan statik dosyalar `dist/` klasöründe yer alır.  
İstersen `npm run preview` komutuyla lokal production önizlemesi yapabilirsin.

---

## Algoritma Tasarımı

### 1. Backtracking – `solveNQueensStepwise`

- Dosya: `src/algorithms.ts`
- Fonksiyon: `solveNQueensStepwise(n: number): SolveResult`

**Temel fikir:**

- Satır satır ilerleyen, rekürsif bir fonksiyon (`backtrack(row)`).
- Her satırda, tüm sütunlar denenir.
- Aynı sütunda veya çaprazda vezir varsa o sütun atlanır.
- Geçerli bir hamle yapıldığında:
  - Vezir tahtaya eklenir,
  - Sütun ve çapraz dizileri güncellenir,
  - Mevcut durum `steps` dizisine kopyalanır.
- Sonraki satırlarda çözüm yoksa:
  - Vezir kaldırılır,
  - Sütun/çaprazlar geri alınır,
  - `backtracks` sayacı artırılır,
  - Bu geri dönüş durumu da `steps`’e eklenir.

**Metrikler:**

- `runtimeMs` – Toplam çalışma süresi
- `stepsCount` ve `visitedStates` – Üretilen adım sayısı
- `backtracks` – Kaç kez geri dönüş yapıldığını gösterir
- `maxDepth` – Arama sırasında ulaşılan maksimum satır derinliği

### 2. Hill Climbing – `solveNQueensHCStepwise`

- Dosya: `src/algorithms.ts`
- Fonksiyon: `solveNQueensHCStepwise(n: number, options?: HcOptions): SolveResult`

**Temel fikir:**

- `randomInitial` ile her sütunda bir vezir olacak şekilde rastgele başlangıç yapılır.
- Her adımda:
  - Tüm komşu durumlar üretilir (her veziri aynı sütunda farklı satıra kaydırmak).
  - Her komşu için `conflicts` fonksiyonuyla çatışma sayısı hesaplanır.
  - Çatışma sayısı en düşük olan (ve gerekiyorsa `allowSideways` ile eşit olan) komşu seçilir.
- En iyi komşu da mevcut durumla aynı çatışma sayısına sahipse:
  - Plato üzerinde **yan adımlar** sayılır (`sidewaysCount`).
  - Bu sayı `sidewaysLimit`’i aşarsa `failureReason = 'plateau'`.
- Hiç daha iyi veya eşit komşu bulunamazsa:
  - `failureReason = 'stuck'`.
- Önceki state’ler `serialize` + `Set` ile takip edilir:
  - Aynı state’e geri gelinirse `failureReason = 'cycle'`.

**Restart mantığı:**

- Tek bir tırmanış `steepestAscentOnce` içinde yapılır.
- Dışarıda `for (r = 0; r <= maxRestarts; r++)` döngüsü ile:
  - Çözüm bulunana kadar veya restart limiti dolana kadar yeniden başlangıç yapılır.
  - Her restart arası `steps` dizisine boş bir adım eklenerek ayrım yapılır.

**Metrikler:**

- `steps` – Tüm adımlar (restart ayraçları ile birlikte)
- `runtimeMs` – Toplam süre
- `visitedStates` – Değerlendirilen komşu sayısı
- `conflictTrend` – Her adımda çatışma sayısı (grafik için)
- `restarts` – Kaç kez yeniden başlatıldığı
- `failureReason` – Başarısızlık