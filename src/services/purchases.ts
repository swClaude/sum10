import { Platform } from 'react-native';
import {
  ErrorCode,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as iapRestorePurchases,
  type Purchase,
} from 'expo-iap';
import { useAppStore, type Entitlements } from '@/state/appStore';
import { PRODUCTS, SKU, type ProductId, type PurchaseOutcome } from './products';

export { PRODUCTS } from './products';

const PURCHASE_TIMEOUT_MS = 60_000;

let connected = false;
type Pending = { sku: string; settle: (r: PurchaseOutcome) => void };
let pending: Pending | null = null;

function entitlementsFromPurchases(purchases: Purchase[]): Entitlements {
  const owned = new Set(purchases.map((p) => p.productId));
  // どれか1つでも買えば広告は消える。竹・松はProも含む。松はサポーター特典も含む
  return {
    noAds: owned.has(SKU.ume) || owned.has(SKU.take) || owned.has(SKU.matsu),
    pro: owned.has(SKU.take) || owned.has(SKU.matsu),
    supporter: owned.has(SKU.matsu),
  };
}

async function syncEntitlements(): Promise<Entitlements> {
  const purchases = await getAvailablePurchases();
  const e = entitlementsFromPurchases(purchases);
  useAppStore.getState().setEntitlements(e);
  return e;
}

function settlePending(outcome: PurchaseOutcome, sku?: string) {
  if (!pending) return;
  if (sku && pending.sku !== sku) return;
  pending.settle(outcome);
  pending = null;
}

export async function initPurchases(): Promise<void> {
  if (connected || Platform.OS !== 'ios') return;
  try {
    await initConnection();
    connected = true;
  } catch {
    return;
  }

  // StoreKitのトランザクションキュー由来のイベント。requestPurchaseの戻り値だけに頼らない
  purchaseUpdatedListener(async (purchase) => {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch {
      // 完了処理に失敗しても、次回の getAvailablePurchases でまた拾える
    }
    await syncEntitlements().catch(() => {});
    settlePending('success', purchase.productId);
  });
  purchaseErrorListener((err) => {
    settlePending(err.code === ErrorCode.UserCancelled ? 'cancelled' : 'error');
  });

  try {
    await syncEntitlements();
  } catch {
    // オフライン時はキャッシュ済みのエンタイトルメントを使う
  }
}

export function purchasesReady() {
  return connected;
}

/** expo-iapの接続が無い（iOS実機以外）ときだけ、開発ビルドで画面の動作確認ができるようにする */
export function isDevFallbackActive() {
  return __DEV__ && !connected;
}

function devGrant(id: ProductId): Entitlements {
  const cur = useAppStore.getState().entitlements;
  if (id === 'ume') return { ...cur, noAds: true };
  if (id === 'take') return { ...cur, noAds: true, pro: true };
  return { noAds: true, pro: true, supporter: true };
}

export async function buy(id: ProductId): Promise<PurchaseOutcome> {
  if (!connected) {
    if (isDevFallbackActive()) {
      useAppStore.getState().setEntitlements(devGrant(id));
      return 'success';
    }
    return 'unavailable';
  }

  const sku = SKU[id];
  return new Promise<PurchaseOutcome>((resolve) => {
    let settled = false;
    const settle = (v: PurchaseOutcome) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    pending = { sku, settle };
    setTimeout(() => {
      if (pending?.sku === sku) pending = null;
      settle('error');
    }, PURCHASE_TIMEOUT_MS);

    requestPurchase({ request: { apple: { sku } }, type: 'in-app' }).catch((e: unknown) => {
      const code = (e as { code?: string } | undefined)?.code;
      settle(code === ErrorCode.UserCancelled ? 'cancelled' : 'error');
    });
  });
}

export async function restore(): Promise<Entitlements | null> {
  if (!connected) return null;
  try {
    await iapRestorePurchases();
    return await syncEntitlements();
  } catch {
    return null;
  }
}
