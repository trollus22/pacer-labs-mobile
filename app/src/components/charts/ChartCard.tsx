import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { createStyles } from '@/theme';

// Marco común: título en versalitas, cifra grande (la del punto que se está tocando o la última) y fecha/contexto a la derecha.
export function ChartCard({ title, value, unit, caption, children, legend, note }: {
  title: string;
  value?: string | null;
  unit?: string;
  /** Contexto a la derecha de la cifra (p. ej. la fecha del punto tocado). */
  caption?: string;
  children: ReactNode;
  legend?: { label: string; color: string }[];
  note?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text variant="caption" style={styles.title} secondary>{title}</Text>
      <View style={styles.head}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value ?? '—'}</Text>
          {unit ? <Text variant="callout" style={styles.unit} secondary>{unit}</Text> : null}
        </View>
        {caption ? <Text variant="footnote" secondary>{caption}</Text> : null}
      </View>
      {children}
      {legend && legend.length > 1 ? (
        <View style={styles.legend}>
          {legend.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: l.color }]} />
              <Text variant="footnote" secondary>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {note ? <Text variant="footnote" tertiary>{note}</Text> : null}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: { gap: 8, padding: 18, backgroundColor: colors.surface, borderRadius: 32, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  title: { fontSize: 11 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  // Cifra principal: proporcional (no tabular), misma fuente que el resto, nunca decorativa.
  value: { fontFamily: 'Inter_300Light', fontSize: 42, lineHeight: 46, letterSpacing: -1.8, color: colors.text },
  unit: {},
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 3, borderRadius: 2 },
}));
