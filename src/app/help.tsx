import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RText, Window } from '@/ui/Retro';
import { useTheme } from '@/ui/theme';

export default function Help() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Window title="説明.txt - メモ帳" onClose={() => router.back()}>
        <ScrollView style={{ margin: 4, backgroundColor: t.input }} contentContainerStyle={{ padding: 10 }}>
          <RText style={{ color: t.cellText, lineHeight: 24 }}>
            ■ 遊び方{'\n'}
            ・ドラッグで長方形の範囲を選択。合計が10になると青緑になり、指を離すと消えます。{'\n'}
            ・消えたマスには上の数字が落ちてきて、空いた所は補充されます。{'\n'}
            ・制限時間は1分30秒。残り10秒でバーが赤くなります。{'\n\n'}
            ■ 得点{'\n'}
            ・2マス 10 / 3マス 30 / 4マス 70 / 5マス以上 150{'\n\n'}
            ■ モード{'\n'}
            ・日次照合：全員同じ盤面。1日1回だけランキング対象（日本時間0時に更新）{'\n'}
            ・随時照合：ランダム盤面。何回でも挑戦できます{'\n'}
            ・研修：時間無制限の練習。ヒントあり{'\n\n'}
            ■ ボス画面{'\n'}
            ・2本指で下にスワイプすると業務画面に切り替わります（もう一度で戻る）。{'\n'}
            ・環境設定で「3本指タップ」に変更できます。
          </RText>
        </ScrollView>
      </Window>
    </View>
  );
}
