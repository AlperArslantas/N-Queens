import React from 'react';

interface ChessBoardProps {
  n: number;
  queens: Array<[number, number]>; // [satır, sütun]
}

const CELL_SIZE = 36;
const BOARD_SIZE = (n: number) => CELL_SIZE * n;

const ChessBoard: React.FC<ChessBoardProps> = ({ n, queens }) => {
  return (
    <svg
      width={BOARD_SIZE(n)}
      height={BOARD_SIZE(n)}
      style={{ background: '#eee', border: '2px solid #444', margin: '16px auto', display: 'block' }}
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
            fill={isDark ? '#92a7c7' : '#fff'}
            stroke="#888"
            strokeWidth={0.7}
          />
        );
      })}
      {queens.map(([row, col], i) => (
        <text
          key={i}
          x={col * CELL_SIZE + CELL_SIZE/2}
          y={row * CELL_SIZE + CELL_SIZE/2 + 6}
          fontSize={CELL_SIZE * 0.9}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          ♛
        </text>
      ))}
    </svg>
  );
};

export default ChessBoard;
