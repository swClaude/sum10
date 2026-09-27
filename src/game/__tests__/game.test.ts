import { COLS, ROWS, SCORE_BY_SIZE } from '../config';
import {
  applyGravity,
  clearRect,
  generateBoard,
  idx,
  isValidRect,
  normalizeRect,
  rectArea,
  rectContains,
  rectCount,
  rectSum,
} from '../board';
import { commitRect, emptyCombos, newGame } from '../engine';
import { dailySeed, jstDateKey, mulberry32, randomDigit, randomSeed, type Rng } from '../rng';
import { comboSize, formatClock, formatYen, scoreForCells } from '../scoring';
import { findTenRect, hasMove } from '../solver';

const constRng = (v: number): Rng => ({ next: () => v, state: () => 0 });
const boardOf = (fill: number, overrides: Record<number, number> = {}) => {
  const b = Array<number>(ROWS * COLS).fill(fill);
  for (const [k, v] of Object.entries(overrides)) b[Number(k)] = v;
  return b;
};

describe('rng', () => {
  test('同じシードは同じ列', () => {
    const a = mulberry32(20260927);
    const b = mulberry32(20260927);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  test('state から再開すると続きが一致', () => {
    const a = mulberry32(1);
    a.next();
    const b = mulberry32(a.state());
    expect(b.next()).toBe(a.next());
  });

  test('randomDigit は 1..9、重みの偏りあり', () => {
    const rng = mulberry32(42);
    const counts = Array(10).fill(0);
    for (let i = 0; i < 20000; i++) counts[randomDigit(rng)]++;
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBeGreaterThan(counts[9]);
  });

  test('randomDigit の境界', () => {
    expect(randomDigit(constRng(0))).toBe(1);
    expect(randomDigit(constRng(1))).toBe(9);
  });

  test('JST日付: 23:59→0:00 JST で切り替わる（端末TZ非依存）', () => {
    expect(jstDateKey(new Date('2026-09-27T14:59:59Z'))).toBe('20260927');
    expect(jstDateKey(new Date('2026-09-27T15:00:00Z'))).toBe('20260928');
    expect(dailySeed(new Date('2026-12-31T15:00:00Z'))).toBe(20270101);
  });

  test('randomSeed は uint32', () => {
    const s = randomSeed();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThan(2 ** 32);
  });
});

describe('board', () => {
  test('normalizeRect: 逆方向ドラッグ', () => {
    expect(normalizeRect({ row: 5, col: 3 }, { row: 2, col: 1 })).toEqual({ r0: 2, c0: 1, r1: 5, c1: 3 });
  });

  test('rect helpers', () => {
    const r = { r0: 1, c0: 1, r1: 2, c1: 3 };
    expect(rectArea(r)).toBe(6);
    expect(rectContains(r, 2, 3)).toBe(true);
    expect(rectContains(r, 0, 3)).toBe(false);
    expect(isValidRect(r)).toBe(true);
    expect(isValidRect({ r0: 0, c0: 0, r1: ROWS, c1: 0 })).toBe(false);
    expect(isValidRect({ r0: 2, c0: 0, r1: 1, c1: 0 })).toBe(false);
  });

  test('rectSum / rectCount は空セルを数えない', () => {
    const b = boardOf(1, { [idx(0, 0)]: 0, [idx(0, 1)]: 5 });
    const r = { r0: 0, c0: 0, r1: 0, c1: 2 };
    expect(rectSum(b, r)).toBe(6);
    expect(rectCount(b, r)).toBe(2);
  });

  test('同じシードで同じ盤面', () => {
    expect(generateBoard(mulberry32(7))).toEqual(generateBoard(mulberry32(7)));
    expect(generateBoard(mulberry32(7))).not.toEqual(generateBoard(mulberry32(8)));
  });

  test('解が無い盤面しか作れない場合は例外', () => {
    expect(() => generateBoard(constRng(0.9999))).toThrow();
  });

  test('落下と補充', () => {
    // 列0: 上から 1..12
    const b = boardOf(9);
    for (let r = 0; r < ROWS; r++) b[idx(r, 0)] = r + 1;
    const cleared = clearRect(b, { r0: 10, c0: 0, r1: 11, c1: 0 });
    expect(cleared[idx(10, 0)]).toBe(0);

    const { board, moves } = applyGravity(cleared, constRng(0));
    // 1..10 が2段落ちて下に詰まる
    for (let r = 0; r < 10; r++) expect(board[idx(r + 2, 0)]).toBe(r + 1);
    // 上端2マスは補充（constRng(0) → 1）
    expect(board[idx(0, 0)]).toBe(1);
    expect(board[idx(1, 0)]).toBe(1);
    // 他の列は動かない
    expect(board[idx(5, 1)]).toBe(9);
    expect(moves).toHaveLength(12);
    expect(moves).toContainEqual({ index: idx(11, 0), fromRow: 9, toRow: 11 });
    expect(moves).toContainEqual({ index: idx(0, 0), fromRow: -2, toRow: 0 });
    expect(moves).toContainEqual({ index: idx(1, 0), fromRow: -1, toRow: 1 });
  });

  test('補充順は列A→H・下から上（デイリー再現性）', () => {
    const b = boardOf(9, { [idx(0, 0)]: 0, [idx(0, 1)]: 0, [idx(1, 1)]: 0 });
    const values = [0, 0.2, 0.35];
    let n = 0;
    const seq: Rng = { next: () => values[n++]!, state: () => 0 };
    const { board } = applyGravity(b, seq);
    // 列0に1つ目、列1の下から2つ目,3つ目
    expect([board[idx(0, 0)], board[idx(1, 1)], board[idx(0, 1)]]).toEqual([1, 2, 3]);
  });
});

describe('solver', () => {
  test('解なし', () => {
    expect(hasMove(boardOf(9))).toBe(false);
    expect(findTenRect(boardOf(9))).toBeNull();
  });

  test('横・縦・長方形の解を見つける', () => {
    expect(findTenRect(boardOf(9, { [idx(3, 3)]: 1, [idx(3, 4)]: 9 }))).not.toBeNull();
    const r = findTenRect(boardOf(9, { [idx(5, 2)]: 1, [idx(6, 2)]: 9 }));
    expect(r && rectSum(boardOf(9, { [idx(5, 2)]: 1, [idx(6, 2)]: 9 }), r)).toBe(10);
    const b = boardOf(9, { [idx(0, 0)]: 2, [idx(0, 1)]: 3, [idx(1, 0)]: 1, [idx(1, 1)]: 4 });
    const q = findTenRect(b)!;
    expect(rectSum(b, q)).toBe(10);
  });
});

describe('scoring', () => {
  test('マス数別の得点', () => {
    expect(scoreForCells(1)).toBe(0);
    expect(scoreForCells(2)).toBe(SCORE_BY_SIZE[2]);
    expect(scoreForCells(3)).toBe(30);
    expect(scoreForCells(4)).toBe(70);
    expect(scoreForCells(5)).toBe(150);
    expect(scoreForCells(12)).toBe(150);
    expect(comboSize(9)).toBe(5);
  });

  test('表示形式', () => {
    expect(formatYen(1230)).toBe('¥1,230');
    expect(formatYen(0)).toBe('¥0');
    expect(formatYen(-5)).toBe('¥0');
    expect(formatYen(1234567)).toBe('¥1,234,567');
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(9.2)).toBe('0:10');
    expect(formatClock(-1)).toBe('0:00');
  });
});

describe('engine', () => {
  test('newGame は決定的', () => {
    expect(newGame(20260927)).toEqual(newGame(20260927));
    expect(newGame(1).combos).toEqual(emptyCombos());
  });

  test('合計10でない／1マス／範囲外は無効', () => {
    const g = { ...newGame(1), board: boardOf(9, { [idx(0, 0)]: 1 }) };
    expect(commitRect(g, { r0: 0, c0: 0, r1: 0, c1: 0 }).ok).toBe(false);
    expect(commitRect(g, { r0: 0, c0: 1, r1: 0, c1: 2 }).ok).toBe(false);
    expect(commitRect(g, { r0: -1, c0: 0, r1: 0, c1: 1 }).ok).toBe(false);
  });

  test('消去で得点・コンボ加算、盤面は常に満杯で解あり', () => {
    const base = newGame(3);
    const g = { ...base, board: boardOf(1, { [idx(11, 0)]: 5, [idx(11, 1)]: 5 }) };
    const res = commitRect(g, { r0: 11, c0: 0, r1: 11, c1: 1 });
    if (!res.ok) throw new Error('expected ok');
    expect(res.points).toBe(10);
    expect(res.state.score).toBe(10);
    expect(res.state.combos[2]).toBe(1);
    expect(res.cleared[idx(11, 0)]).toBe(0);
    expect(res.state.board.every((v) => v >= 1 && v <= 9)).toBe(true);
    expect(hasMove(res.state.board)).toBe(true);
    expect(res.state.rngState).not.toBe(g.rngState);
  });

  test('同じ操作列なら同じ結果（デイリー再現性）', () => {
    const play = () => {
      let s = newGame(20260927);
      for (let i = 0; i < 20; i++) {
        const r = findTenRect(s.board)!;
        const res = commitRect(s, r);
        if (!res.ok) throw new Error('unreachable');
        s = res.state;
      }
      return s;
    };
    expect(play()).toEqual(play());
  });

  test('詰み時は作り直す', () => {
    // 落下後に解が無くなる盤面: 全部9、消すのは下段の 1+9
    const g = { ...newGame(1), rngState: 0, board: boardOf(9, { [idx(11, 0)]: 1 }) };
    // 補充が 9 になる rng 状態を探す
    let seed = 0;
    for (; seed < 100000; seed++) {
      const rng = mulberry32(seed);
      if (randomDigit(rng) === 9 && randomDigit(rng) === 9) break;
    }
    const res = commitRect({ ...g, rngState: seed }, { r0: 11, c0: 0, r1: 11, c1: 1 });
    if (!res.ok) throw new Error('expected ok');
    expect(hasMove(res.dropped)).toBe(false);
    expect(res.regenerated).toBe(true);
    expect(hasMove(res.state.board)).toBe(true);
  });
});
