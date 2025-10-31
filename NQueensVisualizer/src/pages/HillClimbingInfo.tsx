import React from 'react';

const HillClimbingInfo: React.FC = () => {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2>Hill Climbing (Yokuş Tırmanma) Algoritması</h2>
      <p>
        Hill Climbing, sezgisel bir yerel arama yöntemidir. Mevcut durumun komşuları
        değerlendirilir ve çatışma (heuristic) değerini azaltan en iyi komşuya geçilir.
        N-Queens için her sütundaki veziri aynı sütunda başka satıra taşıyarak komşular
        oluşturulur; çatışma sayısı (aynı satır veya diyagonal) heuristiktir.
      </p>
      <h3>Varyant ve Tuzaklar</h3>
      <ul>
        <li>Steepest-ascent: Tüm komşular değerlendirilir, en iyi komşu seçilir.</li>
        <li>Sideways moves: Eşit değerde kalmaya izin verilebilir (plato kaçışı için sınırlı).</li>
        <li>Random restarts: Yerel minimumdan çıkmak için rastgele başlangıçlarla yeniden deneme.</li>
      </ul>
      <h3>Karşılaşılabilecek Durumlar</h3>
      <ul>
        <li>Yerel minimum / plato: İyileşen komşu yoksa durur veya restart yapılır.</li>
        <li>Çevrim: Aynı yerleşimlere tekrar düşme; pencereyle tespit edip durduruyoruz.</li>
      </ul>
      <h3>Toplanan Metrikler</h3>
      <ul>
        <li>Ziyaret edilen durum (değerlendirilen komşuların toplamı)</li>
        <li>Restart sayısı ve başarı</li>
        <li>Çatışma trendi</li>
        <li>Algoritma çalışma süresi</li>
      </ul>
    </div>
  );
};

export default HillClimbingInfo;
