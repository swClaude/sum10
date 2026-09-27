import * as GC from '../../modules/game-center';
import { SCORE_MAX } from '@/game/config';
import type { GameMode } from '@/state/appStore';
import { useAppStore } from '@/state/appStore';

export const LEADERBOARD = {
  daily: 'sum10.daily',
  timeattack: 'sum10.timeattack',
} as const;

let authed = false;

export async function initGameCenter(): Promise<void> {
  try {
    const r = await GC.authenticate();
    authed = r.isAuthenticated;
  } catch {
    authed = false;
  }
  if (authed) await flushPendingScores();
}

export function isGameCenterReady() {
  return authed;
}

/** 失敗したらキューへ。例外は投げない */
export async function reportScore(mode: GameMode, score: number): Promise<void> {
  if (mode === 'practice') return;
  const leaderboardIds = [LEADERBOARD[mode]];
  const clamped = Math.max(0, Math.min(SCORE_MAX, Math.floor(score)));
  try {
    if (!authed) throw new Error('not authenticated');
    await GC.submitScore(clamped, leaderboardIds);
  } catch {
    useAppStore.getState().enqueueScore({ score: clamped, leaderboardIds, at: Date.now() });
  }
}

export async function flushPendingScores(): Promise<void> {
  const { pendingScores, setPendingScores } = useAppStore.getState();
  if (!authed || pendingScores.length === 0) return;
  const failed = [];
  for (const p of pendingScores) {
    // 定期リセット型(daily)は期間を過ぎた送信が無意味だが、GameKit 側で無視されるので区別しない
    try {
      await GC.submitScore(p.score, p.leaderboardIds);
    } catch {
      failed.push(p);
    }
  }
  setPendingScores(failed);
}

export async function openLeaderboard(id?: string): Promise<boolean> {
  try {
    if (!authed) await initGameCenter();
    if (!authed) return false;
    await GC.showLeaderboard(id);
    return true;
  } catch {
    return false;
  }
}
