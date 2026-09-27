export const AD_UNIT = { banner: '', interstitial: '', rewarded: '' };
export async function initAds(): Promise<void> {}
export async function maybeShowInterstitial(): Promise<void> {}
export async function privacyOptionsRequired(): Promise<boolean> {
  return false;
}
export async function showPrivacyOptions(): Promise<void> {}
/** Web プレビューでは広告を出さずに報酬扱い */
export async function showRewarded(): Promise<boolean> {
  return true;
}
export const adsSupported = false;
