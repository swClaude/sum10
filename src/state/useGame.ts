import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CLEAR_BLINK_MS,
  DANGER_SEC,
  DROP_MS,
  HINT_BLINK_MS,
  PRACTICE_HINT_LIMIT,
  START_COUNTDOWN_SEC,
  TARGET_SUM,
  TIME_LIMIT_SEC,
} from '@/game/config';
import { normalizeRect, rectCount, rectSum, type Board, type Cell, type Rect } from '@/game/board';
import { commitRect, newGame, type GameState } from '@/game/engine';
import { dailySeed, jstDateKey, randomSeed } from '@/game/rng';
import { findTenRect } from '@/game/solver';
import { haptic } from '@/services/haptics';
import type { DropAnim } from '@/ui/Grid';
import { useAppStore, useUiStore, type GameMode } from './appStore';

export type Phase = 'playing' | 'over';

export type GameResult = {
  score: number;
  combos: GameState['combos'];
  newBest: boolean;
  official: boolean;
};

const DROP_ANIM_MS = DROP_MS - 70; // 着地の沈み込み 60ms を含めて DROP_MS に収める

/** 新しいセッションを組み立てる。初回表示と再実行の両方で使い、固定盤面が一瞬映るのを避ける */
function buildSession(mode: GameMode) {
  const now = new Date();
  const dateKey = jstDateKey(now);
  const played = useAppStore.getState().dailyPlayed[dateKey] !== undefined;
  const official = mode === 'timeattack' || (mode === 'daily' && !played);
  const game = newGame(mode === 'daily' ? dailySeed(now) : randomSeed());
  return { game, dateKey, official };
}

