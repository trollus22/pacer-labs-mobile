import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, Keyframe } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Loading, ErrorState } from './Screen';
import { WeekStrip, type DayMark } from './WeekStrip';
import { ArchRow, TickBars } from './micro';
import { Tile, TileGrid } from './Tile';
import { Text } from './Text';
import { PressableScale } from './PressableScale';
import { Empty } from './Empty';
import { SendToWatch } from './SendToWatch';
import { WorkoutHero, WorkoutRow } from './WorkoutCards';
import { radius, sports, accent, useTheme, createStyles } from '@/theme';
import { addDays, formatLong, formatWeekRange, fromISO, mondayOf, relativeDay, todayISO, weekDays } from '@/lib/dates';
import { formatDuration } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { EASE_OUT } from '@/lib/motion';
import { useQuery } from '@/lib/query';
import { useWide } from '@/lib/layout';
import type { Workout } from '@/lib/types';

const DAY_ENTER = FadeInDown.duration(240).easing(EASE_OUT);

type Props = {
  /** Solo el entrenador: ver la semana de un atleta. */
  athleteId?: string;
  /** Tarjetas grandes (Hoy) o filas compactas (Calendario). */
  hero?: boolean;
  /** Flechas para cambiar de semana. */
  nav?: boolean;
  /** Entrenador: añadir un entreno el día elegido. */
  onAdd?: (date: string) => void;
  /** El atleta puede registrar el entreno desde la tarjeta. */
  canLog?: boolean;
  webTitle?: string;
  /** Contenido fijo encima del resumen (p. ej. el check-in de hoy). */
  top?: React.ReactNode;
};

