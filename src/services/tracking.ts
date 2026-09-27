import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

export async function requestTracking(): Promise<void> {
  try {
    await requestTrackingPermissionsAsync();
  } catch {
    // 拒否・失敗でも続行
  }
}
