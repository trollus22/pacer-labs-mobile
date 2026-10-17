import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { SportIcon, sportGlyph } from './SportIcon';
import { Text } from './Text';
import { ZoneBar } from './ZoneBar';
import { Button } from './Button';
import { MeshGradient } from './MeshGradient';
import { ArrowButton, IconCircle } from './Tile';
import { rpeColor, sportMesh, sports, zones, accent, useTheme, createStyles } from '@/theme';
import { formatDuration, formatKm } from '@/lib/format';
import type { Workout } from '@/lib/types';

export function summaryLine(w: Workout) {
  return [w.durationMin ? formatDuration(w.durationMin) : null, w.distanceKm ? formatKm(w.distanceKm) : null, zones[w.zone - 1]?.label].filter(Boolean).join(' · ');
}

function StatusGlyph({ status }: { status: Workout['status'] }) {
  const { colors } = useTheme();
  if (status === 'done') return <MaterialCommunityIcons name="check-circle" size={24} color={accent.green} accessibilityLabel="Completado" />;
  if (status === 'skipped') return <MaterialCommunityIcons name="minus-circle" size={24} color={colors.textTertiary} accessibilityLabel="Omitido" />;
  return <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />;
}

/** Fila compacta (calendario, ficha de atleta). */
export function WorkoutRow({ workout, onPress, caption }: { workout: Workout; onPress: () => void; caption?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <PressableScale onPress={onPress} style={styles.row} accessibilityLabel={`${workout.title}. ${summaryLine(workout)}`}>
      <SportIcon sport={workout.sport} />
      <View style={styles.rowText}>
        <Text variant="headline" numberOfLines={1}>{workout.title}</Text>
        <Text variant="footnote" color={colors.textSecondary} numberOfLines={1}>{caption ?? summaryLine(workout)}</Text>
      </View>
      <StatusGlyph status={workout.status} />
    </PressableScale>
  );
}

/** Tarjeta grande del entreno del día: cristal de malla con los colores del deporte, círculo de trazo fino y botón ↗. */
export function WorkoutHero({ workout, onPress, cta, extra }: { workout: Workout; onPress: () => void; cta?: { label: string; onPress: () => void }; extra?: React.ReactNode }) {
  const styles = useStyles();
  const r = workout.result;
  return (
    <PressableScale onPress={onPress} scale={0.98} style={styles.hero} accessibilityLabel={`${workout.title}. ${summaryLine(workout)}`}>
      <MeshGradient mesh={sportMesh(workout.sport)} />
      <View style={styles.heroTop}>
        <IconCircle icon={sportGlyph(workout.sport)} color="#FFFFFF" />
        <View style={styles.heroTags}>
          <Text variant="caption" color="rgba(255,255,255,0.85)" style={{ fontSize: 10.5 }}>{sports[workout.sport].label}</Text>
          {workout.status === 'done' ? (
            <View style={styles.glass}>
              <MaterialCommunityIcons name="check-circle" size={14} color={accent.green} />
              <Text variant="caption" color="#fff" style={{ fontSize: 9.5 }}>Completado</Text>
            </View>
          ) : null}
          {workout.status === 'skipped' ? <View style={styles.glass}><Text variant="caption" color="#fff" style={{ fontSize: 9.5 }}>Omitido</Text></View> : null}
        </View>
        <ArrowButton onGlass />
      </View>
      <View style={styles.heroBottom}>
        <Text variant="title1" color="#fff" numberOfLines={2}>{workout.title}</Text>
        {workout.description ? <Text variant="subhead" color="rgba(255,255,255,0.74)" numberOfLines={2}>{workout.description}</Text> : null}
        <View style={styles.metrics}>
          <Metric label="Tiempo" value={formatDuration(workout.durationMin)} />
          {workout.distanceKm ? <Metric label="Distancia" value={formatKm(workout.distanceKm)} /> : null}
          <View style={{ flex: 1 }} />
          <ZoneBar zone={workout.zone} track="rgba(255,255,255,0.28)" />
        </View>
        {r && r.rpe ? (
          <View style={styles.rpeRow}>
            <View style={[styles.rpeDot, { backgroundColor: rpeColor(r.rpe) }]} />
            <Text variant="footnote" color="rgba(255,255,255,0.85)">Esfuerzo <Text variant="footnote" mono color="#fff">{r.rpe}/10</Text></Text>
          </View>
        ) : null}
        {cta ? <View style={{ marginTop: 6 }}><Button title={cta.label} onPress={cta.onPress} /></View> : null}
        {extra ? <View style={{ marginTop: 6 }}>{extra}</View> : null}
      </View>
    </PressableScale>
  );
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <View style={{ gap: 2 }}>
    <Text variant="caption" color="rgba(255,255,255,0.55)" style={{ fontSize: 9 }}>{label}</Text>
    <Text variant="numeralSm" color="#fff" style={{ fontSize: 26, lineHeight: 30 }}>{value}</Text>
  </View>
);

const useStyles = createStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: colors.surface, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  rowText: { flex: 1, gap: 2 },
  hero: { minHeight: 320, borderRadius: 32, borderCurve: 'continuous', overflow: 'hidden', padding: 16, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroTags: { flex: 1, gap: 6, paddingTop: 2 },
  glass: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroBottom: { gap: 8, marginTop: 28 },
  metrics: { flexDirection: 'row', alignItems: 'flex-end', gap: 22, marginTop: 6 },
  rpeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rpeDot: { width: 8, height: 8, borderRadius: 4 },
}));
