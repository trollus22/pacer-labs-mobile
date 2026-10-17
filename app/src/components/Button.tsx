import { ActivityIndicator } from 'react-native';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { radius, accent, useTheme, createStyles } from '@/theme';

type Props = {
  title: string;
  onPress?: () => void;
  /** primary: pastilla blanca (el blanco sobre coral no llega a AA). accent: color de énfasis. ghost: sobre superficie. */
  kind?: 'primary' | 'accent' | 'ghost' | 'danger';
  /** Color del botón `accent` (por defecto, coral). */
  tint?: string;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
};

export function Button({ title, onPress, kind = 'primary', tint = accent.coral, loading, disabled, small }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const outline = kind === 'ghost' || kind === 'danger';
  const bg = kind === 'primary' ? colors.text : kind === 'accent' ? tint : 'transparent';
  const fg = kind === 'primary' ? colors.bg : kind === 'accent' ? colors.onAccent : kind === 'danger' ? accent.pink : colors.text;
  return (
    <PressableScale
      onPress={loading || disabled ? undefined : onPress}
      feedback={kind !== 'ghost'}
      disabled={disabled || loading}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={[styles.base, small && styles.small, { backgroundColor: bg, opacity: disabled ? 0.4 : 1 }, outline && { borderWidth: 1, borderColor: kind === 'danger' ? 'rgba(255,55,95,0.55)' : colors.hairline }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text variant="headline" color={fg}>{title}</Text>}
    </PressableScale>
  );
}

const useStyles = createStyles((colors) => ({
  base: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderCurve: 'continuous' },
  small: { height: 44, paddingHorizontal: 20 },
}));
