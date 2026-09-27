import { View } from 'react-native';
import { useAppStore } from '@/state/appStore';
import { RText } from './Retro';

/** Web プレビュー用のプレースホルダ */
export function AdBanner() {
  const noAds = useAppStore((s) => s.entitlements.noAds);
  if (noAds) return null;
  return (
    <View style={{ height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ddd' }}>
      <RText style={{ fontSize: 12, color: '#666' }}>[広告バナー]</RText>
    </View>
  );
}
