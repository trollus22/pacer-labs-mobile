import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Text } from '../Text';
import { accent, createStyles, spring, useTheme } from '@/theme';

// Escala del ratio de carga (media diaria de 7 días ÷ media diaria de 28 días).
const MIN = 0.4, MAX = 2.0;
const ZONES = [
  { label: 'Baja', from: MIN, to: 0.8, color: accent.blue },
  { label: 'Óptima', from: 0.8, to: 1.3, color: accent.green },
  { label: 'Alta', from: 1.3, to: 1.5, color: accent.amber },
  { label: 'Muy alta', from: 1.5, to: MAX, color: accent.coral },
];

export function LoadMeter({ ratio, acute, chronic, enough }: { ratio: number | null; acute: number; chronic: number; enough: boolean }) {
  const { ink } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const pos = ratio == null ? null : (Math.min(MAX, Math.max(MIN, ratio)) - MIN) / (MAX - MIN);
  useEffect(() => {
    if (pos == null || !w) return;
    if (reduced) x.set(pos * w); else x.set(withSpring(pos * w, spring.settle));
  }, [pos, w, reduced, x]);
  const marker = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() - 7 }] }));
  const zone = ratio == null ? null : ZONES.find((z) => ratio < z.to) ?? ZONES[ZONES.length - 1];

  return (
    <View style={styles.card}>
      <Text variant="caption" secondary>Carga de entrenamiento</Text>
      <View style={styles.head}>
        <Text style={styles.value}>{ratio == null ? '—' : `×${ratio.toFixed(2).replace('.', ',')}`}</Text>
        {zone ? <Text variant="headline" color={zone.color}>{zone.label}</Text> : null}
      </View>

      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={styles.bar}>
          {ZONES.map((z) => (
            <View key={z.label} style={{ flex: z.to - z.from, backgroundColor: z.color, opacity: zone?.label === z.label ? 1 : 0.5 }} />
          ))}
        </View>
        {pos != null ? <Animated.View style={[styles.marker, marker]} /> : null}
        <View style={styles.labels}>
          {ZONES.map((z) => (
            <Text key={z.label} variant="caption" tertiary style={{ flex: z.to - z.from, fontSize: 9, textAlign: 'center' }} color={zone?.label === z.label ? ink(z.color) : undefined}>{z.label}</Text>
          ))}
        </View>
      </View>

      <Text variant="footnote" secondary>
        {enough
          ? `Media diaria de 7 días: ${Math.round(acute)} · de 28 días: ${Math.round(chronic)} (esfuerzo × minutos).`
          : 'Aún hay poca historia para medir la carga: hacen falta unas 2 semanas con 6 sesiones.'}
      </Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: { gap: 12, padding: 18, backgroundColor: colors.surface, borderRadius: 32, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  value: { fontFamily: 'Inter_300Light', fontSize: 42, lineHeight: 46, letterSpacing: -1.8, color: colors.text },
  bar: { flexDirection: 'row', height: 10, gap: 2 },
  marker: { position: 'absolute', top: -3, width: 14, height: 16, borderRadius: 7, backgroundColor: colors.text, borderWidth: 3, borderColor: colors.surface },
  labels: { flexDirection: 'row', marginTop: 8 },
}));
