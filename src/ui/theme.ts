import { useAppStore, type Skin } from '@/state/appStore';

export type Theme = {
  face: string;
  hilight: string;
  shadow: string;
  dark: string;
  titleFrom: string;
  titleTo: string;
  titleText: string;
  text: string;
  cell: string;
  /** 帳票風の縞 */
  cellAlt: string;
  cellText: string;
  grid: string;
  select: string;
  selectText: string;
  hit: string;
  hitText: string;
  danger: string;
  progress: string;
  input: string;
  desktop: string;
  tooltip: string;
  tooltipText: string;
};

const standard: Theme = {
  face: '#C0C0C0',
  hilight: '#FFFFFF',
  shadow: '#808080',
  dark: '#000000',
  titleFrom: '#000080',
  titleTo: '#1084D0',
  titleText: '#FFFFFF',
  text: '#000000',
  cell: '#FFFFFF',
  cellAlt: '#FFFFFF',
  cellText: '#000000',
  grid: '#C0C0C0',
  select: '#000080',
  selectText: '#FFFFFF',
  hit: '#008080',
  hitText: '#FFFFFF',
  danger: '#800000',
  progress: '#000080',
  input: '#FFFFFF',
  desktop: '#008080',
  tooltip: '#FFFFE1',
  tooltipText: '#000080',
};

const terminal: Theme = {
  face: '#0B1A0B',
  hilight: '#2EAA2E',
  shadow: '#145214',
  dark: '#000000',
  titleFrom: '#0F3D0F',
  titleTo: '#1F7A1F',
  titleText: '#7CFF7C',
  text: '#33FF33',
  cell: '#000000',
  cellAlt: '#000000',
  cellText: '#33FF33',
  grid: '#0F3D0F',
  select: '#33FF33',
  selectText: '#000000',
  hit: '#FFB000',
  hitText: '#000000',
  danger: '#FF3333',
  progress: '#33FF33',
  input: '#000000',
  desktop: '#000000',
  tooltip: '#000000',
  tooltipText: '#33FF33',
};

const ledger: Theme = {
  ...standard,
  face: '#D9DCCF',
  titleFrom: '#2F4F2F',
  titleTo: '#6B9A6B',
  cell: '#FFFFFF',
  cellAlt: '#DDEFD8',
  grid: '#B8CBB0',
  select: '#2F4F2F',
  hit: '#B35C00',
  progress: '#2F4F2F',
  desktop: '#5B7F5B',
};

export const THEMES: Record<Skin, Theme> = { standard, terminal, ledger, english: standard };

export const FONT = 'DotGothic16_400Regular';

/** 返金などで Pro を失ったら標準に戻す */
export function useSkin(): Skin {
  return useAppStore((s) => (s.entitlements.pro ? s.settings.skin : 'standard'));
}

export function useTheme(): Theme {
  return THEMES[useSkin()];
}

const ja = {
  menu: ['ファイル(F)', '編集(E)', '表示(V)', '挿入(I)', '書式(O)'],
  pause: '一時停止',
  resume: '再開',
  home: 'ホームへ',
  boss: 'ボス画面',
  endPractice: '練習を終了',
  autosave: '自動保存',
  sum: '合計',
  count: 'データの個数',
  recalculating: '再計算中…',
  amount: '計上額',
  sheets: ['Sheet1', '集計', '前年比'],
  done: '処理が完了しました。',
  thisAmount: '今回の計上額',
  matched: '照合',
  items: '件',
  bestUpdated: '自己ベスト更新',
  best: '自己ベスト',
  ok: 'OK',
  retry: '再実行',
  ranking: '実績照会',
  practiceNote: '（練習扱い・ランキング対象外）',
  hint: 'ヒント',
};
type Labels = typeof ja;

const en: Labels = {
  menu: ['File', 'Edit', 'View', 'Insert', 'Format'],
  pause: 'Pause',
  resume: 'Resume',
  home: 'Home',
  boss: 'Boss screen',
  endPractice: 'End practice',
  autosave: 'Autosave',
  sum: 'Sum',
  count: 'Count',
  recalculating: 'Recalculating…',
  amount: 'Total',
  sheets: ['Sheet1', 'Summary', 'YoY'],
  done: 'Process completed.',
  thisAmount: 'Amount posted',
  matched: 'Matched',
  items: '',
  bestUpdated: 'New personal best',
  best: 'Best',
  ok: 'OK',
  retry: 'Run again',
  ranking: 'Records',
  practiceNote: '(practice — not ranked)',
  hint: 'Hint',
};

export function useLabels(): Labels {
  return useSkin() === 'english' ? en : ja;
}
