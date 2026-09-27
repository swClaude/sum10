import { COLS, ROWS, TARGET_SUM } from './config';
import type { Board, Rect } from './board';

/** 合計がちょうど10になる長方形を探す。無ければ null（値は0以上なので伸ばして超えたら打ち切れる） */
export function findTenRect(board: Board): Rect | null {
  for (let r0 = 0; r0 < ROWS; r0++)
    for (let c0 = 0; c0 < COLS; c0++)
      for (let r1 = r0; r1 < ROWS; r1++) {
        let sum = 0;
        for (let c1 = c0; c1 < COLS; c1++) {
          for (let r = r0; r <= r1; r++) sum += board[r * COLS + c1]!;
          if (sum > TARGET_SUM) break;
          if (sum === TARGET_SUM) return { r0, c0, r1, c1 };
        }
      }
  return null;
}

export function hasMove(board: Board): boolean {
  return findTenRect(board) !== null;
}
