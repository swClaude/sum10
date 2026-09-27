import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Combos } from '@/game/engine';
import { emptyCombos } from '@/game/engine';
import { zustandStorage } from '@/services/storage';

export type Skin = 'standard' | 'terminal' | 'ledger' | 'english';
export type BossGesture = 'swipe2' | 'tap3';
export type BossTable = 'sales' | 'expense' | 'stock';
export type GameMode = 'daily' | 'timeattack' | 'practice';

export type Settings = {
  sound: boolean;
  haptics: boolean;
  bossGesture: BossGesture;
  skin: Skin;
  bossCompany: string;
  bossTable: BossTable;
};

export type PendingScore = { score: number; leaderboardIds: string[]; at: number };

export type Entitlements = { noAds: boolean; pro: boolean; supporter: boolean };

type Persisted = {
  bestTimeAttack: number;
  dailyPlayed: Record<string, number>;
  stats: { plays: number; combosBySize: Combos };
  settings: Settings;
  pendingScores: PendingScore[];
  playCountForAds: number;
  lastInterstitialAt: number;
  /** 結果画面を閉じた累計回数（ペイウォール自動表示判定） */
  resultsClosed: number;
  paywallAutoShown: boolean;
  attIntroDone: boolean;
  entitlements: Entitlements;
};

type Actions = {
  recordPlay(p: { mode: GameMode; score: number; combos: Combos; dateKey: string; official: boolean }): { newBest: boolean };
  updateSettings(patch: Partial<Settings>): void;
  enqueueScore(s: PendingScore): void;
  setPendingScores(s: PendingScore[]): void;
  setEntitlements(e: Entitlements): void;
  patch(p: Partial<Persisted>): void;
  resetData(): void;
};

export const defaultSettings: Settings = {
  sound: false,
  haptics: true,
  bossGesture: 'swipe2',
  skin: 'standard',
  bossCompany: '株式会社サンプル商事',
  bossTable: 'sales',
};

const initial = (): Persisted => ({
  bestTimeAttack: 0,
  dailyPlayed: {},
  stats: { plays: 0, combosBySize: emptyCombos() },
  settings: defaultSettings,
  pendingScores: [],
  playCountForAds: 0,
  lastInterstitialAt: 0,
  resultsClosed: 0,
  paywallAutoShown: false,
  attIntroDone: false,
  entitlements: { noAds: false, pro: false, supporter: false },
});

const addCombos = (a: Combos, b: Combos): Combos => ({ 2: a[2] + b[2], 3: a[3] + b[3], 4: a[4] + b[4], 5: a[5] + b[5] });

export const useAppStore = create<Persisted & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),
      recordPlay({ mode, score, combos, dateKey, official }) {
        const s = get();
        let newBest = false;
        const next: Partial<Persisted> = {
          stats: { plays: s.stats.plays + 1, combosBySize: addCombos(s.stats.combosBySize, combos) },
        };
        if (mode === 'timeattack' && score > s.bestTimeAttack) {
          next.bestTimeAttack = score;
          newBest = true;
        }
        if (mode === 'daily' && official) next.dailyPlayed = { ...s.dailyPlayed, [dateKey]: score };
        if (mode !== 'practice') next.playCountForAds = s.playCountForAds + 1;
        set(next);
        return { newBest };
      },
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      enqueueScore: (p) => set((s) => ({ pendingScores: [...s.pendingScores, p] })),
      setPendingScores: (pendingScores) => set({ pendingScores }),
      setEntitlements: (entitlements) => set({ entitlements }),
      patch: (p) => set(p),
      resetData: () =>
        set((s) => ({
          ...initial(),
          // 購入状態と ATT 済みはデータ初期化で消さない
          entitlements: s.entitlements,
          attIntroDone: s.attIntroDone,
        })),
    }),
    {
      name: 'sum10-app',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>;
        return { ...current, ...p, settings: { ...defaultSettings, ...p.settings } };
      },
    },
  ),
);

type UiState = {
  bossVisible: boolean;
  /** ゲーム画面が購読し、true の間はタイマーを止める */
  appPaused: boolean;
  setBoss(v: boolean): void;
  toggleBoss(): void;
  setAppPaused(v: boolean): void;
};

export const useUiStore = create<UiState>()((set) => ({
  bossVisible: false,
  appPaused: false,
  setBoss: (bossVisible) => set({ bossVisible }),
  toggleBoss: () => set((s) => ({ bossVisible: !s.bossVisible })),
  setAppPaused: (appPaused) => set({ appPaused }),
}));
