import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, useUiStore, type BossTable } from '@/state/appStore';
import { MenuBar, RText, Window } from './Retro';
import { useTheme } from './theme';

const TABLES: Record<BossTable, { title: string; unit: string; rows: [string, number, number, number][] }> = {
  sales: {
    title: '月次売上レポート',
    unit: '千円',
    rows: [
      ['営業1課', 4120, 3980, 4410],
      ['営業2課', 2860, 3105, 2970],
      ['法人営業', 6540, 6210, 6880],
      ['EC', 1930, 2240, 2515],
      ['代理店', 1210, 1180, 1095],
    ],
  },
  expense: {
    title: '部門別経費集計',
    unit: '千円',
    rows: [
      ['人件費', 8210, 8190, 8305],
      ['旅費交通費', 612, 540, 701],
      ['通信費', 188, 191, 186],
      ['消耗品費', 245, 310, 228],
      ['広告宣伝費', 1320, 1105, 1480],
    ],
  },
  stock: {
    title: '在庫推移表',
    unit: '個',
    rows: [
      ['商品A', 1240, 1180, 1302],
      ['商品B', 860, 905, 870],
      ['商品C', 2340, 2210, 2105],
      ['商品D', 410, 455, 520],
      ['商品E', 1670, 1590, 1622],
    ],
  },
};

const fmt = (n: number) => n.toLocaleString('ja-JP');

export function BossScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const visible = useUiStore((s) => s.bossVisible);
  const setBoss = useUiStore((s) => s.setBoss);
  const { bossTable, bossCompany } = useAppStore((s) => s.settings);
  const pro = useAppStore((s) => s.entitlements.pro);
  if (!visible) return null;

  const table = TABLES[pro ? bossTable : 'sales'];
  const company = pro ? bossCompany : '株式会社サンプル商事';
  const totals = [1, 2, 3].map((k) => table.rows.reduce((s, r) => s + (r[k] as number), 0));
  const max = Math.max(...table.rows.map((r) => r[3]));
  const cell = { borderWidth: 1, borderColor: t.grid, paddingVertical: 8, paddingHorizontal: 5 } as const;
  const colW = [2.2, 1.4, 1.4, 1.4, 1.2];

  const row = (cols: string[], header = false, key?: string) => (
    <View key={key} style={{ flexDirection: 'row' }}>
      {cols.map((c, i) => (
        <View key={i} style={[cell, { flex: colW[i], backgroundColor: header ? t.face : t.cell }]}>
          <RText style={{ fontSize: 13, textAlign: i === 0 ? 'left' : 'right', color: header ? t.text : t.cellText }}>{c}</RText>
        </View>
      ))}
    </View>
  );

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingTop: insets.top, backgroundColor: t.face, zIndex: 100, elevation: 100 }}
    >
      <Window title={`${table.title} - ${company}`} onClose={() => setBoss(false)}>
        <MenuBar titles={['ファイル(F)', '編集(E)', '表示(V)', '印刷(P)']} items={[{ label: '閉じる', onPress: () => setBoss(false) }]} />
        <View style={{ margin: 4, backgroundColor: t.cell }}>
          {row(['区分', '7月', '8月', '9月', '前年比'], true)}
          {table.rows.map((r) => row([r[0], fmt(r[1]), fmt(r[2]), fmt(r[3]), `${Math.round((r[3] / r[1]) * 100)}%`], false, r[0]))}
          {row(['合計', fmt(totals[0]!), fmt(totals[1]!), fmt(totals[2]!), `${Math.round((totals[2]! / totals[0]!) * 100)}%`], true)}
        </View>
        <RText style={{ marginHorizontal: 6, marginTop: 8, fontSize: 12 }}>{`9月実績（単位：${table.unit}）`}</RText>
        <View style={{ margin: 4, padding: 8, backgroundColor: t.cell, gap: 6 }}>
          {table.rows.map((r) => (
            <View key={r[0]} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RText style={{ width: 80, fontSize: 12, color: t.cellText }}>{r[0]}</RText>
              <View style={{ height: 14, width: `${(r[3] / max) * 65}%`, backgroundColor: t.select }} />
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 6, paddingBottom: insets.bottom + 4 }}>
          <RText style={{ fontSize: 12 }}>準備完了</RText>
        </View>
      </Window>
    </View>
  );
}
