import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { accent, fonts, type, useTheme } from '@/theme';

// Los acentos usados como texto se oscurecen solos en modo claro (si no, el ámbar o el coral no se leen sobre blanco).
const ACCENTS = new Set<string>(Object.values(accent));

export type TextVariant = keyof typeof type;
type Props = RNTextProps & {
  variant?: TextVariant;
  color?: string;
  /** Cifras de telemetría: JetBrains Mono, tabulares. */
  mono?: boolean;
  center?: boolean;
  /** Atajos a los tonos de texto secundario y terciario del tema. */
  secondary?: boolean;
  tertiary?: boolean;
};

export function Text({ variant = 'body', color, mono, center, secondary, tertiary, style, ...rest }: Props) {
  const { colors, ink } = useTheme();
  const resolved = color ?? (secondary ? colors.textSecondary : tertiary ? colors.textTertiary : colors.text);
  const base = type[variant] as TextStyle;
  return (
    <RNText
      maxFontSizeMultiplier={1.35}
      {...rest}
      style={[base, { color: ACCENTS.has(resolved) ? ink(resolved) : resolved }, mono && { fontFamily: fonts.monoBold, fontVariant: ['tabular-nums'] }, center && { textAlign: 'center' }, style]}
    />
  );
}
