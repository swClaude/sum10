import { SCORE_BY_SIZE, type ComboSize } from './config';

export function comboSize(cells: number): ComboSize {
  return (cells >= 5 ? 5 : cells) as ComboSize;
}

export function scoreForCells(cells: number): number {
  if (cells < 2) return 0;
  return SCORE_BY_SIZE[comboSize(cells)];
}

export function formatYen(n: number): string {
  return '¥' + Math.max(0, Math.floor(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
