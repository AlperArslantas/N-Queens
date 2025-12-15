// Tahtadaki tek bir vezirin konumunu [satır, sütun] şeklinde tutuyorum.
export type QueenPosition = [number, number];

// Bir adımda tahtadaki tüm vezirlerin konumu.
export type Step = QueenPosition[];

// Her koşu sonunda topladığım metrik bilgileri.
export interface Metrics {
  runtimeMs: number;
  stepsCount: number;
  visitedStates?: number;
  conflictTrend: number[];
  success: boolean;
  restarts?: number;
  backtracks?: number;
  maxDepth?: number;
  failureReason?: 'plateau' | 'cycle' | 'stuck';
}

export interface SolveResult {
  steps: Step[];
  metrics: Metrics;
}

// N-Queens problemini klasik backtracking ile çözen fonksiyon.
// Adım adım tüm ara konumları da döndürüyorum ki UI tarafında animasyonlu gösterebileyim.
export function solveNQueensStepwise(n: number): SolveResult {
  const t0 = performance.now();
  const steps: Step[] = [];
  const queens: QueenPosition[] = [];
  // Sütun ve iki farklı çapraz için "dolu mu?" bilgisini boolean dizilerle tutuyorum.
  const columns = Array(n).fill(false);
  const diag1 = Array(2 * n - 1).fill(false);
  const diag2 = Array(2 * n - 1).fill(false);
  let backtracks = 0;
  let maxDepth = 0;

  // Her satır için sırayla vezir yerleştiren rekürsif fonksiyon.
  function backtrack(row: number): boolean {
    maxDepth = Math.max(maxDepth, row);
    // Tüm satırlara vezir yerleştirdiysem çözümü bulmuşum demektir.
    if (row === n) {
      steps.push([...queens]);
      return true;
    }
    // Bu satır için tüm sütunları tek tek deniyorum.
    for (let col = 0; col < n; col++) {
      // Aynı sütunda veya aynı çaprazlarda bir taş varsa bu sütunu atlıyorum.
      if (columns[col] || diag1[row + col] || diag2[row - col + n - 1]) continue;
      queens.push([row, col]);
      columns[col] = diag1[row + col] = diag2[row - col + n - 1] = true;
      // Her yerleştirmeyi steps'e kaydedip görselleştirmeye hazır hale getiriyorum.
      steps.push([...queens]);
      if (backtrack(row + 1)) return true;
      // Aşağıdaki satırlarda çözüm yoksa geri dönüp (backtrack) taşı kaldırıyorum.
      queens.pop();
      columns[col] = diag1[row + col] = diag2[row - col + n - 1] = false;
      backtracks++;
      steps.push([...queens]);
    }
    return false;
  }
  const solved = backtrack(0);
  const t1 = performance.now();

  return {
    steps,
    metrics: {
      runtimeMs: t1 - t0,
      stepsCount: steps.length,
      visitedStates: steps.length,
      conflictTrend: [],
      success: solved,
      restarts: 0,
      backtracks,
      maxDepth,
    },
  };
}

// Hill Climbing algoritması için dışarıdan oynayabildiğim parametreler.
export interface HcOptions {
  maxRestarts?: number;
  allowSideways?: boolean;
  maxStepsPerRestart?: number;
  sidewaysLimit?: number; // eşit çatışmalı adımlara izin sayısı
  cycleWindow?: number; // tekrar döngü tespiti için pencere
}

// Hill Climbing'e rastgele ama "her sütunda bir vezir" olacak şekilde başlangıç konumu üretiyorum.
function randomInitial(n: number): QueenPosition[] {
  const q: QueenPosition[] = [];
  for (let col = 0; col < n; col++) {
    const row = Math.floor(Math.random() * n);
    q.push([row, col]);
  }
  return q;
}

// Verilen yerleşimde, birbirini tehdit eden vezir çiftlerinin sayısını hesaplıyorum.
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

