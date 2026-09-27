import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { COLS, DANGER_SEC, TIME_LIMIT_SEC } from '@/game/config';
import type { Rect } from '@/game/board';
import { formatClock, formatYen } from '@/game/scoring';
import { Bevel, RText, Sunken } from './Retro';
import { COL_HEADER_H, ROW_HEADER_W } from './Grid';
import { useLabels, useTheme } from './theme';

const COL_NAMES = 'ABCDEFGH';
const cellName = (row: number, col: number) => `${COL_NAMES[col]}${row + 1}`;

export function FormulaBar({ selection, sum, hit }: { selection: Rect | null; sum: number; hit: boolean }) {
  const t = useTheme();
  const a = selection ? cellName(selection.r0, selection.c0) : 'A1';
  const b = selection ? cellName(selection.r1, selection.c1) : a;
  const formula = selection ? `=SUM(${a}${a === b ? '' : ':' + b})` : '';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 3 }}>
      <Sunken style={{ width: 60, height: 26, backgroundColor: t.input }}>
        <RText style={{ color: t.cellText }}>{a}</RText>
      </Sunken>
      <RText style={{ width: 16, textAlign: 'center' }}>=</RText>
      <Sunken style={{ flex: 1, height: 26, backgroundColor: t.input }}>
        <View style={{ flexDirection: 'row' }}>
          <RText numberOfLines={1} style={{ flex: 1, color: t.cellText }}>
            {formula}
          </RText>
          <RText style={{ minWidth: 28, textAlign: 'right', color: hit ? t.hit : t.cellText }}>{selection ? sum : ''}</RText>
        </View>
      </Sunken>
    </View>
  );
}

export function ProgressBar({ timeLeft }: { timeLeft: number }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const danger = timeLeft <= DANGER_SEC;
  const ratio = Math.max(0, Math.min(1, timeLeft / TIME_LIMIT_SEC));
  const blocks = Math.floor((w * ratio) / 10);
  return (
    <Sunken style={{ height: 14, backgroundColor: t.input }}>
      <View style={{ flexDirection: 'row', gap: 2, height: 8 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {Array.from({ length: blocks }, (_, i) => (
          <View key={i} style={{ width: 8, backgroundColor: danger ? t.danger : t.progress }} />
        ))}
      </View>
    </Sunken>
  );
}

type StatusProps = {
  timed: boolean;
  timeLeft: number;
  sum: number;
  count: number;
  recalculating: boolean;
  right?: React.ReactNode;
};

export function StatusPanel({ timed, timeLeft, sum, count, recalculating, right }: StatusProps) {
  const L = useLabels();
  return (
    <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
      <Sunken style={{ flex: 1, height: 22 }}>
        <RText style={{ fontSize: 12 }} numberOfLines={1}>
          {recalculating ? L.recalculating : timed ? `${L.autosave} ${formatClock(timeLeft)}` : `${L.autosave} --:--`}
        </RText>
      </Sunken>
      <Sunken style={{ height: 22 }}>
        <RText style={{ fontSize: 12 }} numberOfLines={1}>
          {`${L.sum}: ${sum}　${L.count}: ${count}`}
        </RText>
      </Sunken>
      {right}
    </View>
  );
}

export function SheetTabs({ score }: { score: number }) {
  const t = useTheme();
  const L = useLabels();
  return (
    <View style={{ flexDirection: 'row', marginTop: 3, alignItems: 'stretch' }}>
      {L.sheets.map((s, i) => (
        <Bevel key={s} style={{ backgroundColor: i === 0 ? t.input : t.face }} innerStyle={{ paddingHorizontal: 10, paddingVertical: 2 }}>
          <RText style={{ fontSize: 12, color: i === 0 ? t.cellText : t.text }}>{s}</RText>
        </Bevel>
      ))}
      <View style={{ flex: 1 }} />
      <Sunken style={{ paddingHorizontal: 4 }}>
        <RText style={{ fontSize: 12 }}>{`${L.amount} ${formatYen(score)}`}</RText>
      </Sunken>
    </View>
  );
}

export function SmallButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={6}>
      {({ pressed }) => (
        <Bevel type={pressed ? 'sunken' : 'raised'} style={{ height: 22 }} innerStyle={{ paddingHorizontal: 6, justifyContent: 'center' }}>
          <RText style={{ fontSize: 12, color: disabled ? t.shadow : t.text }}>{label}</RText>
        </Bevel>
      )}
    </Pressable>
  );
}

/** 得点のツールチップ。位置は盤面左上基準 */
export function FloatingPoints({ id, points, rect, cellSize }: { id: number; points: number; rect: Rect; cellSize: number }) {
  const t = useTheme();
  const y = useSharedValue(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    y.value = 0;
    y.value = withTiming(-30, { duration: 700, easing: Easing.linear });
    const id_ = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(id_);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  if (!visible) return null;
  const cx = ROW_HEADER_W + ((rect.c0 + rect.c1 + 1) / 2) * cellSize;
  const cy = COL_HEADER_H + ((rect.r0 + rect.r1 + 1) / 2) * cellSize;
  const left = Math.min(Math.max(cx - 24, 0), ROW_HEADER_W + COLS * cellSize - 60);
  return (
    <Animated.View
      exiting={FadeOut}
      pointerEvents="none"
      style={[
        { position: 'absolute', left, top: cy - 14, backgroundColor: t.tooltip, borderWidth: 1, borderColor: t.dark, paddingHorizontal: 4, zIndex: 5 },
        style,
      ]}
    >
      <RText style={{ fontSize: 20, color: t.tooltipText }}>{`+${points}`}</RText>
    </Animated.View>
  );
}
