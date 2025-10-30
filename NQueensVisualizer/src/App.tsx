import { useState, useRef } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import { solveNQueensStepwise, solveNQueensHCStepwise, conflicts } from './algorithms';

const ALGORITHMS = [
  { key: 'backtracking', name: 'Backtracking' },
  { key: 'hillclimbing', name: 'Hill Climbing' }
];

// Dummy örnek adımlar: N=4 için vezir yerleşimini simüle eden data (anahtar fonksiyona kadar)
const dummySteps: Array<Array<[number, number]>> = [
  [],
  [[0, 1]],
  [[0, 1], [1, 3]],
  [[0, 1], [1, 3], [2, 0]],
  [[0, 1], [1, 3], [2, 0], [3, 2]], // çözüm
];

function App() {
  const [n, setN] = useState(8);
  const [algo, setAlgo] = useState('backtracking');
  // Adım adım vezir pozisyonları (şimdilik dummy)
  const [steps, setSteps] = useState(dummySteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<number | null>(null); // düzeltildi
  const [status, setStatus] = useState('Hazır');

  const onChangeN = (value: number) => {
    setN(value);
    setSteps([[]]);
    setCurrentStep(0);
    setPlaying(false);
    setStatus('Hazır');
    if (playTimer.current) window.clearInterval(playTimer.current);
    playTimer.current = null;
  };

  // Oynat/durdur mantığı
  const handlePlay = () => {
    setPlaying(true);
    if (!playTimer.current) {
      playTimer.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setPlaying(false);
            if (playTimer.current) window.clearInterval(playTimer.current);
            playTimer.current = null;
            return prev;
          }
        });
      }, 750); // hız slider'ı ile ayarlanacak
    }
  };
  const handlePause = () => {
    setPlaying(false);
    if (playTimer.current) window.clearInterval(playTimer.current);
    playTimer.current = null;
  };
  const stepForward = () => {
    setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
  };
  const stepBack = () => {
    setCurrentStep(prev => (prev > 0 ? prev - 1 : 0));
  };

  const handleSolve = () => {
    setStatus('Çözülüyor...');
    let generatedSteps: Array<Array<[number, number]>> = [];
    if (algo === 'backtracking') {
      generatedSteps = solveNQueensStepwise(n);
    } else if (algo === 'hillclimbing') {
      generatedSteps = solveNQueensHCStepwise(n, { maxRestarts: 100, allowSideways: true, maxStepsPerRestart: 3000 });
    }
    setSteps(generatedSteps);
    setCurrentStep(0);
    setPlaying(false);
    if (playTimer.current) window.clearInterval(playTimer.current);
    playTimer.current = null;

    const last = generatedSteps[generatedSteps.length - 1] || [];
    const ok = last.length === n && conflicts(last) === 0;
    setStatus(ok ? 'Çözüm bulundu' : 'Çözüm bulunamadı (yerel maksimum)');
  };

  // Adım veya oynat modunda reset/hız yönetimi
  // ... existing code ...

  return (
    <div className="container">
      <h1>N-Queens Görsel ve Karşılaştırma Uygulaması</h1>

      {/* N Seçici ve Algoritma Butonları */}
      <div className="top-controls">
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

      {/* Satranç Tahtası Alanı */}
      <div className="board-panel">
        <ChessBoard n={n} queens={steps[currentStep]}/>
      </div>

      {/* Animasyon Kontrolleri */}
      <div className="anim-controls">
        <button onClick={stepBack} disabled={currentStep === 0}>⏮️ Adım Geri</button>
        <button onClick={handlePause} disabled={!playing}>⏸️ Durdur</button>
        <button onClick={handlePlay} disabled={playing || currentStep === steps.length - 1}>▶️ Oynat</button>
        <button onClick={stepForward} disabled={currentStep === steps.length - 1}>⏭️ Adım İleri</button>
        {/* Hız slider'ı ileride eklenecek */}
      </div>

      {/* Sonuç Paneli */}
      <div className="results-panel">
        <div className="metrics-placeholder">İstatistik & Grafik Alanı (Çalışma Zamanı, Adımlar, vs.) — Durum: {status}</div>
      </div>
    </div>
  );
}

export default App;
