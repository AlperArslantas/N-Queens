import React from 'react';

const BacktrackingInfo: React.FC = () => {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2>Backtracking (Geri İzleme) Algoritması</h2>
      <p>
        Backtracking, kısıtlı arama problemlerinde kullanılan, adım adım karar verip
        uygun olmayan dalları erken budayan bir derinlik öncelikli arama tekniğidir.
        N-Queens probleminde her satıra bir vezir yerleştirir, çatışma (aynı sütun veya
        çapraz) oluşursa o seçim geri alınarak (backtrack) alternatif konum denenir.
      </p>
      <h3>Temel Fikir</h3>
      <ul>
        <li>Satır satır ilerle, her satırda güvenli bir sütun seç.</li>
        <li>Güvensiz (çatışmalı) konumlara asla girme (erken budama).</li>
        <li>Hiçbir sütun güvenli değilse bir önceki satıra dön ve başka sütun dene.</li>
      </ul>
      <h3>Karmaşıklık</h3>
      <p>
        Kötü durumda üstsel zamana yaklaşabilir; pratikte güçlü budama (sütun ve diyagonallerin
        hızlı kontrolü) ile verimli çalışır. Bizim uygulamada sütun ve iki diyagonal için
        boolean/bitset benzeri yapılarla kontrol O(1) zamanda yapılır.
      </p>
      <h3>Toplanan Metrikler</h3>
      <ul>
        <li>Adım sayısı ve ziyaret edilen durum</li>
        <li>Backtrack sayısı</li>
        <li>Maksimum derinlik</li>
        <li>Algoritma çalışma süresi</li>
      </ul>
    </div>
  );
};

export default BacktrackingInfo;
