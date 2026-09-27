import { DIGIT_WEIGHTS } from './config';

export type Rng = {
  /** [0, 1) */
  next(): number;
  /** 内部状態。mulberry32(state()) で続きから再開できる */
  state(): number;
};

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state: () => a,
  };
}

const WEIGHT_TOTAL = DIGIT_WEIGHTS.reduce((s, w) => s + w, 0);

export function randomDigit(rng: Rng): number {
  let x = rng.next() * WEIGHT_TOTAL;
  for (let i = 0; i < DIGIT_WEIGHTS.length; i++) {
    x -= DIGIT_WEIGHTS[i]!;
    if (x < 0) return i + 1;
  }
  return DIGIT_WEIGHTS.length;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JSTの日付キー "YYYYMMDD"（端末のタイムゾーンに依存しない） */
export function jstDateKey(date: Date): string {
  const d = new Date(date.getTime() + JST_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function dailySeed(date: Date): number {
  return Number(jstDateKey(date));
}

let seedCounter = 0;

/**
 * 時刻・Math.random・呼び出し回数を混ぜる。
 * 同じミリ秒に連続で呼んでも（Math.random の偏りに関わらず）同じ値を返さないようにする。
 */
export function randomSeed(): number {
  seedCounter = (seedCounter + 1) >>> 0;
  const t = Date.now() >>> 0;
  const r = Math.floor(Math.random() * 4294967296) >>> 0;
  return (t ^ r ^ Math.imul(seedCounter, 0x9e3779b9)) >>> 0;
}
