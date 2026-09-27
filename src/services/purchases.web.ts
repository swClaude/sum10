import { useAppStore, type Entitlements } from '@/state/appStore';
import type { ProductId, PurchaseOutcome } from './products';

export { PRODUCTS } from './products';

export async function initPurchases(): Promise<void> {}
export const purchasesReady = () => false;
export const isDevFallbackActive = () => __DEV__;

function devGrant(id: ProductId): Entitlements {
  const cur = useAppStore.getState().entitlements;
  if (id === 'ume') return { ...cur, noAds: true };
  if (id === 'take') return { ...cur, noAds: true, pro: true };
  return { noAds: true, pro: true, supporter: true };
}

/** Web/開発ビルドではRevenueCatが無いので、確認用に仮購入扱いにする */
export async function buy(id: ProductId): Promise<PurchaseOutcome> {
  if (!__DEV__) return 'unavailable';
  useAppStore.getState().setEntitlements(devGrant(id));
  return 'success';
}

export async function restore(): Promise<Entitlements | null> {
  return null;
}
