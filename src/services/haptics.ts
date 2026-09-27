import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAppStore } from '@/state/appStore';

const on = () => Platform.OS !== 'web' && useAppStore.getState().settings.haptics;
const safe = (p: Promise<unknown>) => void p.catch(() => {});

export const haptic = {
  selection: () => on() && safe(Haptics.selectionAsync()),
  hit: () => on() && safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  clear: () => on() && safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  tick: () => on() && safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
};