export function WeekView({ athleteId, hero, nav, onAdd, canLog, webTitle, top }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const wide = useWide();
  const today = todayISO();
  const currentMonday = mondayOf(today);
  const [monday, setMonday] = useState(currentMonday);
  const [selected, setSelected] = useState(today);
  const [dir, setDir] = useState(1);
  const days = weekDays(monday);
  const path = `/workouts?from=${monday}&to=${addDays(monday, 6)}${athleteId ? `&athleteId=${athleteId}` : ''}`;
  const { data, error, refreshing, refresh, loading } = useQuery<{ workouts: Workout[] }>(path);

  const weekEnter = useMemo(
    () => new Keyframe({ from: { opacity: 0, transform: [{ translateX: 28 * dir }] }, to: { opacity: 1, transform: [{ translateX: 0 }], easing: EASE_OUT } }).duration(280),
    [dir],
  );

  const workouts = useMemo(() => data?.workouts ?? [], [data]);
  const byDay = useMemo(() => {
    const m: Record<string, Workout[]> = {};
    for (const w of workouts) (m[w.date] ??= []).push(w);
    return m;
  }, [workouts]);
  const marks = useMemo(() => {
    const m: Record<string, DayMark[]> = {};
    for (const w of workouts) (m[w.date] ??= []).push({ color: sports[w.sport].color, done: w.status === 'done' });
    return m;
  }, [workouts]);

  const planned = workouts.length;
  const done = workouts.filter((w) => w.status === 'done');
  const km = done.reduce((a, w) => a + (w.result?.distanceKm ?? w.distanceKm ?? 0), 0);
  const min = done.reduce((a, w) => a + (w.result?.durationMin ?? w.durationMin ?? 0), 0);

  const weekDone = days.map((d) => (byDay[d] ?? []).some((w) => w.status === 'done'));
  const weekKm = days.map((d) => (byDay[d] ?? []).reduce((a, w) => a + (w.status === 'done' ? w.result?.distanceKm ?? w.distanceKm ?? 0 : 0), 0));
  const weekMin = days.map((d) => (byDay[d] ?? []).reduce((a, w) => a + (w.status === 'done' ? w.result?.durationMin ?? w.durationMin ?? 0 : 0), 0));

  const go = (delta: number) => {
    haptic.select();
    const next = addDays(monday, 7 * delta);
    setDir(delta);
    setMonday(next);
    setSelected(today >= next && today <= addDays(next, 6) ? today : next);
  };
  const weeksFromNow = Math.round((fromISO(monday).getTime() - fromISO(currentMonday).getTime()) / (7 * 86400000));
  const weekLabel = weeksFromNow === 0 ? 'Esta semana' : weeksFromNow === -1 ? 'Semana pasada' : weeksFromNow === 1 ? 'Próxima semana' : weeksFromNow < 0 ? `Hace ${-weeksFromNow} semanas` : `Dentro de ${weeksFromNow} semanas`;

  const dayItems = byDay[selected] ?? [];
  const open = (w: Workout) => router.push(`/workout/${w.id}`);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} webTitle={webTitle}>
      {top}
      {nav ? (
        <View style={styles.navRow}>
          <View style={{ flex: 1 }}>
            <Text variant="title2" mono>{formatWeekRange(monday)}</Text>
            <Text variant="footnote" color={colors.textSecondary}>{weekLabel}</Text>
          </View>
          {weeksFromNow !== 0 && (
            <PressableScale scale={0.94} onPress={() => { haptic.select(); setDir(weeksFromNow > 0 ? -1 : 1); setMonday(currentMonday); setSelected(today); }} style={styles.todayPill}>
              <Text variant="subhead" style={{ fontFamily: 'Inter_600SemiBold' }}>Hoy</Text>
            </PressableScale>
          )}
          <PressableScale scale={0.9} onPress={() => go(-1)} style={styles.circle} accessibilityLabel="Semana anterior">
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </PressableScale>
          <PressableScale scale={0.9} onPress={() => go(1)} style={styles.circle} accessibilityLabel="Semana siguiente">
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </PressableScale>
        </View>
      ) : null}

      <Animated.View key={monday} entering={weekEnter} style={styles.week}>
        <TileGrid>
          <Tile
            span={wide ? 1 : 2} variant="glass" icon="calendar-check-outline" title="Esta semana" value={String(done.length)} unit={`de ${planned} entrenos`}
            note={planned ? (done.length === planned ? 'Semana completa' : `Faltan ${planned - done.length}`) : 'Sin entrenos planificados'}
            micro={<ArchRow n={7} filled={weekDone.filter(Boolean).length} width={150} />}
          />
          <Tile icon="map-marker-distance" title="Distancia" value={km ? String(Math.round(km * 10) / 10).replace('.', ',') : '—'} unit="km" micro={<TickBars values={weekKm} />} />
          <Tile icon="timer-outline" title="Tiempo" value={min ? formatDuration(min) : '—'} micro={<TickBars values={weekMin} />} />
        </TileGrid>

        <View style={wide && hero ? { flexDirection: 'row', gap: 24, alignItems: 'flex-start' } : undefined}>
          <View style={wide && hero ? { flex: 1.3, gap: 24 } : { gap: 24 }}>
        <WeekStrip days={days} selected={selected} onSelect={(d) => { setDir(d > selected ? 1 : -1); setSelected(d); }} marks={marks} />

        {error && !data ? (
          <ErrorState message={error.message} onRetry={refresh} />
        ) : loading ? (
          <Loading />
        ) : (
          <Animated.View key={selected} entering={DAY_ENTER} style={styles.day}>
            <View>
              <Text variant="title2">{relativeDay(selected)}</Text>
              <Text variant="footnote" color={colors.textSecondary}>{formatLong(selected)}</Text>
            </View>
            {dayItems.length === 0 ? (
              planned === 0 ? (
                <Empty
                  icon="calendar-blank-outline"
                  title="Sin plan esta semana"
                  body={onAdd ? 'Añade el primer entreno con el botón de abajo.' : 'Cuando tu entrenador añada entrenos, aparecerán aquí.'}
                />
              ) : (
                <Empty icon="weather-night" title="Día libre" body="Descansar también es entrenar. Aprovecha para recuperar." />
              )
            ) : (
              dayItems.map((w) =>
                hero ? (
                  <WorkoutHero
                    key={w.id}
                    workout={w}
                    onPress={() => open(w)}
                    cta={canLog && w.status === 'planned' && w.date <= today ? { label: 'Registrar entreno', onPress: () => router.push(`/log/${w.id}`) } : undefined}
                    extra={canLog && w.status === 'planned' ? <SendToWatch workoutId={w.id} onGlass /> : undefined}
                  />
                ) : (
                  <WorkoutRow key={w.id} workout={w} onPress={() => open(w)} />
                ),
              )
            )}
            {onAdd ? (
              <PressableScale onPress={() => onAdd(selected)} style={styles.add} feedback accessibilityLabel="Añadir entreno">
                <MaterialCommunityIcons name="plus" size={20} color={accent.coral} />
                <Text variant="headline" color={accent.coral}>Añadir entreno</Text>
              </PressableScale>
            ) : null}
          </Animated.View>
        )}
          </View>
          {wide && hero ? (
            <View style={{ flex: 1, gap: 12 }} accessibilityLabel="Tu semana">
              <Text variant="title3">Tu semana</Text>
              {days.map((d) => (byDay[d] ?? []).length === 0 ? null : (
                <View key={d} style={{ gap: 8 }}>
                  <Text variant="caption" secondary style={{ fontSize: 10 }}>{relativeDay(d)}</Text>
                  {byDay[d].map((w) => <WorkoutRow key={w.id} workout={w} onPress={() => open(w)} />)}
                </View>
              ))}
              {planned === 0 ? <Text variant="subhead" secondary>Sin entrenos esta semana.</Text> : null}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  todayPill: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  week: { gap: 24 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 22, padding: 18, backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  stats: { flex: 1, gap: 8 },
  statRow: { flexDirection: 'row', gap: 26 },
  day: { gap: 14 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(240,74,62,0.5)' },
}));
