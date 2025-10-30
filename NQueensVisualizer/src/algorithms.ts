export type QueenPosition = [number, number];

// Her adımda satranç tahtasındaki vezirlerin dizilişi kaydedilecek
type Step = QueenPosition[];

/**
 * N-Queens Backtracking - Adım adım tüm hareketleri kaydeder
 * @param n Satranç tahtası ve vezir sayısı
 * @returns Step[] - her adımda vezirlerin yerini içerir
 */
export function solveNQueensStepwise(n: number): Step[] {
  const steps: Step[] = [];
  const queens: QueenPosition[] = [];
  const columns = Array(n).fill(false);
  const diag1 = Array(2 * n - 1).fill(false); // (row + col)
  const diag2 = Array(2 * n - 1).fill(false); // (row - col + n - 1)

  function backtrack(row: number) {
    if (row === n) {
      steps.push([...queens]); // Çözüm bulunduğunda kaydet
      return true;
    }
    for (let col = 0; col < n; col++) {
      if (columns[col] || diag1[row + col] || diag2[row - col + n - 1]) continue;
      queens.push([row, col]);
      columns[col] = diag1[row + col] = diag2[row - col + n - 1] = true;
      steps.push([...queens]); // Yerleştirme adımı
      if (backtrack(row + 1)) return true; // Tek çözüm
      // Geri al
      queens.pop();
      columns[col] = diag1[row + col] = diag2[row - col + n - 1] = false;
      steps.push([...queens]); // Kaldırma (backtrack) adımı
    }
    return false;
  }
  backtrack(0);
  return steps;
}

// Hill Climbing (Steepest-ascent) adım kaydı ile
export interface HcOptions {
  maxRestarts?: number; // random restarts
  allowSideways?: boolean; // şimdilik varsayılan false
  maxStepsPerRestart?: number; // güvenlik sınırı
}

function randomInitial(n: number): QueenPosition[] {
  // Her sütuna bir vezir, rastgele satır
  const q: QueenPosition[] = [];
  for (let col = 0; col < n; col++) {
    const row = Math.floor(Math.random() * n);
    q.push([row, col]);
  }
  return q;
}

export function conflicts(queens: QueenPosition[]): number {
  let c = 0;
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i];
      const [r2, c2] = queens[j];
      if (r1 === r2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) c++;
    }
  }
  return c;
}

export function solveNQueensHCStepwise(n: number, options: HcOptions = {}): Step[] {
  const { maxRestarts = 50, allowSideways = true, maxStepsPerRestart = 2000 } = options;
  const steps: Step[] = [];

  function steepestAscentOnce(): { solved: boolean } {
    let current = randomInitial(n);
    steps.push([...current]);

    let currentConf = conflicts(current);
    let stepsCount = 0;

    while (currentConf > 0 && stepsCount < maxStepsPerRestart) {
      stepsCount++;
      // Tüm komşuları değerlendir: her sütundaki veziri farklı satırlara taşı
      let best = current;
      let bestConf = currentConf;
      let moved = false;

      for (let col = 0; col < n; col++) {
        const originalRow = current[col][0];
        for (let row = 0; row < n; row++) {
          if (row === originalRow) continue;
          const neighbor = current.slice();
          neighbor[col] = [row, col];
          const conf = conflicts(neighbor);
          if (conf < bestConf || (allowSideways && conf === bestConf)) {
            best = neighbor;
            bestConf = conf;
            moved = true;
          }
        }
      }

      if (!moved) break;

      current = best;
      currentConf = bestConf;
      steps.push([...current]);
    }

    return { solved: currentConf === 0 };
  }

  for (let r = 0; r <= maxRestarts; r++) {
    const { solved } = steepestAscentOnce();
    if (solved) return steps; // çözüm adımları steps'e eklendi
    // restart
    // restart durumunu da adım olarak not etmek için boş snapshot ekleyebiliriz (opsiyonel)
    steps.push([]);
  }

  return steps; // çözüm bulunamadıysa üretilen adımlar yine gösterilebilir
}
