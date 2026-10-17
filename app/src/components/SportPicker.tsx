import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { SportIcon } from './SportIcon';
import { Text } from './Text';
import { SPORT_IDS, createStyles, sports, useTheme, type Sport } from '@/theme';
import { alpha } from '@/lib/color';
import { haptic } from '@/lib/haptics';

type Props = {
  /** Un deporte (elección única) o varios (selección múltiple). */
  value: Sport | Sport[];
  onChange: (s: Sport) => void;
  /** Deportes del usuario: se muestran los primeros y marcados. */
  favorites?: Sport[];
};

/** Cuadrícula de deportes (4 por fila). Con `favorites`, esos van primero. */
export function SportPicker({ value, onChange, favorites = [] }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const sel = Array.isArray(value) ? value : [value];
  const order = [...favorites.filter((s) => SPORT_IDS.includes(s)), ...SPORT_IDS.filter((s) => !favorites.includes(s))];
  return (
    <View style={styles.grid}>
      {order.map((s) => {
        const on = sel.includes(s);
        return (
          <View key={s} style={styles.cell}>
            <PressableScale scale={0.95} onPress={() => { haptic.select(); onChange(s); }} accessibilityState={{ selected: on }} accessibilityLabel={sports[s].label}>
              <Animated.View style={[styles.tile, on ? { borderColor: sports[s].color, backgroundColor: alpha(sports[s].color, 0.14) } : { borderColor: 'transparent', backgroundColor: colors.surface2 }, { transitionProperty: ['backgroundColor', 'borderColor'], transitionDuration: '160ms' }]}>
                <SportIcon sport={s} size={36} solid={on} />
                <Text variant="caption" color={on ? colors.text : colors.textSecondary} numberOfLines={1} style={{ fontSize: 9 }}>{sports[s].label}</Text>
              </Animated.View>
            </PressableScale>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createStyles(() => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '23.2%' },
  tile: { alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 2, borderRadius: 18, borderCurve: 'continuous', borderWidth: 1.5 },
}));
