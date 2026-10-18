import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ring } from '../Ring';
import { StatusBadge } from '../StatusBadge';
import { Text } from '../Text';
import { createStyles, useTheme } from '@/theme';
import { CONFIDENCE, DRIVER_ICON, STATUS, scoreColor } from '@/lib/status';
import type { Dashboard } from '@/lib/types';

const PARTS: { key: 'wellness' | 'load' | 'subjective'; label: string }[] = [
  { key: 'wellness', label: 'Bienestar' },
  { key: 'load', label: 'Carga' },
  { key: 'subjective', label: 'Sensaciones' },
];

// Recuperación estimada: nota 0–100, estado (icono + etiqueta), de qué componentes sale y los motivos concretos.
export function ReadinessCard({ current }: { current: Dashboard['current'] }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  const st = STATUS[current.status];
  const score = current.score;
  return (
    <View style={styles.card}>
      <Text variant="caption" secondary>Recuperación</Text>
      <View style={styles.top}>
        <Ring size={112} stroke={13} progress={score == null ? 0 : score / 100} color={st.color}>
          <Text style={styles.score}>{score ?? '—'}</Text>
          <Text variant="caption" tertiary style={{ fontSize: 9 }}>de 100</Text>
        </Ring>
        <View style={styles.side}>
          <StatusBadge label={st.long} icon={st.icon} color={st.color} />
          <Text variant="footnote" secondary>{CONFIDENCE[current.confidence]}</Text>
          <View style={styles.parts}>
            {PARTS.map((p) => {
              const v = current.components[p.key];
              return (
                <View key={p.key} style={styles.part}>
                  <Text variant="footnote" secondary style={{ width: 84 }}>{p.label}</Text>
                  <View style={styles.track}>{v != null ? <View style={[styles.fill, { width: `${v}%`, backgroundColor: scoreColor(v) }]} /> : null}</View>
                  <Text variant="footnote" mono style={{ width: 24, textAlign: 'right' }} color={v == null ? colors.textTertiary : ink(scoreColor(v))}>{v ?? '—'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.why}>
        <Text variant="caption" secondary>Por qué</Text>
        {current.drivers.length === 0 ? (
          <Text variant="subhead" secondary>Todavía no hay datos suficientes para explicarlo.</Text>
        ) : current.drivers.slice(0, 5).map((d) => (
          <View key={d.key + d.text} style={styles.driver}>
            <MaterialCommunityIcons name={DRIVER_ICON[d.tone].icon} size={17} color={ink(DRIVER_ICON[d.tone].color)} style={{ marginTop: 1 }} />
            <Text variant="subhead" style={{ flex: 1 }}>{d.text}</Text>
          </View>
        ))}
      </View>
      <Text variant="footnote" tertiary>Estimación a partir de la carga, las sensaciones y el check-in. Es orientativa y no sustituye a un profesional.</Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: { gap: 14, padding: 18, backgroundColor: colors.surface, borderRadius: 32, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  top: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  score: { fontFamily: 'Inter_300Light', fontSize: 40, lineHeight: 44, letterSpacing: -1.6, color: colors.text },
  side: { flex: 1, gap: 8 },
  parts: { gap: 6, marginTop: 4 },
  part: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  why: { gap: 8, paddingTop: 4 },
  driver: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
}));
