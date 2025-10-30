import { useState, useRef, useEffect } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import Toast from './components/Toast';
import { solveNQueensStepwise, solveNQueensHCStepwise, conflicts, type SolveResult } from './algorithms';

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
          setMetrics(pendingMetrics);
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
        <ChessBoard n={n} queens={steps[currentStep]} />
      </div>
      <div className="anim-controls">
        <button onClick={stepBack} disabled={currentStep === 0}>⏮️ Adım Geri</button>
        <button onClick={handlePause} disabled={!playing}>⏸️ Durdur</button>
        <button onClick={handlePlay} disabled={playing || currentStep === steps.length - 1}>▶️ Oynat</button>
        <button onClick={stepForward} disabled={currentStep === steps.length - 1}>⏭️ Adım İleri</button>
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
      <div className="results-panel">
        <div className="metrics-placeholder">
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div><strong>Durum:</strong> {status}</div>
              {metrics && (
                <>
                  <div><strong>Algoritma süresi:</strong> {formatMs(metrics.runtimeMs)}</div>
                  
                  <div><strong>Adım sayısı:</strong> {metrics.stepsCount}</div>
                  {metrics.visitedStates !== undefined && <div><strong>Ziyaret edilen durum:</strong> {metrics.visitedStates}</div>}
                  {metrics.restarts !== undefined && <div><strong>Restart:</strong> {metrics.restarts}</div>}
                  {metrics.backtracks !== undefined && <div><strong>Backtrack:</strong> {metrics.backtracks}</div>}
                  {metrics.maxDepth !== undefined && <div><strong>Maks derinlik:</strong> {metrics.maxDepth}</div>}
                </>
              )}
            </div>
            <div>
              <div><strong>Çatışma Trendi</strong></div>
              <Trend data={metrics?.conflictTrend || []} />
            </div>
          </div>
        </div>
      </div>
      <Toast show={toastShow} message={toastMsg} onClose={() => setToastShow(false)} />
    </div>
  );
}

export default App;
