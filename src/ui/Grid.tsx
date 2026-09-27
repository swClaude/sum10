import { memo, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { COLS, ROWS } from '@/game/config';
import { rectContains, type Board, type Cell, type Rect } from '@/game/board';
import { RText } from './Retro';
import { FONT, useTheme } from './theme';

export const ROW_HEADER_W = 28;
export const COL_HEADER_H = 22;
const COL_NAMES = 'ABCDEFGH';

export type DropAnim = { id: number; dist: number[]; durationMs: number };

type Props = {
  board: Board;
  cellSize: number;
  selection: Rect | null;
  selectionHit: boolean;
  hint: Rect | null;
  hintOn: boolean;
  blinkOn: boolean;
  drop: DropAnim | null;
  onStart(cell: Cell): void;
  onMove(cell: Cell): void;
  onEnd(): void;
  onCancel(): void;
};

export function Grid(p: Props) {
  const t = useTheme();
  const size = p.cellSize;
  const cb = useRef(p);
  cb.current = p;

  const gesture = useMemo(() => {
    const toCell = (x: number, y: number): Cell => ({
      row: Math.max(0, Math.min(ROWS - 1, Math.floor(y / size))),
      col: Math.max(0, Math.min(COLS - 1, Math.floor(x / size))),
    });
    return Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .maxPointers(1)
      .onBegin((e) => cb.current.onStart(toCell(e.x, e.y)))
      .onUpdate((e) => cb.current.onMove(toCell(e.x, e.y)))
      .onEnd((_e, success) => (success ? cb.current.onEnd() : cb.current.onCancel()))
      .onFinalize((_e, success) => {
        if (!success) cb.current.onCancel();
      });
  }, [size]);

  const cells = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col;
      const inSel = p.selection !== null && rectContains(p.selection, row, col);
      const inHint = p.hintOn && p.hint !== null && rectContains(p.hint, row, col);
      cells.push(
        <GridCell
          key={i}
          value={p.board[i]!}
          row={row}
          col={col}
          size={size}
          mark={inSel ? (p.selectionHit ? 'hit' : 'select') : inHint ? 'hit' : 'none'}
          blink={p.blinkOn}
          dropDist={p.drop?.dist[i] ?? 0}
          dropId={p.drop?.id ?? 0}
          dropMs={p.drop?.durationMs ?? 0}
        />,
      );
    }

  const header = (label: string, w: number, h: number, key: string) => (
    <View
      key={key}
      style={{
        width: w,
        height: h,
        backgroundColor: t.face,
        borderWidth: 1,
        borderTopColor: t.hilight,
        borderLeftColor: t.hilight,
        borderRightColor: t.dark,
        borderBottomColor: t.dark,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RText style={{ fontSize: 12 }}>{label}</RText>
    </View>
  );

  return (
    <View style={{ width: ROW_HEADER_W + size * COLS, backgroundColor: t.cell }}>
      <View style={{ flexDirection: 'row', zIndex: 2 }}>
        {header('', ROW_HEADER_W, COL_HEADER_H, 'corner')}
        {Array.from(COL_NAMES).map((c) => header(c, size, COL_HEADER_H, c))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ zIndex: 2 }}>{Array.from({ length: ROWS }, (_, r) => header(String(r + 1), ROW_HEADER_W, size, `r${r}`))}</View>
        <GestureDetector gesture={gesture}>
          <View
            style={{ width: size * COLS, height: size * ROWS, flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' }}
            accessibilityLabel="盤面"
          >
            {cells}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

type CellProps = {
  value: number;
  row: number;
  col: number;
  size: number;
  mark: 'none' | 'select' | 'hit';
  blink: boolean;
  dropDist: number;
  dropId: number;
  dropMs: number;
};

const GridCell = memo(function GridCell({ value, row, size, mark, blink, dropDist, dropId, dropMs }: CellProps) {
  const t = useTheme();
  const y = useSharedValue(0);

  useEffect(() => {
    if (dropDist <= 0) return;
    // 等速落下＋着地で1px沈む
    y.value = -dropDist * size;
    y.value = withSequence(
      withTiming(0, { duration: dropMs, easing: Easing.linear }),
      withTiming(1, { duration: 30, easing: Easing.linear }),
      withTiming(0, { duration: 30, easing: Easing.linear }),
    );
    // dropId が変わった時だけ再生する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const empty = value === 0;
  const bg = empty && blink ? t.dark : mark === 'hit' ? t.hit : mark === 'select' ? t.select : row % 2 === 1 ? t.cellAlt : t.cell;
  const fg = mark === 'hit' ? t.hitText : mark === 'select' ? t.selectText : t.cellText;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: t.grid,
        backgroundColor: empty ? (blink ? t.dark : t.cell) : undefined,
      }}
    >
      {!empty && (
        <Animated.View
          style={[{ flex: 1, backgroundColor: bg, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 7 }, anim]}
        >
          <RText style={{ fontFamily: FONT, fontSize: Math.round(size * 0.42), color: fg }}>{value}</RText>
        </Animated.View>
      )}
    </View>
  );
});
