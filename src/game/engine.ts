import { TARGET_SUM, type ComboSize } from './config';
import {
  applyGravity,
  clearRect,
  generateBoard,
  isValidRect,
  rectArea,
  rectCount,
  rectSum,
  type Board,
  type Move,
  type Rect,
} from './board';
import { mulberry32 } from './rng';
import { comboSize, scoreForCells } from './scoring';
import { hasMove } from './solver';

export type Combos = Record<ComboSize, number>;

export type GameState = {
  board: Board;
  rngState: number;
  score: number;
  combos: Combos;
};

export type CommitResult =
  | { ok: false }
  | {
      ok: true;
      state: GameState;
      points: number;
      /** 消去直後（落下前）の盤面 */
      cleared: Board;
      /** 落下後・作り直し前の盤面 */
      dropped: Board;
      moves: Move[];
      /** 詰みのため盤面を作り直した */
      regenerated: boolean;
    };

export const emptyCombos = (): Combos => ({ 2: 0, 3: 0, 4: 0, 5: 0 });

export function newGame(seed: number): GameState {
  const rng = mulberry32(seed);
  const board = generateBoard(rng);
  return { board, rngState: rng.state(), score: 0, combos: emptyCombos() };
}

export function commitRect(state: GameState, rect: Rect): CommitResult {
  if (!isValidRect(rect)) return { ok: false };
  if (rectCount(state.board, rect) < 2 || rectSum(state.board, rect) !== TARGET_SUM) return { ok: false };

  const rng = mulberry32(state.rngState);
  const cleared = clearRect(state.board, rect);
  const dropped = applyGravity(cleared, rng);
  const regenerated = !hasMove(dropped.board);
  const board = regenerated ? generateBoard(rng) : dropped.board;

  const area = rectArea(rect);
  const size = comboSize(area);
  const points = scoreForCells(area);
  return {
    ok: true,
    points,
    cleared,
    dropped: dropped.board,
    moves: dropped.moves,
    regenerated,
    state: {
      board,
      rngState: rng.state(),
      score: state.score + points,
      combos: { ...state.combos, [size]: state.combos[size] + 1 },
    },
  };
}
