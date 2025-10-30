export type QueenPosition = [number, number];

export type Step = QueenPosition[];

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

export function solveNQueensStepwise(n: number): SolveResult {
  const t0 = performance.now();
  const steps: Step[] = [];
  const queens: QueenPosition[] = [];
  const columns = Array(n).fill(false);
  const diag1 = Array(2 * n - 1).fill(false);
  const diag2 = Array(2 * n - 1).fill(false);
  let backtracks = 0;
  let maxDepth = 0;

  function backtrack(row: number): boolean {
    maxDepth = Math.max(maxDepth, row);
    if (row === n) {
      steps.push([...queens]);
      return true;
    }
    for (let col = 0; col < n; col++) {
      if (columns[col] || diag1[row + col] || diag2[row - col + n - 1]) continue;
      queens.push([row, col]);
      columns[col] = diag1[row + col] = diag2[row - col + n - 1] = true;
      steps.push([...queens]);
      if (backtrack(row + 1)) return true;
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

export interface HcOptions {
  maxRestarts?: number;
  allowSideways?: boolean;
  maxStepsPerRestart?: number;
  sidewaysLimit?: number; // eşit çatışmalı adımlara izin sayısı
  cycleWindow?: number; // tekrar döngü tespiti için pencere
}

function randomInitial(n: number): QueenPosition[] {
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

export function solveNQueensHCStepwise(n: number, options: HcOptions = {}): SolveResult {
  const { maxRestarts = 50, allowSideways = true, maxStepsPerRestart = 2000, sidewaysLimit = 200, cycleWindow = 100 } = options;
  const t0 = performance.now();
  const steps: Step[] = [];
  const trend: number[] = [];
  let restarts = 0;
  let visitedStates = 0;
  let failureReason: Metrics['failureReason'];

  function serialize(queens: QueenPosition[]): string {
    // sütun sırası garanti: [row0,row1,...]
    return queens.map(q => q[0]).join(',');
  }

  function steepestAscentOnce(): { solved: boolean } {
    let current = randomInitial(n);
    steps.push([...current]);
    let currentConf = conflicts(current);
    trend.push(currentConf);

    let stepsCount = 0;
    let sidewaysCount = 0;
    const recent = new Set<string>();

    while (currentConf > 0 && stepsCount < maxStepsPerRestart) {
      stepsCount++;
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
          visitedStates++;
          if (conf < bestConf || (allowSideways && conf === bestConf)) {
            best = neighbor;
            bestConf = conf;
            moved = true;
          }
        }
      }

      if (!moved) { failureReason = 'stuck'; break; }

      if (bestConf === currentConf) {
        sidewaysCount++;
        if (sidewaysCount > sidewaysLimit) { failureReason = 'plateau'; break; }
      } else {
        sidewaysCount = 0;
      }

      const key = serialize(best);
      if (recent.has(key)) { failureReason = 'cycle'; break; }
      recent.add(key);
      if (recent.size > cycleWindow) {
        // pencereyi kaydırmak için ilk ekleneni temizlemek yerine basit reset
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
