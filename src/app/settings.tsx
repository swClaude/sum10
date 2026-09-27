import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { privacyOptionsRequired, showPrivacyOptions } from '@/services/ads';
import { useAppStore, type BossGesture, type BossTable, type Skin } from '@/state/appStore';
import { Bevel, Dialog, RButton, RText, Sunken, Window } from '@/ui/Retro';
import { FONT, useTheme } from '@/ui/theme';

const PRIVACY_URL = 'https://example.com/sum10/privacy';

function Group({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ borderWidth: 1, borderColor: t.shadow, padding: 10, paddingTop: 14, gap: 8, marginTop: 8 }}>
      <RText style={{ position: 'absolute', top: -10, left: 8, backgroundColor: t.face, paddingHorizontal: 4 }}>{title}</RText>
      {children}
    </View>
  );
}

function Check({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} disabled={disabled} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }} accessibilityRole="checkbox" accessibilityState={{ checked: value, disabled }}>
      <Bevel type="sunken" style={{ width: 20, height: 20, backgroundColor: t.input }} innerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <RText style={{ fontSize: 13, lineHeight: 15, color: t.cellText }}>{value ? '✓' : ''}</RText>
      </Bevel>
      <RText style={{ color: disabled ? t.shadow : t.text }}>{label}</RText>
    </Pressable>
  );
}

function Radio<T extends string>({ options, value, onChange, disabled }: { options: [T, string][]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      {options.map(([v, label]) => (
        <Pressable key={v} onPress={() => onChange(v)} disabled={disabled} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }} accessibilityRole="radio" accessibilityState={{ checked: v === value, disabled }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderTopColor: t.shadow, borderLeftColor: t.shadow, borderRightColor: t.hilight, borderBottomColor: t.hilight, backgroundColor: t.input, alignItems: 'center', justifyContent: 'center' }}>
            {v === value && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.cellText }} />}
          </View>
          <RText style={{ color: disabled ? t.shadow : t.text }}>{label}</RText>
        </Pressable>
      ))}
    </View>
  );
}

export default function Settings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const s = useAppStore((st) => st.settings);
  const update = useAppStore((st) => st.updateSettings);
  const pro = useAppStore((st) => st.entitlements.pro);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAdPrivacy, setShowAdPrivacy] = useState(false);

  useEffect(() => {
    void privacyOptionsRequired().then(setShowAdPrivacy);
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Window title="環境設定 - SUM10" onClose={() => router.back()}>
        <ScrollView contentContainerStyle={{ padding: 10, gap: 10, paddingBottom: 30 }}>
          <Group title="動作">
            <Check label="効果音" value={s.sound} onChange={(v) => update({ sound: v })} />
            <Check label="振動" value={s.haptics} onChange={(v) => update({ haptics: v })} />
          </Group>
          <Group title="ボス画面の操作">
            <Radio<BossGesture>
              options={[
                ['swipe2', '2本指で下にスワイプ'],
                ['tap3', '3本指でタップ'],
              ]}
              value={s.bossGesture}
              onChange={(v) => update({ bossGesture: v })}
            />
          </Group>
          <Group title={`表示スキン${pro ? '' : '（Pro）'}`}>
            <Radio<Skin>
              options={[
                ['standard', '標準'],
                ['terminal', '黒画面端末'],
                ['ledger', '帳票'],
                ['english', '英語UI'],
              ]}
              value={pro ? s.skin : 'standard'}
              onChange={(v) => update({ skin: v })}
              disabled={!pro}
            />
          </Group>
          <Group title={`ボス画面のカスタマイズ${pro ? '' : '（Pro）'}`}>
            <RText>会社名</RText>
            <Sunken style={{ height: 32, backgroundColor: t.input }}>
              <TextInput
                value={s.bossCompany}
                editable={pro}
                maxLength={24}
                onChangeText={(v) => update({ bossCompany: v })}
                style={{ fontFamily: FONT, fontSize: 14, color: t.cellText, padding: 0 }}
              />
            </Sunken>
            <Radio<BossTable>
              options={[
                ['sales', '売上'],
                ['expense', '経費'],
                ['stock', '在庫'],
              ]}
              value={s.bossTable}
              onChange={(v) => update({ bossTable: v })}
              disabled={!pro}
            />
            {!pro && <RButton label="ライセンス購入へ" onPress={() => router.push('/shop')} />}
          </Group>
          <Group title="その他">
            <RButton label="プライバシーポリシー" onPress={() => void Linking.openURL(PRIVACY_URL)} />
            {showAdPrivacy && <RButton label="広告のプライバシー設定" onPress={() => void showPrivacyOptions()} />}
            <RButton label="データ初期化..." onPress={() => setConfirmReset(true)} />
          </Group>
        </ScrollView>
      </Window>
      <Dialog
        visible={confirmReset}
        title="データ初期化"
        icon="!"
        onClose={() => setConfirmReset(false)}
        buttons={[
          {
            label: 'はい',
            onPress: () => {
              useAppStore.getState().resetData();
              setConfirmReset(false);
            },
          },
          { label: 'いいえ', onPress: () => setConfirmReset(false), isDefault: true },
        ]}
      >
        <RText style={{ lineHeight: 22 }}>自己ベスト・記録・設定をすべて消去します。{'\n'}購入済みのライセンスは消えません。よろしいですか？</RText>
      </Dialog>
    </View>
  );
}