export function useGame(mode: GameMode) {
  const initial = useState(() => buildSession(mode))[0];
  const [official, setOfficial] = useState(initial.official);
  const [game, setGame] = useState<GameState>(initial.game);
  const [display, setDisplay] = useState<Board>(initial.game.board);
  const [phase, setPhase] = useState<Phase>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [countdown, setCountdown] = useState<number | null>(START_COUNTDOWN_SEC);
  const [start, setStart] = useState<Cell | null>(null);
  const [end, setEnd] = useState<Cell | null>(null);
  const [blinkOn, setBlinkOn] = useState(false);
  const [drop, setDrop] = useState<DropAnim | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [menuPaused, setMenuPaused] = useState(false);
  const [hint, setHint] = useState<Rect | null>(null);
  const [hintOn, setHintOn] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(PRACTICE_HINT_LIMIT);
  const [lastPoints, setLastPoints] = useState<{ id: number; points: number; rect: Rect } | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  const bossVisible = useUiStore((s) => s.bossVisible);
  const counting = countdown !== null;
  const paused = menuPaused || bossVisible || counting;

  const lock = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dateKeyRef = useRef(initial.dateKey);
  const officialRef = useRef(initial.official);
  const lastHitRef = useRef(false);

  const timed = mode !== 'practice';

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const start_ = useCallback(() => {
    clearTimers();
    const { game: g, dateKey, official: isOfficial } = buildSession(mode);
    dateKeyRef.current = dateKey;
    officialRef.current = isOfficial;
    lock.current = false;
    setOfficial(isOfficial);
    setGame(g);
    setDisplay(g.board);
    setPhase('playing');
    setTimeLeft(TIME_LIMIT_SEC);
    setCountdown(START_COUNTDOWN_SEC);
    setStart(null);
    setEnd(null);
    setBlinkOn(false);
    setDrop(null);
    setRecalculating(false);
    setMenuPaused(false);
    setHint(null);
    setHintsLeft(PRACTICE_HINT_LIMIT);
    setResult(null);
  }, [mode]);

  // アンマウント時のタイマー掃除のみ（初回の盤面は useState の遅延初期化で作成済み）
  useEffect(() => clearTimers, []);

  // 開始前カウントダウン: 3→2→1→null（このタイミングでゲーム開始）
  useEffect(() => {
    if (countdown === null) return;
    const id = setTimeout(() => setCountdown((c) => (c !== null && c > 1 ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const finish = useCallback(() => {
    if (phaseRef.current === 'over') return;
    phaseRef.current = 'over';
    setPhase('over');
    setStart(null);
    setEnd(null);
    const g = gameRef.current;
    const { newBest } = useAppStore.getState().recordPlay({
      mode,
      score: g.score,
      combos: g.combos,
      dateKey: dateKeyRef.current,
      official: officialRef.current,
    });
    setResult({ score: g.score, combos: g.combos, newBest, official: officialRef.current && mode !== 'practice' });
  }, [mode]);

  // タイマー: 実時間の差分で減らす（setInterval の遅延に影響されない）
  useEffect(() => {
    if (!timed || phase !== 'playing' || paused) return;
    let last = Date.now();
    let lastSec = Math.ceil(timeLeft);
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - dt);
        const sec = Math.ceil(next);
        if (sec !== lastSec) {
          lastSec = sec;
          if (sec > 0 && sec <= DANGER_SEC) haptic.tick();
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
    // timeLeft は開始時点の値だけ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, phase, paused]);

  useEffect(() => {
    if (timed && phase === 'playing' && timeLeft <= 0) finish();
  }, [timed, phase, timeLeft, finish]);

  // ヒント点滅
  useEffect(() => {
    if (!hint) return;
    const id = setInterval(() => setHintOn((v) => !v), 250);
    const off = setTimeout(() => {
      setHint(null);
      setHintOn(false);
    }, HINT_BLINK_MS);
    return () => {
      clearInterval(id);
      clearTimeout(off);
    };
  }, [hint]);

  const canInput = () => phaseRef.current === 'playing' && !lock.current && !paused;

  const selection = start && end ? normalizeRect(start, end) : null;
  const selSum = selection ? rectSum(display, selection) : 0;
  const selCount = selection ? rectCount(display, selection) : 0;
  const selectionHit = selSum === TARGET_SUM && selCount >= 2;

  const onStart = useCallback(
    (c: Cell) => {
      if (!canInput()) return;
      lastHitRef.current = false;
      setStart(c);
      setEnd(c);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paused],
  );

  const onMove = useCallback((c: Cell) => {
    setEnd((prev) => {
      if (!prev || (prev.row === c.row && prev.col === c.col)) return prev;
      haptic.selection();
      return c;
    });
  }, []);

  // 合計10になった瞬間の触覚
  useEffect(() => {
    if (selectionHit && !lastHitRef.current) haptic.hit();
    lastHitRef.current = selectionHit;
  }, [selectionHit]);

  const onCancel = useCallback(() => {
    setStart(null);
    setEnd(null);
  }, []);

  const endRef = useRef({ start, end });
  endRef.current = { start, end };

  const onEnd = useCallback(() => {
    const { start: s, end: e } = endRef.current;
    setStart(null);
    setEnd(null);
    if (!s || !e || !canInput()) return;
    if (timed && phaseRef.current !== 'playing') return;
    const rect = normalizeRect(s, e);
    const res = commitRect(gameRef.current, rect);
    if (!res.ok) return;

    haptic.clear();
    lock.current = true;
    gameRef.current = res.state;
    setGame(res.state);
    setLastPoints({ id: Date.now(), points: res.points, rect });
    setHint(null);

    // 消去: 2フレーム点滅 → 落下 → (詰みなら) 作り直し
    setDisplay(res.cleared);
    setBlinkOn(true);
    later(() => setBlinkOn(false), CLEAR_BLINK_MS / 2);
    later(() => {
      const dist = Array<number>(res.cleared.length).fill(0);
      for (const m of res.moves) dist[m.index] = m.toRow - m.fromRow;
      setDrop({ id: Date.now(), dist, durationMs: DROP_ANIM_MS });
      setDisplay(res.dropped);
      if (res.regenerated) setRecalculating(true);
      later(() => {
        setDisplay(res.state.board);
        setDrop(null);
        setRecalculating(false);
        lock.current = false;
      }, DROP_MS);
    }, CLEAR_BLINK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, timed]);

  const showHint = useCallback(() => {
    const r = findTenRect(gameRef.current.board);
    if (!r) return;
    setHintsLeft((n) => n - 1);
    setHint(r);
  }, []);

  return {
    mode,
    official,
    game,
    display,
    phase,
    timeLeft,
    timed,
    countdown,
    selection,
    selSum,
    selCount,
    selectionHit,
    blinkOn,
    drop,
    recalculating,
    paused,
    menuPaused,
    setMenuPaused,
    hint,
    hintOn,
    hintsLeft,
    showHint,
    lastPoints,
    result,
    finish,
    restart: start_,
    onStart,
    onMove,
    onEnd,
    onCancel,
  };
}
