import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductId, PurchaseOutcome } from '@/services/products';
import { buy, isDevFallbackActive, PRODUCTS, restore } from '@/services/purchases';
import { useAppStore, type Entitlements } from '@/state/appStore';
import { Bevel, Dialog, RButton, RText, Sunken, Window } from '@/ui/Retro';
import { useTheme } from '@/ui/theme';

const owns = (e: Entitlements, id: ProductId) => (id === 'ume' ? e.noAds : id === 'take' ? e.pro : e.supporter);

const MESSAGES: Record<PurchaseOutcome, string | null> = {
  success: 'ご購入ありがとうございました。ライセンスを登録しました。',
  cancelled: null,
  unavailable: '現在ストアに接続できません。時間をおいて再度お試しください。',
  error: '購入処理に失敗しました。通信環境を確認して再度お試しください。',
};

export default function Shop() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const ent = useAppStore((s) => s.entitlements);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onBuy = async (id: ProductId) => {
    setBusy(true);
    const r = await buy(id);
    setBusy(false);
    setMsg(MESSAGES[r]);
  };

  const onRestore = async () => {
    setBusy(true);
    const e = await restore();
    setBusy(false);
    if (!e) setMsg('復元できませんでした。通信環境を確認してください。');
    else if (!e.noAds && !e.pro && !e.supporter) setMsg('復元できる購入履歴が見つかりませんでした。');
    else setMsg('購入履歴を復元しました。');
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Window title="ライセンス購入 - SUM10" onClose={() => router.back()}>
        <ScrollView contentContainerStyle={{ padding: 10, gap: 12 }}>
          <RText style={{ lineHeight: 22 }}>すべて買い切りです。得点が有利になる商品はありません。</RText>
          {isDevFallbackActive() && (
            <Sunken style={{ backgroundColor: t.input, paddingVertical: 6 }}>
              <RText style={{ fontSize: 11, lineHeight: 16, color: t.cellText }}>
                【開発用】App内課金（StoreKit）に接続できないため、購入は仮の登録として動作確認できます。{'\n'}実機ではApp Store Connect側の商品登録が必要です（README参照）。
              </RText>
            </Sunken>
          )}
          {PRODUCTS.map((p) => {
            const owned = owns(ent, p.id);
            return (
              <Bevel key={p.id} type={p.recommended ? 'sunken' : 'raised'} style={p.recommended ? { backgroundColor: t.input } : undefined} innerStyle={{ padding: 10, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <RText style={{ fontSize: 17, color: p.recommended ? t.cellText : t.text }}>
                    {p.name}
                    {p.recommended ? '　[おすすめ]' : ''}
                  </RText>
                  <RText style={{ fontSize: 17, color: p.recommended ? t.cellText : t.text }}>{p.price}</RText>
                </View>
                <RText style={{ fontSize: 12, lineHeight: 18, color: p.recommended ? t.cellText : t.text }}>{p.desc}</RText>
                <RButton label={owned ? '登録済み' : '購入する'} disabled={owned || busy} onPress={() => onBuy(p.id)} isDefault={p.recommended} />
              </Bevel>
            );
          })}
          <RButton label="購入の復元" onPress={onRestore} disabled={busy} />
          <RText style={{ fontSize: 11, lineHeight: 16 }}>
            ・「広告削除」でも練習モードのヒント用広告（任意視聴）は表示されます。{'\n'}・購入はApple IDに紐づき、機種変更後も「購入の復元」で引き継げます。
          </RText>
          {isDevFallbackActive() && (ent.noAds || ent.pro || ent.supporter) && (
            <RButton
              label="【開発用】テスト購入を解除"
              onPress={() => useAppStore.getState().setEntitlements({ noAds: false, pro: false, supporter: false })}
            />
          )}
        </ScrollView>
      </Window>
      <Dialog visible={msg !== null} title="ライセンス購入" onClose={() => setMsg(null)} buttons={[{ label: 'OK', onPress: () => setMsg(null), isDefault: true }]}>
        <RText style={{ lineHeight: 22 }}>{msg}</RText>
      </Dialog>
    </View>
  );
}
