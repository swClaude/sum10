import { DotGothic16_400Regular, useFonts } from '@expo-google-fonts/dotgothic16';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { AppState, Platform, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAds } from '@/services/ads';
import { initGameCenter } from '@/services/gameCenter';
import { initPurchases } from '@/services/purchases';
import { useAppStore, useUiStore } from '@/state/appStore';
import { BossScreen } from '@/ui/BossScreen';
import { useSkin, useTheme } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

const BOSS_SWIPE_PT = 60;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ DotGothic16_400Regular });
  const t = useTheme();
  const bossGesture = useAppStore((s) => s.settings.bossGesture);
  const attIntroDone = useAppStore((s) => s.attIntroDone);
  const skin = useSkin();

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    void initGameCenter();
    void initPurchases();
  }, []);

  useEffect(() => {
    // 広告SDKはATT説明画面の後で初期化する
    if (attIntroDone) void initAds();
  }, [attIntroDone]);

  // バックグラウンドへ移ったら一時停止＋ボス画面（アプリ切替サムネイル対策で inactive でも出す）
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') useUiStore.getState().setBoss(true);
    });
    return () => sub.remove();
  }, []);

  const gesture = useMemo(() => {
    const toggle = () => useUiStore.getState().toggleBoss();
    if (bossGesture === 'tap3') {
      return Gesture.Tap().runOnJS(true).minPointers(3).onEnd((_e, ok) => ok && toggle());
    }
    return Gesture.Pan()
      .runOnJS(true)
      .minPointers(2)
      .onEnd((e) => {
        if (e.translationY >= BOSS_SWIPE_PT) toggle();
      });
  }, [bossGesture]);

  if (!fontsLoaded) return null;

  const body = (
    <View style={{ flex: 1, backgroundColor: t.face }} collapsable={false}>
      <StatusBar style={skin === 'terminal' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: t.face }, gestureEnabled: false }} />
      <BossScreen />
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Web ではルートの GestureDetector がクリックを奪うため外す（ボス画面はメニューから） */}
        {Platform.OS === 'web' ? body : <GestureDetector gesture={gesture}>{body}</GestureDetector>}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
