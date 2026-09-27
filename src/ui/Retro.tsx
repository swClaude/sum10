import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import { FONT, useTheme } from './theme';

export function RText({ style, ...rest }: TextProps) {
  const t = useTheme();
  return <Text {...rest} style={[{ fontFamily: FONT, color: t.text, fontSize: 14 }, style]} />;
}

type BevelProps = {
  type?: 'raised' | 'sunken';
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** 凸=左上白・右下黒の2px＋内側右下グレー1px、凹はその逆 */
export function Bevel({ type = 'raised', style, innerStyle, children }: BevelProps) {
  const t = useTheme();
  const raised = type === 'raised';
  return (
    <View
      style={[
        {
          borderWidth: 2,
          borderTopColor: raised ? t.hilight : t.shadow,
          borderLeftColor: raised ? t.hilight : t.shadow,
          borderBottomColor: raised ? t.dark : t.hilight,
          borderRightColor: raised ? t.dark : t.hilight,
          backgroundColor: t.face,
        },
        style,
      ]}
    >
      <View
        style={[
          { flex: 1 },
          raised
            ? { borderRightWidth: 1, borderBottomWidth: 1, borderColor: t.shadow }
            : { borderTopWidth: 1, borderLeftWidth: 1, borderColor: t.dark },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  isDefault?: boolean;
  disabled?: boolean;
  fontSize?: number;
  align?: 'center' | 'left';
};

export function RButton({ label, onPress, style, isDefault, disabled, fontSize = 14, align = 'center' }: ButtonProps) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={4} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={[isDefault && { borderWidth: 1, borderColor: t.dark }, style]}>
          <Bevel
            type={pressed ? 'sunken' : 'raised'}
            innerStyle={{ paddingVertical: 6, paddingHorizontal: 10, justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start' }}
          >
            <RText style={{ fontSize, color: disabled ? t.shadow : t.text }}>{label}</RText>
          </Bevel>
        </View>
      )}
    </Pressable>
  );
}

type TitleBarProps = { title: string; onClose?: () => void; icon?: string; compact?: boolean };

export function TitleBar({ title, onClose, icon = '▦', compact }: TitleBarProps) {
  const t = useTheme();
  const btn = (s: string, onPress?: () => void) => (
    <Pressable onPress={onPress} disabled={!onPress} hitSlop={8} accessibilityLabel={s === '×' ? '閉じる' : undefined}>
      <Bevel style={{ width: 20, height: 18 }} innerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <RText style={{ fontSize: 10, lineHeight: 12 }}>{s}</RText>
      </Bevel>
    </Pressable>
  );
  return (
    <LinearGradient
      colors={[t.titleFrom, t.titleTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ height: 24, flexDirection: 'row', alignItems: 'center', paddingLeft: 6, paddingRight: 3, gap: 4 }}
    >
      <RText style={{ color: t.titleText, fontSize: 13 }}>{icon}</RText>
      <RText numberOfLines={1} style={{ color: t.titleText, fontSize: 13, flex: 1, fontWeight: 'bold' }}>
        {title}
      </RText>
      {!compact && btn('_')}
      {!compact && btn('□')}
      {btn('×', onClose)}
    </LinearGradient>
  );
}

export type MenuItem = { label: string; onPress: () => void };

/** 飾りのメニューバー。どの見出しをタップしても同じドロップダウンを出す */
export function MenuBar({ titles, items }: { titles: string[]; items: MenuItem[] }) {
  const t = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 6, paddingVertical: 3, borderBottomWidth: 1, borderColor: t.shadow, zIndex: 10 }}>
      {titles.map((m, i) => (
        <Pressable key={m} onPress={() => setOpen(open === i ? null : i)} hitSlop={6}>
          <RText style={{ fontSize: 13, backgroundColor: open === i ? t.select : undefined, color: open === i ? t.selectText : t.text }}>
            {m}
          </RText>
        </Pressable>
      ))}
      <Modal transparent visible={open !== null} animationType="none" onRequestClose={() => setOpen(null)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
      </Modal>
      {open !== null && (
        <Bevel style={{ position: 'absolute', top: 22, left: 4 + open * 60, minWidth: 150, zIndex: 20, elevation: 20 }} innerStyle={{ padding: 2 }}>
          {items.map((it) => (
            <Pressable
              key={it.label}
              onPress={() => {
                setOpen(null);
                it.onPress();
              }}
            >
              {({ pressed }) => (
                <RText style={{ paddingVertical: 8, paddingHorizontal: 14, backgroundColor: pressed ? t.select : undefined, color: pressed ? t.selectText : t.text }}>
                  {it.label}
                </RText>
              )}
            </Pressable>
          ))}
        </Bevel>
      )}
    </View>
  );
}

type WindowProps = { title: string; onClose?: () => void; children: ReactNode; style?: StyleProp<ViewStyle> };

export function Window({ title, onClose, children, style }: WindowProps) {
  return (
    <Bevel style={[{ flex: 1 }, style]} innerStyle={{ padding: 1 }}>
      <TitleBar title={title} onClose={onClose} />
      {children}
    </Bevel>
  );
}

type DialogProps = {
  visible: boolean;
  title: string;
  icon?: 'i' | '!' | '?';
  children: ReactNode;
  buttons: { label: string; onPress: () => void; isDefault?: boolean }[];
  onClose?: () => void;
};

export function Dialog({ visible, title, icon = 'i', children, buttons, onClose }: DialogProps) {
  const t = useTheme();
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 50, elevation: 50 }]}>
      {/* flex: 0 で Bevel既定のflex:1を打ち消す。高さ自動＋横幅固定の親でflex:1のままだと
          Yogaの高さ計算が不定になり、実機で中身が潰れて表示されることがあるため */}
      <Bevel style={{ width: 300, alignSelf: 'center' }} innerStyle={{ padding: 1, flex: 0 }}>
        <TitleBar title={title} onClose={onClose} compact />
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: t.cell,
              borderWidth: 2,
              borderColor: t.titleFrom,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RText style={{ color: t.titleFrom, fontSize: 18, fontWeight: 'bold' }}>{icon}</RText>
          </View>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 14, paddingTop: 4 }}>
          {buttons.map((b) => (
            <RButton key={b.label} label={b.label} onPress={b.onPress} isDefault={b.isDefault} style={{ minWidth: 84 }} />
          ))}
        </View>
      </Bevel>
    </View>
  );
}

export function Sunken({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Bevel type="sunken" style={style} innerStyle={{ justifyContent: 'center', paddingHorizontal: 4 }}>
      {children}
    </Bevel>
  );
}
