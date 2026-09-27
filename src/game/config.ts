export const COLS = 8;
export const ROWS = 12;
export const TARGET_SUM = 10;

/** 1→9 の出現重み */
export const DIGIT_WEIGHTS = [16, 14, 12, 11, 10, 10, 9, 9, 9] as const;

/** マス数別の得点。5 は「5以上」 */
export const SCORE_BY_SIZE = { 2: 10, 3: 30, 4: 70, 5: 150 } as const;
export type ComboSize = keyof typeof SCORE_BY_SIZE;

export const TIME_LIMIT_SEC = 90;
export const DANGER_SEC = 10;

export const CLEAR_BLINK_MS = 200;
export const DROP_MS = 450;

/** 盤面作り直しの無限ループ防止 */
export const MAX_REGENERATE = 1000;

/** Game Center リーダーボードの上限と一致させる */
export const SCORE_MAX = 30000;

export const PRACTICE_HINT_LIMIT = 3;
export const HINT_BLINK_MS = 3000;

/** 画面が開いてからゲーム開始までのカウントダウン秒数 */
export const START_COUNTDOWN_SEC = 3;
