import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { createStyles, radius, useTheme } from '@/theme';
import { CSS_EASE_OUT } from '@/lib/motion';
import { haptic } from '@/lib/haptics';

export type Choice = { label: string; color: string };

/** Fila de 5 opciones numeradas (1–5) con etiqueta; la elegida se rellena con su color. */
export function ChoiceRow({ choices, value, onChange, label }: { choices: Choice[]; value: number | null; onChange: (v: number) => void; label: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {choices.map((c, i) => {
        const on = value === i + 1;
        return (
          <PressableScale key={c.label} scale={0.94} style={{ flex: 1 }} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${i + 1}, ${c.label}`}
            onPress={() => { haptic.select(); onChange(i + 1); }}>
            <Animated.View style={[styles.tile, on ? { backgroundColor: c.color, transform: [{ scale: 1.05 }] } : { backgroundColor: colors.surface3, transform: [{ scale: 1 }] }, { transitionProperty: ['backgroundColor', 'transform'], transitionDuration: '180ms', transitionTimingFunction: CSS_EASE_OUT }]}>
              <Text variant="title3" mono color={on ? colors.onAccent : colors.text}>{i + 1}</Text>
              <Text variant="caption" color={on ? colors.onAccent : colors.textTertiary} style={{ fontSize: 8.5, letterSpacing: 0.3 }} numberOfLines={1}>{c.label}</Text>
            </Animated.View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = createStyles(() => ({
  row: { flexDirection: 'row', gap: 8 },
  tile: { height: 70, borderRadius: radius.md, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', gap: 4 },
}));
