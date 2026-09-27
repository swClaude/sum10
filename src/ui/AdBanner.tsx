import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT } from '@/services/ads';
import { useAppStore } from '@/state/appStore';

/** ホーム・結果画面専用。プレイ中の画面には置かない */
export function AdBanner() {
  const noAds = useAppStore((s) => s.entitlements.noAds);
  if (noAds) return null;
  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd unitId={AD_UNIT.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
