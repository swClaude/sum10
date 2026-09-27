import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jstDateKey } from '@/game/rng';
import { formatYen } from '@/game/scoring';
import { LEADERBOARD, openLeaderboard } from '@/services/gameCenter';
import { useAppStore } from '@/state/appStore';
import { AdBanner } from '@/ui/AdBanner';
import { Dialog, MenuBar, RButton, RText, Sunken, Window } from '@/ui/Retro';
import { useTheme } from '@/ui/theme';

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const attIntroDone = useAppStore((s) => s.attIntroDone);
  const best = useAppStore((s) => s.bestTimeAttack);
  const dailyPlayed = useAppStore((s) => s.dailyPlayed);
  const supporter = useAppStore((s) => s.entitlements.supporter);
  const [gcError, setGcError] = useState(false);

  if (!attIntroDone) return <Redirect href="/att" />;

  const today = jstDateKey(new Date());
  const todayScore = dailyPlayed[today];

  const items: { no: number; label: string; sub: string; onPress: () => void }[] = [
    {
      no: 1,
      label: '日次照合',
      sub:
        (todayScore === undefined
          ? '今日限定の共通問題（1日1回だけランキングに記録）'
          : `本日分 処理済 ${formatYen(todayScore)}（再挑戦は練習扱い）`) + '\n全員が同じ盤面で挑戦します',
      onPress: () => router.push({ pathname: '/game', params: { mode: 'daily' } }),
    },
    {
      no: 2,
      label: '随時照合',
      sub: `毎回ランダムな盤面。何度でも挑戦してランキングへ\n最高計上額 ${formatYen(best)}`,
      onPress: () => router.push({ pathname: '/game', params: { mode: 'timeattack' } }),
    },
    {
      no: 3,
      label: '研修',
      sub: '時間無制限でゆっくり練習。ヒントあり（ランキング対象外）',
      onPress: () => router.push({ pathname: '/game', params: { mode: 'practice' } }),
    },
    {
      no: 4,
      label: '実績照会',
      sub: 'ランキングを見る（Game Center）',
      onPress: async () => {
        const ok = await openLeaderboard(todayScore === undefined ? LEADERBOARD.timeattack : LEADERBOARD.daily);
        if (!ok) setGcError(true);
      },
    },
    { no: 5, label: '購買', sub: 'ライセンス購入（広告削除・スキン追加など）', onPress: () => router.push('/shop') },
    { no: 6, label: '環境設定', sub: '効果音・振動・ボス操作の切り替え', onPress: () => router.push('/settings') },
  ];

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: t.face }}>
      <Window title={`業務メニュー - SUM10${supporter ? ' ★' : ''}`}>
        <MenuBar
          titles={['ファイル(F)', 'ヘルプ(H)']}
          items={[
            { label: '環境設定', onPress: () => router.push('/settings') },
            { label: '遊び方', onPress: () => router.push('/help') },
          ]}
        />
        <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
          <Sunken style={{ backgroundColor: t.input }}>
            <RText style={{ color: t.cellText, paddingVertical: 6, fontSize: 13 }}>{`処理日: ${today.slice(0, 4)}/${today.slice(4, 6)}/${today.slice(6)}　担当: 経理部`}</RText>
          </Sunken>
          <RButton
            label="▶ スタート（すぐに遊ぶ）"
            onPress={() => router.push({ pathname: '/game', params: { mode: 'timeattack' } })}
            isDefault
            fontSize={17}
          />
          <RText style={{ fontSize: 11, marginLeft: 4 }}>迷ったらここをタップ。何度でも挑戦できます。</RText>
          {items.map((it) => (
            <View key={it.no} style={{ gap: 2 }}>
              <RButton label={`${it.no}. ${it.label}`} onPress={it.onPress} align="left" fontSize={17} />
              <RText style={{ fontSize: 12, marginLeft: 8 }}>{it.sub}</RText>
            </View>
          ))}
        </ScrollView>
        <View style={{ paddingBottom: insets.bottom }}>
          <AdBanner />
        </View>
      </Window>
      <Dialog
        visible={gcError}
        title="実績照会"
        icon="!"
        onClose={() => setGcError(false)}
        buttons={[{ label: 'OK', onPress: () => setGcError(false), isDefault: true }]}
      >
        <RText>Game Center にサインインしていないため、ランキングを表示できません。{'\n'}「設定」アプリ → Game Center からサインインしてください。</RText>
      </Dialog>
    </View>
  );
}
