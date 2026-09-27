import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLS, ROWS } from '@/game/config';
import { formatYen } from '@/game/scoring';
import { maybeShowInterstitial, showRewarded } from '@/services/ads';
import { LEADERBOARD, openLeaderboard, reportScore } from '@/services/gameCenter';
import { useAppStore, useUiStore, type GameMode } from '@/state/appStore';
import { useGame } from '@/state/useGame';
import { AdBanner } from '@/ui/AdBanner';
import { FloatingPoints, FormulaBar, ProgressBar, SheetTabs, SmallButton, StatusPanel } from '@/ui/GameChrome';
import { COL_HEADER_H, Grid, ROW_HEADER_W } from '@/ui/Grid';
import { Dialog, MenuBar, RText, Window } from '@/ui/Retro';
import { useLabels, useTheme } from '@/ui/theme';

const MODES: GameMode[] = ['daily', 'timeattack', 'practice'];
const FILE_NAME: Record<GameMode, string> = { daily: 'NIPPOU.SHT', timeattack: 'URIAGE.SHT', practice: 'KENSHU.SHT' };
const PAYWALL_AFTER_RESULTS = 3;

export default function GameScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: GameMode = MODES.includes(params.mode as GameMode) ? (params.mode as GameMode) : 'timeattack';
  const g = useGame(mode);
  const t = useTheme();
  const L = useLabels();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [gcError, setGcError] = useState(false);

  const cellSize = Math.floor(Math.min((area.w - ROW_HEADER_W) / COLS, (area.h - COL_HEADER_H) / ROWS));

  // ランキング送信は結果確定時に1回だけ
  useEffect(() => {
    if (g.result?.official) void reportScore(mode, g.result.score);
  }, [g.result, mode]);

  const leave = () => router.back();

  const closeResult = async () => {
    await maybeShowInterstitial();
    const s = useAppStore.getState();
    const closed = s.resultsClosed + 1;
    s.patch({ resultsClosed: closed });
    if (closed >= PAYWALL_AFTER_RESULTS && !s.paywallAutoShown && !s.entitlements.pro) {
      s.patch({ paywallAutoShown: true });
      router.replace('/shop');
      return;
    }
    leave();
  };

  const hint = async () => {
    if (g.hintsLeft <= 0) return;
    g.setMenuPaused(true);
    const ok = await showRewarded();
    g.setMenuPaused(false);
    if (ok) g.showHint();
  };

  const menuItems = [
    { label: g.menuPaused ? L.resume : L.pause, onPress: () => g.setMenuPaused(!g.menuPaused) },
    ...(mode === 'practice' ? [{ label: L.endPractice, onPress: g.finish }] : []),
    { label: L.home, onPress: leave },
    { label: L.boss, onPress: () => useUiStore.getState().setBoss(true) },
  ];

  const best = useAppStore((s) => s.bestTimeAttack);
  const r = g.result;
  const combosText = r ? `2マス×${r.combos[2]}　3マス×${r.combos[3]}\n4マス×${r.combos[4]}　5マス以上×${r.combos[5]}` : '';
  const matched = r ? r.combos[2] + r.combos[3] + r.combos[4] + r.combos[5] : 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: t.face }}>
      <Window title={`${FILE_NAME[mode]} - SUM10`} onClose={leave}>
        <MenuBar titles={L.menu} items={menuItems} />
        <FormulaBar selection={g.selection} sum={g.selSum} hit={g.selectionHit} />
        <View
          style={{ flex: 1, marginHorizontal: 0, overflow: 'hidden' }}
          onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {cellSize > 0 && (
            <View style={{ alignSelf: 'center' }}>
              <Grid
                board={g.display}
                cellSize={cellSize}
                selection={g.selection}
                selectionHit={g.selectionHit}
                hint={g.hint}
                hintOn={g.hintOn}
                blinkOn={g.blinkOn}
                drop={g.drop}
                onStart={g.onStart}
                onMove={g.onMove}
                onEnd={g.onEnd}
                onCancel={g.onCancel}
              />
              {g.lastPoints && (
                <FloatingPoints id={g.lastPoints.id} points={g.lastPoints.points} rect={g.lastPoints.rect} cellSize={cellSize} />
              )}
            </View>
          )}
          {g.countdown !== null && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 6,
                elevation: 6,
              }}
            >
              <RText style={{ fontSize: 96, color: '#fff' }}>{g.countdown}</RText>
            </View>
          )}
          {g.menuPaused && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: t.face,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 6,
                elevation: 6,
              }}
            >
              <RText style={{ fontSize: 18 }}>{L.pause}中</RText>
              <View style={{ height: 12 }} />
              <SmallButton label={L.resume} onPress={() => g.setMenuPaused(false)} />
            </View>
          )}
        </View>
        <View style={{ paddingHorizontal: 4, paddingTop: 3, paddingBottom: Math.max(insets.bottom, 6) }}>
          {g.timed && <ProgressBar timeLeft={g.timeLeft} />}
          <StatusPanel
            timed={g.timed}
            timeLeft={g.timeLeft}
            sum={g.selSum}
            count={g.selCount}
            recalculating={g.recalculating}
            right={
              mode === 'practice' ? (
                <SmallButton label={`${L.hint}(${g.hintsLeft})`} onPress={hint} disabled={g.hintsLeft <= 0 || g.phase !== 'playing'} />
              ) : undefined
            }
          />
          <SheetTabs score={g.game.score} />
        </View>
      </Window>

      {r && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.15)',
            zIndex: 60,
            elevation: 60,
          }}
        >
          <Dialog
            visible
            title="SUM10"
            onClose={closeResult}
            buttons={[
              {
                label: L.ranking,
                onPress: async () => {
                  const ok = await openLeaderboard(mode === 'daily' ? LEADERBOARD.daily : LEADERBOARD.timeattack);
                  if (!ok) setGcError(true);
                },
              },
              { label: L.retry, onPress: g.restart },
              { label: L.ok, onPress: closeResult, isDefault: true },
            ]}
          >
            <RText style={{ lineHeight: 22 }}>{L.done}</RText>
            <RText>{L.thisAmount}</RText>
            <RText style={{ fontSize: 28, color: t.select, marginVertical: 2 }}>{formatYen(r.score)}</RText>
            <RText style={{ fontSize: 13 }}>{`${L.matched} ${matched}${L.items}`}</RText>
            <RText style={{ fontSize: 12, lineHeight: 18 }}>{combosText}</RText>
            {mode === 'timeattack' && (
              <RText style={{ fontSize: 13, marginTop: 4 }}>{r.newBest && r.score > 0 ? L.bestUpdated : `${L.best} ${formatYen(best)}`}</RText>
            )}
            {!r.official && mode !== 'timeattack' && <RText style={{ fontSize: 12, marginTop: 4 }}>{L.practiceNote}</RText>}
          </Dialog>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom }}>
            <AdBanner />
          </View>
          <Dialog
            visible={gcError}
            title="実績照会"
            icon="!"
            onClose={() => setGcError(false)}
            buttons={[{ label: 'OK', onPress: () => setGcError(false), isDefault: true }]}
          >
            <RText>Game Center にサインインしていないため、ランキングを表示できません。</RText>
          </Dialog>
        </View>
      )}
    </View>
  );
}