// N-Queens'i Hill Climbing (steepest ascent) yaklaşımıyla çözen fonksiyon.
// Burada da tüm ara adımları saklayıp görselleştirmeye uygun bir sonuç döndürüyorum.
export function solveNQueensHCStepwise(n: number, options: HcOptions = {}): SolveResult {
  const { maxRestarts = 50, allowSideways = true, maxStepsPerRestart = 2000, sidewaysLimit = 200, cycleWindow = 100 } = options;
  const t0 = performance.now();
  const steps: Step[] = [];
  const trend: number[] = [];
  let restarts = 0;
  let visitedStates = 0;
  let failureReason: Metrics['failureReason'];

  // Board'u string'e çevirip küçük bir temsil üretiyorum.
  // Bunu cycle (aynı state'e geri dönme) tespitinde kullanıyorum.
  function serialize(queens: QueenPosition[]): string {
    // Sütun sırası garanti: [row0,row1,...]
    return queens.map(q => q[0]).join(',');
  }

  // Tek bir "restart" için en dik yokuş tırmanışını yapan fonksiyon.
  function steepestAscentOnce(): { solved: boolean } {
    // Rastgele bir başlangıç yerleşimi ile başlıyorum.
    let current = randomInitial(n);
    steps.push([...current]);
    let currentConf = conflicts(current);
    trend.push(currentConf);

    let stepsCount = 0;
    let sidewaysCount = 0;
    // Yakın geçmişte gördüğüm state'leri burada tutarak cycle yakalamaya çalışıyorum.
    const recent = new Set<string>();

    while (currentConf > 0 && stepsCount < maxStepsPerRestart) {
      // Bir adım daha attım.
      stepsCount++;
      let best = current;
      let bestConf = currentConf;
      let moved = false;

      // Her sütundaki veziri, o satırdaki diğer olası pozisyonlara kaydırarak
      // tüm komşu durumları tarıyorum.
      for (let col = 0; col < n; col++) {
        const originalRow = current[col][0];
        for (let row = 0; row < n; row++) {
          if (row === originalRow) continue;
          // Şu anki yerleşimi kopyalayıp tek bir veziri başka satıra taşıyorum.
          const neighbor = current.slice();
          neighbor[col] = [row, col];
          const conf = conflicts(neighbor);
          visitedStates++;
          if (conf < bestConf || (allowSideways && conf === bestConf)) {
            best = neighbor;
            bestConf = conf;
            moved = true;
          }
        }
      }

      // Hiçbir komşuya geçemediysem tamamen sıkışmışım demektir.
      if (!moved) { failureReason = 'stuck'; break; }

      // Daha iyi bir yer bulamadım ama eşit çatışmalı komşuya geçiyorsam
      // plato üzerinde "yan adımlar" atıyorum.
      if (bestConf === currentConf) {
        sidewaysCount++;
        if (sidewaysCount > sidewaysLimit) { failureReason = 'plateau'; break; }
      } else {
        sidewaysCount = 0;
      }

      // Aynı yerleşime tekrar geliyorsam cycle yakalamış oluyorum.
      const key = serialize(best);
      if (recent.has(key)) { failureReason = 'cycle'; break; }
      recent.add(key);
      if (recent.size > cycleWindow) {
        // Pencereyi kaydırmak için, en basitinden set'i temizleyip tekrar başlatıyorum.
        recent.clear();
        recent.add(key);
      }

      current = best;
      currentConf = bestConf;
      steps.push([...current]);
      trend.push(currentConf);
    }

    return { solved: currentConf === 0 };
  }

  let solved = false;
  for (let r = 0; r <= maxRestarts; r++) {
    const res = steepestAscentOnce();
    if (res.solved) { solved = true; failureReason = undefined; break; }
    restarts++;
    steps.push([]);
  }

  const t1 = performance.now();

  return {
    steps,
    metrics: {
      runtimeMs: t1 - t0,
      stepsCount: steps.length,
      visitedStates,
      conflictTrend: trend,
      success: solved,
      restarts,
      backtracks: 0,
      maxDepth: 0,
      failureReason,
    },
  };
}
