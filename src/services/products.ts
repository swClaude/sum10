export type ProductId = 'ume' | 'take' | 'matsu';
export type PurchaseOutcome = 'success' | 'cancelled' | 'unavailable' | 'error';

/** App Store Connect の「App内課金」で作る Product ID と一致させる（非消耗型） */
export const SKU: Record<ProductId, string> = {
  ume: 'com.souwer2.sum10.ume',
  take: 'com.souwer2.sum10.take',
  matsu: 'com.souwer2.sum10.matsu',
};

export const PRODUCTS: { id: ProductId; sku: string; name: string; price: string; desc: string; recommended?: boolean }[] = [
  { id: 'ume', sku: SKU.ume, name: '梅 広告削除', price: '¥400', desc: 'インタースティシャル・バナー広告を削除（ヒント用の広告は残ります）' },
  { id: 'take', sku: SKU.take, name: '竹 Pro', price: '¥980', desc: '広告削除＋スキン全部＋ボス画面カスタマイズ', recommended: true },
  { id: 'matsu', sku: SKU.matsu, name: '松 サポーター', price: '¥1,980', desc: 'Proの内容＋今後追加するスキン全部＋ランキング名に★' },
];
