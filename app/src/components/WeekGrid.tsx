import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { ErrorState, Loading, Screen } from './Screen';
import { SportIcon } from './SportIcon';
import { Text } from './Text';
import { accent, createStyles, radius, sports, useTheme } from '@/theme';
import { addDays, formatWeekRange, mondayOf, todayISO, weekDays } from '@/lib/dates';
import { formatDuration, formatKm } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useQuery } from '@/lib/query';
import { useXWide } from '@/lib/layout';
import type { AthleteSummary, Workout } from '@/lib/types';

const DAY = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function StatusIcon({ w, today }: { w: Workout; today: string }) {
  const { colors } = useTheme();
  if (w.status === 'done') return <MaterialCommunityIcons name="check-circle" size={16} color={accent.green} accessibilityLabel="Hecho" />;
  if (w.status === 'skipped') return <MaterialCommunityIcons name="close-circle-outline" size={16} color={colors.textSecondary} accessibilityLabel="No hecho" />;
  if (w.date < today) return <MaterialCommunityIcons name="alert-circle-outline" size={16} color={accent.amber} accessibilityLabel="Sin registrar" />;
  return <MaterialCommunityIcons name="clock-outline" size={16} color={accent.blue} accessibilityLabel="Planificado" />;
}

/**
 * Calendario semanal en columnas (iPad): los siete días a la vez, como en el panel de escritorio.
 * Atleta: su semana. Entrenador: la de todo el equipo, con filtro por atleta y «+» para planificar.
 */
export function WeekGrid({ coach }: { coach?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const xwide = useXWide();   // (reservado: en pantallas estrechas las columnas se estrechan en vez de desbordar)
  const today = todayISO();
  const [monday, setMonday] = useState(mondayOf(today));
  const [who, setWho] = useState<string | null>(null);
  const days = weekDays(monday);
  const { data, error, refreshing, refresh, loading } = useQuery<{ workouts: Workout[] }>(`/workouts?from=${monday}&to=${addDays(monday, 6)}${who ? `&athleteId=${who}` : ''}`);
  const { data: team } = useQuery<{ athletes: AthleteSummary[] }>(coach ? '/athletes' : null);

  const byDay = useMemo(() => {
    const m: Record<string, Workout[]> = {};
    for (const w of data?.workouts ?? []) (m[w.date] ??= []).push(w);
    return m;
  }, [data]);
  const total = data?.workouts.length ?? 0, done = (data?.workouts ?? []).filter((w) => w.status === 'done').length;
  const go = (d: number) => { haptic.select(); setMonday(addDays(monday, 7 * d)); };
  const add = (date: string) => router.push({ pathname: '/workout/edit', params: { date, ...(who ? { athleteId: who } : {}) } });

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} webTitle="Calendario">
      <View style={styles.nav}>
        <View style={{ flex: 1 }}>
          <Text variant="title2" mono>{formatWeekRange(monday)}</Text>
          <Text variant="footnote" secondary>{total} {total === 1 ? 'sesión' : 'sesiones'} · {done} hechas{total ? ` (${Math.round((done / total) * 100)} %)` : ''}</Text>
        </View>
        {monday !== mondayOf(today) ? (
          <PressableScale scale={0.94} onPress={() => { haptic.select(); setMonday(mondayOf(today)); }} style={styles.pill}><Text variant="subhead" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Hoy</Text></PressableScale>
        ) : null}
        <PressableScale scale={0.9} onPress={() => go(-1)} style={styles.circle} accessibilityLabel="Semana anterior"><MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} /></PressableScale>
        <PressableScale scale={0.9} onPress={() => go(1)} style={styles.circle} accessibilityLabel="Semana siguiente"><MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} /></PressableScale>
      </View>

      {coach && team ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[{ id: null as string | null, name: 'Todo el equipo' }, ...team.athletes].map((a) => {
            const on = who === a.id;
            return (
              <PressableScale key={a.id ?? 'all'} scale={0.95} onPress={() => { haptic.select(); setWho(a.id); }} accessibilityState={{ selected: on }}>
                <View style={[styles.chip, on && { backgroundColor: colors.text }]}><Text variant="subhead" color={on ? colors.bg : colors.text}>{a.name}</Text></View>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}

      {error && !data ? <ErrorState message={error.message} onRetry={refresh} /> : loading && !data ? <Loading /> : (
        <View style={styles.grid}>
          {days.map((d, i) => {
            const items = byDay[d] ?? [], isToday = d === today;
            return (
              <View key={d} style={[styles.col, { minWidth: xwide ? 0 : '13%' }, isToday && { borderColor: accent.coral }]} accessibilityLabel={`${DAY[i]} ${Number(d.slice(8))}`}>
                <View style={styles.colHead}>
                  <Text variant="caption" secondary style={{ fontSize: 10 }}>{DAY[i]}</Text>
                  <Text style={[styles.dayNum, isToday && { color: accent.coral }]}>{Number(d.slice(8))}</Text>
                  {coach ? <PressableScale scale={0.9} onPress={() => add(d)} accessibilityLabel={`Nuevo entreno el ${d}`} style={styles.plus}><MaterialCommunityIcons name="plus" size={16} color={colors.textSecondary} /></PressableScale> : null}
                </View>
                {items.length === 0 ? <Text variant="footnote" tertiary>Descanso</Text> : items.map((w) => (
                  <PressableScale key={w.id} scale={0.97} onPress={() => router.push(`/workout/${w.id}`)} accessibilityLabel={`${w.title}${coach ? `, ${w.athleteName}` : ''}`}>
                    <View style={[styles.card, { borderColor: sports[w.sport].color + '66' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <SportIcon sport={w.sport} size={22} />
                        <Text variant="footnote" numberOfLines={2} style={{ flex: 1, minWidth: 0, fontFamily: 'PlusJakartaSans_700Bold' }}>{w.title}</Text>
                      </View>
                      {coach ? <Text variant="footnote" secondary numberOfLines={1}>{w.athleteName}</Text> : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text variant="footnote" secondary numberOfLines={2} style={{ flex: 1, minWidth: 0 }}>{[w.durationMin ? formatDuration(w.durationMin) : '', w.distanceKm ? formatKm(w.distanceKm) : ''].filter((x) => x && x !== '—').join('\n') || `Z${w.zone}`}</Text>
                        <StatusIcon w={w} today={today} />
                      </View>
                    </View>
                  </PressableScale>
                ))}
              </View>
            );
          })}
        </View>
      )}
      <Text variant="footnote" tertiary>Toca una sesión para abrirla.</Text>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: 19, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  col: { flex: 1, gap: 8, padding: 8, minHeight: 360, backgroundColor: colors.surface, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  colHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 2 },
  dayNum: { fontFamily: 'PlusJakartaSans_300Light', fontSize: 26, lineHeight: 30, letterSpacing: -1, color: colors.text, flex: 1 },
  plus: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 5, padding: 8, borderRadius: 16, borderCurve: 'continuous', borderWidth: 1, backgroundColor: colors.surface2 },
}));
