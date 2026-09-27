import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestTracking } from '@/services/tracking';
import { useAppStore } from '@/state/appStore';
import { RButton, RText, Window } from '@/ui/Retro';

/** ATT の事前説明（1回だけ） */
export default function AttIntro() {
  const insets = useSafeAreaInsets();
  const next = async () => {
    await requestTracking();
    useAppStore.getState().patch({ attIntroDone: true });
    router.replace('/');
  };
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Window title="セットアップ - SUM10">
        <View style={{ padding: 16, gap: 14 }}>
          <RText style={{ fontSize: 18 }}>ようこそ</RText>
          <RText style={{ lineHeight: 24 }}>
            このアプリは無料で遊べるよう、広告を表示しています。{'\n\n'}
            次の画面で「トラッキングの許可」を求められます。許可すると、あなたに合った広告が表示されやすくなります。{'\n\n'}
            許可しなくても、すべての機能を利用できます。
          </RText>
          <RButton label="次へ(N) >" onPress={next} isDefault />
        </View>
      </Window>
    </View>
  );
}
