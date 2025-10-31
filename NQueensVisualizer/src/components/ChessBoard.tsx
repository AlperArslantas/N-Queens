import React from 'react';

interface ChessBoardProps {
  n: number;
  queens: Array<[number, number]>; // [satır, sütun]
  highlight?: { row: number; col: number } | null;
}

const CELL_SIZE = 36;
const BOARD_SIZE = (n: number) => CELL_SIZE * n;

const ChessBoard: React.FC<ChessBoardProps> = ({ n, queens, highlight }) => {
  const hx = highlight ? highlight.col * CELL_SIZE + CELL_SIZE / 2 : null;
  const hy = highlight ? highlight.row * CELL_SIZE + CELL_SIZE / 2 : null;

  return (
    <svg
      width={BOARD_SIZE(n)}
      height={BOARD_SIZE(n)}
      style={{
        background: 'var(--board-bg)',
        border: '2px solid var(--board-border)',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        margin: '16px auto',
        display: 'block'
      }}
    >
      {Array.from({ length: n * n }).map((_, idx) => {
        const row = Math.floor(idx / n);
        const col = idx % n;
        const isDark = (row + col) % 2 === 1;
        return (
          <rect
            key={idx}
            x={col * CELL_SIZE}
            y={row * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={isDark ? 'var(--board-dark)' : 'var(--board-light)'}
            stroke="var(--board-grid)"
            strokeWidth={0.6}
          />
        );
      })}

      {hx !== null && hy !== null && (
        <circle
          className="q-glow"
          cx={hx}
          cy={hy}
          r={CELL_SIZE * 0.6}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          opacity={0.9}
        />
      )}

      {queens.map(([row, col], i) => (
        <text
          key={i}
          x={col * CELL_SIZE + CELL_SIZE/2}
          y={row * CELL_SIZE + CELL_SIZE/2 + 6}
          fontSize={CELL_SIZE * 0.9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--queen-color)"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          ♛
        </text>
      ))}
    </svg>
  );
};

export default ChessBoard;
