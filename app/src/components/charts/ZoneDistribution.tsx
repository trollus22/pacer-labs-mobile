import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Text } from '../Text';
import { createStyles, zones } from '@/theme';
import { formatDuration } from '@/lib/format';
import { EASE_OUT } from '@/lib/motion';

// Tiempo por zona de intensidad. Escala ordenada (frío → caliente) con etiquetas siempre visibles:
// el color solo no basta (ámbar y verde se confunden con algunos tipos de daltonismo).
export function ZoneDistribution({ minutes }: { minutes: number[] }) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const total = minutes.reduce((a, b) => a + b, 0);
  const reveal = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) reveal.set(withTiming(1, { duration: 700, easing: EASE_OUT })); }, [reduced, reveal]);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: reveal.get() }], transformOrigin: 'left center' }));
  const hard = total ? Math.round(((minutes[3] + minutes[4]) / total) * 100) : 0;

  return (
    <View style={styles.card}>
      <Text variant="caption" secondary>Intensidad</Text>
      <View style={styles.head}>
        <Text style={styles.value}>{total ? formatDuration(total) : '—'}</Text>
        {total ? <Text variant="footnote" secondary>{hard} % en zonas 4–5</Text> : null}
      </View>
      {total === 0 ? (
        <Text variant="footnote" tertiary>Todavía no hay entrenos completados en este periodo.</Text>
      ) : (
        <>
          <Animated.View style={[styles.bar, barStyle]} accessibilityRole="image" accessibilityLabel={`Tiempo por zona: ${minutes.map((m, i) => `zona ${i + 1}, ${Math.round((m / total) * 100)} por ciento`).join('; ')}`}>
            {minutes.map((m, i) => (m > 0 ? <View key={i} style={{ flex: m, backgroundColor: zones[i].color }} /> : null))}
          </Animated.View>
          <View style={styles.rows}>
            {minutes.map((m, i) => (
              <View key={i} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: zones[i].color }]} />
                <Text variant="subhead" style={{ flex: 1 }}>Z{i + 1} · {zones[i].label}</Text>
                <Text variant="footnote" mono secondary>{m ? formatDuration(m) : '—'}</Text>
                <Text variant="footnote" mono tertiary style={{ width: 40, textAlign: 'right' }}>{m ? `${Math.round((m / total) * 100)}%` : ''}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: { gap: 12, padding: 18, backgroundColor: colors.surface, borderRadius: 32, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  value: { fontFamily: 'PlusJakartaSans_300Light', fontSize: 42, lineHeight: 46, letterSpacing: -1.8, color: colors.text },
  // Los segmentos se separan con un hueco de 2 px del color de la superficie (sin bordes).
  bar: { flexDirection: 'row', height: 14, gap: 2, borderRadius: 7, overflow: 'hidden' },
  rows: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
}));
