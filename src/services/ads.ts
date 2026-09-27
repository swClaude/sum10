import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAppStore } from '@/state/appStore';

/** 本番IDは AdMob 管理画面で発行して差し替える */
const PROD = {
  banner: 'ca-app-pub-6542116879590958/4826907499',
  interstitial: 'ca-app-pub-6542116879590958/8384018283',
  rewarded: 'ca-app-pub-6542116879590958/6642637765',
};

export const AD_UNIT = __DEV__
  ? { banner: TestIds.ADAPTIVE_BANNER, interstitial: TestIds.INTERSTITIAL, rewarded: TestIds.REWARDED }
  : PROD;

const INTERSTITIAL_EVERY = 2;
const INTERSTITIAL_MIN_GAP_MS = 60_000;

let ready = false;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

/**
 * EEA/UK/CCPA向けのGoogle同意（UMP）フォーム。地域外の端末では何もしない。
 * Google広告ポリシー上、ATT（Apple）とは別に必須。
 */
async function gatherConsent(): Promise<void> {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // 取得失敗時も広告自体は非パーソナライズ等でSDKが自律的に扱う
  }
}

export async function initAds(): Promise<void> {
  if (Platform.OS === 'web' || ready) return;
  try {
    await gatherConsent();
    await mobileAds().initialize();
    ready = true;
    loadInterstitial();
  } catch {
    ready = false;
  }
}

/** 設定画面の「広告のプライバシー設定」ボタンを出すべきか（EEA/UK等で必須） */
export async function privacyOptionsRequired(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const info = await AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    return false;
  }
}

/** 設定画面から呼ぶ。同意の選び直しフォームを表示する */
export async function showPrivacyOptions(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {
    // フォームが無ければ何もしない
  }
}

function loadInterstitial() {
  if (!ready || useAppStore.getState().entitlements.noAds) return;
  interstitial = InterstitialAd.createForAdRequest(AD_UNIT.interstitial);
  interstitialLoaded = false;
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, loadInterstitial);
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  interstitial.load();
}

/** 結果ダイアログを閉じた後に呼ぶ。条件を満たせば表示し、閉じられるまで待つ */
export async function maybeShowInterstitial(): Promise<void> {
  const s = useAppStore.getState();
  if (!ready || s.entitlements.noAds) return;
  if (s.playCountForAds === 0 || s.playCountForAds % INTERSTITIAL_EVERY !== 0) return;
  if (Date.now() - s.lastInterstitialAt < INTERSTITIAL_MIN_GAP_MS) return;
  if (!interstitial || !interstitialLoaded) {
    loadInterstitial();
    return;
  }
  const ad = interstitial;
  await new Promise<void>((resolve) => {
    const offClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      offClose();
      resolve();
    });
    ad.show().catch(() => {
      offClose();
      resolve();
    });
  });
  s.patch({ lastInterstitialAt: Date.now() });
}

/** リワード広告を表示し、報酬が得られたら true */
export async function showRewarded(): Promise<boolean> {
  if (!ready) return false;
  const ad = RewardedAd.createForAdRequest(AD_UNIT.rewarded);
  return new Promise<boolean>((resolve) => {
    let earned = false;
    const offs: (() => void)[] = [];
    const done = (v: boolean) => {
      offs.forEach((f) => f());
      resolve(v);
    };
    offs.push(ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show().catch(() => done(false))));
    offs.push(ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true)));
    offs.push(ad.addAdEventListener(AdEventType.CLOSED, () => done(earned)));
    offs.push(ad.addAdEventListener(AdEventType.ERROR, () => done(false)));
    ad.load();
  });
}

export const adsSupported = true;
