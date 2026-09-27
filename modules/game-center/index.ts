import { requireOptionalNativeModule } from 'expo';

export type AuthResult = { isAuthenticated: boolean; displayName?: string };

type GameCenterNative = {
  authenticate(): Promise<AuthResult>;
  submitScore(score: number, leaderboardIds: string[]): Promise<void>;
  showLeaderboard(leaderboardId?: string | null): Promise<void>;
};

/** iOS 以外（Android / Web / jest）では null */
const native = requireOptionalNativeModule<GameCenterNative>('GameCenter');

export const isAvailable = native !== null;

export async function authenticate(): Promise<AuthResult> {
  if (!native) return { isAuthenticated: false };
  return native.authenticate();
}

export async function submitScore(score: number, leaderboardIds: string[]): Promise<void> {
  if (!native) throw new Error('GameCenter unavailable');
  return native.submitScore(Math.floor(score), leaderboardIds);
}

export async function showLeaderboard(leaderboardId?: string): Promise<void> {
  if (!native) throw new Error('GameCenter unavailable');
  return native.showLeaderboard(leaderboardId ?? null);
}
