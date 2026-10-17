import { View } from 'react-native';
import { Text } from './Text';
import { createStyles, sports, useTheme, type Sport } from '@/theme';
import { alpha } from '@/lib/color';
import { describe } from '@/lib/session';
import type { SessionItem } from '@/lib/types';

/** Los ejercicios de la sesión, uno por tarjeta: nombre, cifra grande (series × repeticiones, metros o tiempo) y descanso o peso. */
export function ExerciseList({ items, sport }: { items: SessionItem[]; sport: Sport }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = sports[sport].color;
  return (
    <View style={{ gap: 8 }} accessibilityRole="list">
      {items.map((it, i) => {
        const d = describe(it);
        return (
          <View key={`${it.name}-${i}`} style={styles.card} accessible accessibilityLabel={`${i + 1}. ${it.name}. ${d.main}. ${d.chips.join('. ')}`}>
            <View style={[styles.num, { backgroundColor: alpha(color, 0.18) }]}><Text variant="footnote" mono color={colors.text}>{i + 1}</Text></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="headline" numberOfLines={2}>{it.name}</Text>
              {d.chips.length || it.note ? <Text variant="footnote" secondary>{[...d.chips.filter((c) => c !== 'repeticiones'), it.note].filter(Boolean).join(' · ')}</Text> : null}
            </View>
            <Text variant="numeralSm" style={{ fontSize: 26, lineHeight: 30 }} numberOfLines={1}>{d.main}</Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderRadius: 22, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
}));
