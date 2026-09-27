import { COLS, MAX_REGENERATE, ROWS } from './config';
import { randomDigit, type Rng } from './rng';
import { hasMove } from './solver';

/** row-major, 長さ ROWS*COLS。0 は空セル */
export type Board = readonly number[];

export type Cell = { row: number; col: number };

/** 両端を含む。r0<=r1, c0<=c1 */
export type Rect = { r0: number; c0: number; r1: number; c1: number };

/** 落下・補充で値が入ったセル。fromRow<0 は画面外から補充 */
export type Move = { index: number; fromRow: number; toRow: number };

export const idx = (row: number, col: number) => row * COLS + col;

export function normalizeRect(a: Cell, b: Cell): Rect {
  return {
    r0: Math.min(a.row, b.row),
    c0: Math.min(a.col, b.col),
    r1: Math.max(a.row, b.row),
    c1: Math.max(a.col, b.col),
  };
}

export function rectArea(r: Rect): number {
  return (r.r1 - r.r0 + 1) * (r.c1 - r.c0 + 1);
}

export function rectContains(r: Rect, row: number, col: number): boolean {
  return row >= r.r0 && row <= r.r1 && col >= r.c0 && col <= r.c1;
}

export function isValidRect(r: Rect): boolean {
  return r.r0 >= 0 && r.c0 >= 0 && r.r1 < ROWS && r.c1 < COLS && r.r0 <= r.r1 && r.c0 <= r.c1;
}

export function rectSum(board: Board, r: Rect): number {
  let s = 0;
  for (let row = r.r0; row <= r.r1; row++)
    for (let col = r.c0; col <= r.c1; col++) s += board[idx(row, col)]!;
  return s;
}

export function rectCount(board: Board, r: Rect): number {
  let n = 0;
  for (let row = r.r0; row <= r.r1; row++)
    for (let col = r.c0; col <= r.c1; col++) if (board[idx(row, col)]! > 0) n++;
  return n;
}

export function fillBoard(rng: Rng): number[] {
  return Array.from({ length: ROWS * COLS }, () => randomDigit(rng));
}

/** 解が1つ以上ある盤面を生成（同じ rng から順に取り出す） */
export function generateBoard(rng: Rng): number[] {
  for (let i = 0; i < MAX_REGENERATE; i++) {
    const b = fillBoard(rng);
    if (hasMove(b)) return b;
  }
  throw new Error('generateBoard: no solvable board');
}

export function clearRect(board: Board, r: Rect): number[] {
  const next = board.slice();
  for (let row = r.r0; row <= r.r1; row++)
    for (let col = r.c0; col <= r.c1; col++) next[idx(row, col)] = 0;
  return next;
}

/**
 * 重力で詰め、上端の空きを補充する。
 * 補充順は列A→H、各列は下から上。デイリーの再現性のためこの順序を変えないこと。
 */
export function applyGravity(board: Board, rng: Rng): { board: number[]; moves: Move[] } {
  const next = board.slice();
  const moves: Move[] = [];
  for (let col = 0; col < COLS; col++) {
    let write = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      const v = board[idx(row, col)]!;
      if (v === 0) continue;
      next[idx(write, col)] = v;
      if (write !== row) moves.push({ index: idx(write, col), fromRow: row, toRow: write });
      write--;
    }
    const empties = write + 1;
    for (; write >= 0; write--) {
      next[idx(write, col)] = randomDigit(rng);
      moves.push({ index: idx(write, col), fromRow: write - empties, toRow: write });
    }
  }
  return { board: next, moves };
}
