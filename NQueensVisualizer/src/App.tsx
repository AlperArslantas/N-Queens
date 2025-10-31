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
  const [metrics, setMetrics] = useState<{ [k: string]: any } | null>(null);
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

  const Trend: React.FC<{ data: number[] }> = ({ data }) => {
    if (!data || data.length === 0) return <span>—</span>;
    const w = 180, h = 48;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const norm = (v: number) => max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
    const points = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${norm(v)}`).join(' ');
    return (
      <svg width={w} height={h} style={{ background: '#f5f5f5', borderRadius: 6 }}>
        <polyline fill="none" stroke="#1e293b" strokeWidth={2} points={points} />
      </svg>
    );
  };

  return (
    <div className="container">
      <nav style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
        <Link to="/">Uygulama</Link>
        <Link to="/info/backtracking">Backtracking Bilgi</Link>
        <Link to="/info/hillclimbing">Hill Climbing Bilgi</Link>
      </nav>
      <Routes>
        <Route path="/" element={
          <>
            <h1>N-Queens Görsel ve Karşılaştırma Uygulaması</h1>
            <div className="top-controls">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <label>
                  Tahta Boyutu (N):
                  <input
                    type="number"
                    min={4}
                    max={24}
                    value={n}
                    onChange={e => onChangeN(Number(e.target.value))}
                    style={{ width: 52, marginLeft: 8 }}
                  />
                </label>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button onClick={decN} disabled={n <= 4}>−</button>
                  <button onClick={incN} disabled={n >= 24}>+</button>
                </div>
              </div>
              <div className="algo-buttons">
                {ALGORITHMS.map(a => (
                  <button
                    key={a.key}
                    className={algo === a.key ? 'selected' : ''}
                    onClick={() => setAlgo(a.key)}
                  >
                    {a.name} ile Çöz
                  </button>
                ))}
                <button onClick={handleSolve} style={{ marginLeft: 12 }}>
                  Seçili Yöntemle Çöz
                </button>
              </div>
              <div className="algo-indicator">Seçili: <strong>{algo === 'backtracking' ? 'Backtracking' : 'Hill Climbing'}</strong></div>
            </div>
            <div className="board-panel">
              <ChessBoard n={n} queens={steps[currentStep]} highlight={highlight} />
            </div>
            <div className="anim-controls">
              <button onClick={stepBack} disabled={currentStep === 0}>⏮️ Adım Geri</button>
              <button onClick={handlePause} disabled={!playing}>⏸️ Durdur</button>
              <button onClick={handlePlay} disabled={playing || currentStep === steps.length - 1}>▶️ Oynat</button>
              <button onClick={stepForward} disabled={currentStep === steps.length - 1}>⏭️ Adım İleri</button>
              <button onClick={finishNow} disabled={steps.length === 0 || currentStep === steps.length - 1} style={{ marginLeft: 6 }}>⏩ Animasyonu Bitir</button>
              <label style={{ marginLeft: 16 }}>
                Hız: {speed}
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={speed}
                  onChange={e => handleSpeedChange(Number(e.target.value))}
                  style={{ width: 140, marginLeft: 8 }}
                />
              </label>
            </div>
            {/* Üstteki metrik paneli kaldırıldı */}

            {/* Kalıcı Tablolardan önce Reset */}
            <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={resetAll}>Reset</button>
            </div>

            {/* Kalıcı Tablolar */}
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h3>Backtracking Son Koşu</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
              <div>
                <h3>Hill Climbing Son Koşu</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
            </div>
            <Toast show={toastShow} message={toastMsg} onClose={() => setToastShow(false)} />
          </>
        } />
        <Route path="/info/backtracking" element={<BacktrackingInfo />} />
        <Route path="/info/hillclimbing" element={<HillClimbingInfo />} />
      </Routes>
    </div>
  );
}

export default App;
