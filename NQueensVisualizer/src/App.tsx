import { useState, useRef, useEffect } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import Toast from './components/Toast';
import { solveNQueensStepwise, solveNQueensHCStepwise, conflicts, type SolveResult } from './algorithms';
import { Routes, Route, Link } from 'react-router-dom';
import BacktrackingInfo from './pages/BacktrackingInfo';
import HillClimbingInfo from './pages/HillClimbingInfo';

const ALGORITHMS = [
  { key: 'backtracking', name: 'Backtracking' },
  { key: 'hillclimbing', name: 'Hill Climbing' }
];

const dummySteps: Array<Array<[number, number]>> = [
  [],
  [[0, 1]],
  [[0, 1], [1, 3]],
  [[0, 1], [1, 3], [2, 0]],
  [[0, 1], [1, 3], [2, 0], [3, 2]],
];

function App() {
  const [n, setN] = useState(8);
  const [algo, setAlgo] = useState('backtracking');
  const [steps, setSteps] = useState(dummySteps);
  const [, setMetrics] = useState<{ [k: string]: any } | null>(null);
  const [pendingMetrics, setPendingMetrics] = useState<{ [k: string]: any } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(8);
  const playTimer = useRef<number | null>(null);
  const [status, setStatus] = useState('Hazır');
  const solvedNotifiedRef = useRef(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const playStartRef = useRef<number | null>(null);
  const [playDurationMs, setPlayDurationMs] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<{ row: number; col: number } | null>(null);

  const storageKeys = {
    bt: 'nq_metrics_bt',
    hc: 'nq_metrics_hc',
  } as const;

  const loadStored = () => {
    try {
      const bt = localStorage.getItem(storageKeys.bt);
      const hc = localStorage.getItem(storageKeys.hc);
      return {
        bt: bt ? JSON.parse(bt) : null,
        hc: hc ? JSON.parse(hc) : null,
      } as { bt: any | null; hc: any | null };
    } catch {
      return { bt: null, hc: null };
    }
  };

  const [storedBT, setStoredBT] = useState<any | null>(() => loadStored().bt);
  const [storedHC, setStoredHC] = useState<any | null>(() => loadStored().hc);

  const saveStored = (alg: 'bt' | 'hc', data: any | null) => {
    if (data == null) {
      localStorage.removeItem(storageKeys[alg]);
    } else {
      localStorage.setItem(storageKeys[alg], JSON.stringify(data));
    }
    const loaded = loadStored();
    setStoredBT(loaded.bt);
    setStoredHC(loaded.hc);
  };

  const resetAll = () => {
    saveStored('bt', null);
    saveStored('hc', null);
    setMetrics(null);
    setPendingMetrics(null);
    setSteps([[]]);
    setCurrentStep(0);
    setStatus('Hazır');
    setToastShow(false);
  };

  const formatMs = (ms: number | null | undefined) => {
    if (ms == null) return '—';
    if (ms > 0 && ms < 1) return '<1 ms';
    return ms.toFixed ? `${ms.toFixed(4)} ms` : `${ms} ms`;
  };

  const computeDelay = (s: number) => {
    const clamped = Math.min(20, Math.max(1, s));
    const ms = Math.max(50, 1000 - (clamped - 1) * 50);
    return ms;
  };

  const resetTimer = () => {
    if (playTimer.current) window.clearInterval(playTimer.current);
    playTimer.current = null;
  };

  const isSolved = (st: Array<Array<[number, number]>>, size: number) => {
    const last = st[st.length - 1] || [];
    return last.length === size && conflicts(last) === 0;
  };

  const onChangeN = (value: number) => {
    const bounded = Math.max(4, Math.min(24, value));
    setN(bounded);
    setSteps([[]]);
    setMetrics(null);
    setPendingMetrics(null);
    setCurrentStep(0);
    setPlaying(false);
    setStatus('Hazır');
    solvedNotifiedRef.current = false;
    setToastShow(false);
    setPlayDurationMs(null);
    resetTimer();
  };

  const handleSolve = () => {
    setStatus('Çözülüyor...');
    let res: SolveResult;
    if (algo === 'backtracking') {
      res = solveNQueensStepwise(n);
    } else {
      res = solveNQueensHCStepwise(n, { maxRestarts: 100, allowSideways: true, maxStepsPerRestart: 3000 });
    }
    setSteps(res.steps);
    setMetrics(null);
    setPendingMetrics(res.metrics);
    setCurrentStep(0);
    setPlaying(false);
    solvedNotifiedRef.current = false;
    setToastShow(false);
    setPlayDurationMs(null);
    resetTimer();

    setStatus('Hazır');
  };

  const handlePlay = () => {
    if (playing) return;
    setPlaying(true);
    playStartRef.current = performance.now();
    if (!playTimer.current) {
      playTimer.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setPlaying(false);
            resetTimer();
            return prev;
          }
        });
      }, computeDelay(speed));
    }
  };

  const handlePause = () => {
    setPlaying(false);
    resetTimer();
  };

  const stepForward = () => {
    setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
  };

  const stepBack = () => {
    setCurrentStep(prev => (prev > 0 ? prev - 1 : 0));
  };

  const finishNow = () => {
    if (steps.length === 0) return;
    const lastIndex = steps.length - 1;
    setPlaying(false);
    resetTimer();
    setCurrentStep(lastIndex);

    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      const ok = isSolved(steps, n);
      if (pendingMetrics) {
        const enriched = { ...pendingMetrics, n, algo, timestamp: Date.now() };
        setMetrics(enriched);
        if (algo === 'backtracking') saveStored('bt', enriched); else saveStored('hc', enriched);
      }
      if (ok) {
        setToastMsg('Çözüm tamamlandı.');
      } else {
        const reason = (pendingMetrics as any)?.failureReason;
        let msg = 'Çözüm bulunamadı';
        if (reason === 'plateau') msg += ' (plato)';
        else if (reason === 'cycle') msg += ' (çevrim)';
        else if (reason === 'stuck') msg += ' (sıkışma)';
        setToastMsg(msg + '.');
      }
      setPendingMetrics(null);
      setToastShow(true);
    }
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    if (playing) {
      resetTimer();
      playTimer.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setPlaying(false);
            resetTimer();
            return prev;
          }
        });
      }, computeDelay(val));
    }
  };

  useEffect(() => {
    if (steps.length === 0) return;
    const atEnd = currentStep === steps.length - 1;
    if (playing && atEnd) {
      const ok = isSolved(steps, n);
      if (!solvedNotifiedRef.current) {
        solvedNotifiedRef.current = true;
        if (pendingMetrics) {
          const enriched = { ...pendingMetrics, n, algo, timestamp: Date.now() };
          setMetrics(enriched);
          if (algo === 'backtracking') saveStored('bt', enriched); else saveStored('hc', enriched);
        }
        if (ok) {
          setToastMsg('Çözüm tamamlandı.');
        } else {
          const reason = (pendingMetrics as any)?.failureReason;
          let msg = 'Çözüm bulunamadı';
          if (reason === 'plateau') msg += ' (plato)';
          else if (reason === 'cycle') msg += ' (çevrim)';
          else if (reason === 'stuck') msg += ' (sıkışma)';
          setToastMsg(msg + '.');
        }
        setPendingMetrics(null);
        setToastShow(true);
      }
    }
  }, [currentStep, steps, n, playing, pendingMetrics]);

  useEffect(() => {
    if (steps.length === 0) return;
    // Son değişen kareyi bul
    const prev = currentStep > 0 ? steps[currentStep - 1] : [];
    const curr = steps[currentStep] || [];
    const toKey = (p: [number, number]) => `${p[0]},${p[1]}`;
    const prevSet = new Set(prev.map(toKey));
    const currSet = new Set(curr.map(toKey));
    let changed: [number, number] | null = null;
    for (const p of curr) { if (!prevSet.has(toKey(p))) { changed = p; break; } }
    if (!changed) { for (const p of prev) { if (!currSet.has(toKey(p))) { changed = p; break; } } }
    if (changed) {
      setHighlight({ row: changed[0], col: changed[1] });
      const t = window.setTimeout(() => setHighlight(null), 600);
      return () => window.clearTimeout(t);
    } else {
      setHighlight(null);
    }
  }, [currentStep, steps]);

  const decN = () => onChangeN(n - 1);
  const incN = () => onChangeN(n + 1);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">N-Queens Görsel ve Karşılaştırma Uygulaması</h1>
          <p className="app-subtitle">
            N-Queens problemini Backtracking ve Hill Climbing algoritmaları ile adım adım inceleyip,
            performanslarını karşılaştırın.
          </p>
        </div>
        <nav className="app-nav">
          <Link to="/" className="nav-link">
            Uygulama
          </Link>
          <Link to="/info/backtracking" className="nav-link">
            Backtracking Bilgi
          </Link>
          <Link to="/info/hillclimbing" className="nav-link">
            Hill Climbing Bilgi
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <div className="layout-main">
                <section className="board-section card">
                  <div className="board-header">
                    <div className="board-title-group">
                      <h2>Satranç Tahtası</h2>
                      <span className="status-pill">{status}</span>
                    </div>
                    <div className="board-meta">
                      <span>Adım: {currentStep + 1} / {steps.length}</span>
                      {playDurationMs != null && (
                        <span className="board-time">Süre: {formatMs(playDurationMs)}</span>
                      )}
                    </div>
                  </div>
                  <div className="board-panel">
                    <ChessBoard n={n} queens={steps[currentStep]} highlight={highlight} />
                  </div>
                  <div className="anim-controls">
                    <button onClick={stepBack} disabled={currentStep === 0}>
                      ⏮️ Adım Geri
                    </button>
                    <button onClick={handlePause} disabled={!playing}>
                      ⏸️ Durdur
                    </button>
                    <button onClick={handlePlay} disabled={playing || currentStep === steps.length - 1}>
                      ▶️ Oynat
                    </button>
                    <button onClick={stepForward} disabled={currentStep === steps.length - 1}>
                      ⏭️ Adım İleri
                    </button>
                    <button
                      onClick={finishNow}
                      disabled={steps.length === 0 || currentStep === steps.length - 1}
                      className="primary-ghost"
                    >
                      ⏩ Animasyonu Bitir
                    </button>
                    <label className="speed-control">
                      <span className="speed-label">Hız</span>
                      <span className="speed-value">{speed}</span>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={speed}
                        onChange={e => handleSpeedChange(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </section>

                <section className="controls-section card">
                  <h2>Kontroller</h2>
                  <div className="controls-grid">
                    <div className="control-block">
                      <label className="field-label">
                        Tahta Boyutu (N)
                        <span className="field-hint">4 ile 24 arasında değer seçebilirsiniz.</span>
                      </label>
                      <div className="n-control">
                        <button onClick={decN} disabled={n <= 4}>
                          −
                        </button>
                        <input
                          type="number"
                          min={4}
                          max={24}
                          value={n}
                          onChange={e => onChangeN(Number(e.target.value))}
                        />
                        <button onClick={incN} disabled={n >= 24}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="control-block">
                      <span className="field-label">Algoritma Seçimi</span>
                      <div className="algo-buttons">
                        {ALGORITHMS.map(a => (
                          <button
                            key={a.key}
                            className={algo === a.key ? 'selected' : ''}
                            onClick={() => setAlgo(a.key)}
                          >
                            {a.name}
                          </button>
                        ))}
                      </div>
                      <p className="algo-indicator">
                        Seçili: <strong>{algo === 'backtracking' ? 'Backtracking' : 'Hill Climbing'}</strong>
                      </p>
                      <button onClick={handleSolve} className="primary-button full-width">
                        Seçili Yöntemle Çöz
                      </button>
                    </div>
                  </div>
                  <div className="controls-footer">
                    <button onClick={resetAll} className="ghost-button">
                      Tüm Kayıtlı Sonuçları Temizle
                    </button>
                  </div>
                </section>

                <section className="metrics-section">
                  <div className="metrics-card card">
                    <div className="metrics-header">
                      <h3>Backtracking Son Koşu</h3>
                    </div>
                    <table className="metrics-table">
                      <tbody>
                        <tr><td><strong>N</strong></td><td>{storedBT?.n ?? '—'}</td></tr>
                        <tr><td><strong>Süre</strong></td><td>{formatMs(storedBT?.runtimeMs)}</td></tr>
                        <tr><td><strong>Adım</strong></td><td>{storedBT?.stepsCount ?? '—'}</td></tr>
                        <tr><td><strong>Backtrack</strong></td><td>{storedBT?.backtracks ?? '—'}</td></tr>
                        <tr><td><strong>Maks derinlik</strong></td><td>{storedBT?.maxDepth ?? '—'}</td></tr>
                        <tr><td><strong>Ziyaret edilen durum</strong></td><td>{storedBT?.visitedStates ?? '—'}</td></tr>
                        <tr><td><strong>Tarih</strong></td><td>{storedBT?.timestamp ? new Date(storedBT.timestamp).toLocaleString() : '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="metrics-card card">
                    <div className="metrics-header">
                      <h3>Hill Climbing Son Koşu</h3>
                    </div>
                    <table className="metrics-table">
                      <tbody>
                        <tr><td><strong>N</strong></td><td>{storedHC?.n ?? '—'}</td></tr>
                        <tr><td><strong>Süre</strong></td><td>{formatMs(storedHC?.runtimeMs)}</td></tr>
                        <tr><td><strong>Adım</strong></td><td>{storedHC?.stepsCount ?? '—'}</td></tr>
                        <tr><td><strong>Ziyaret edilen durum</strong></td><td>{storedHC?.visitedStates ?? '—'}</td></tr>
                        <tr><td><strong>Restart</strong></td><td>{storedHC?.restarts ?? '—'}</td></tr>
                        <tr><td><strong>Başarı</strong></td><td>{storedHC?.success === true ? 'Evet' : storedHC?.success === false ? 'Hayır' : '—'}</td></tr>
                        <tr><td><strong>Neden</strong></td><td>{storedHC?.failureReason ?? '—'}</td></tr>
                        <tr><td><strong>Tarih</strong></td><td>{storedHC?.timestamp ? new Date(storedHC.timestamp).toLocaleString() : '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>
                <Toast show={toastShow} message={toastMsg} onClose={() => setToastShow(false)} />
              </div>
            }
          />
          <Route path="/info/backtracking" element={<BacktrackingInfo />} />
          <Route path="/info/hillclimbing" element={<HillClimbingInfo />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
