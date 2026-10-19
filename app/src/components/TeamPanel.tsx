import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { BarChart, type BarDatum } from './charts/BarChart';
import { Sparkline } from './charts/Sparkline';
import { PressableScale } from './PressableScale';
import { ErrorState, Loading, Screen, Section } from './Screen';
import { Segmented } from './Segmented';
import { StatusBadge } from './StatusBadge';
import { DotScale, TickBars } from './micro';
import { Tile, TileGrid } from './Tile';
import { Text } from './Text';
import { accent, createStyles, useTheme } from '@/theme';
import { mondayOf, shortDate, todayISO } from '@/lib/dates';
import { CSS_EASE_OUT, EASE_OUT } from '@/lib/motion';
import { useQuery } from '@/lib/query';
import { useContentWidth } from '@/lib/layout';
import { STATUS } from '@/lib/status';
import { AskPacer } from './pacer/AskPacer';
import type { ReadinessStatus, TeamDashboard } from '@/lib/types';

type Days = '7' | '28' | '90';
const rowIn = (i: number) => FadeInDown.duration(300).delay(Math.min(i, 8) * 40).easing(EASE_OUT);

/** Pestaña «Panel» del entrenador: cómo está el equipo hoy y cómo evoluciona su carga y su cumplimiento. */
export function TeamPanel({ top }: { top?: ReactNode }) {
  const [days, setDays] = useState<Days>('28');
  const { kept: d, stale, error, refreshing, refresh } = useQuery<TeamDashboard>(`/dashboard/team?date=${todayISO()}&days=${days}`);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} webTitle="Panel">
      {top}
      <View style={{ maxWidth: 440, width: '100%' }}><AskPacer q="Resume quién necesita atención hoy" topic="team" /></View>
      <View style={{ maxWidth: 440, width: '100%' }}><Segmented value={days} onChange={setDays} options={[{ key: '7', label: '7 días' }, { key: '28', label: '4 semanas' }, { key: '90', label: '12 semanas' }]} /></View>
      {error && !d ? <ErrorState message={error.message} onRetry={refresh} /> : !d ? <Loading /> : <Body d={d} days={Number(days)} stale={stale} />}
    </Screen>
  );
}

function Body({ d, days, stale }: { d: TeamDashboard; days: number; stale: boolean }) {
  const wide = useContentWidth() >= 760;
  const currentMonday = mondayOf(todayISO());

  // Carga del equipo: por día hasta 4 semanas; por semana a partir de ahí (90 barras no se leen).
  const loadBars: BarDatum[] = useMemo(() => {
    if (days <= 28) return d.team.dailyLoad.map((p) => ({ label: shortDate(p.date), caption: shortDate(p.date), value: p.load }));
    const byWeek = new Map<string, number>();
    for (const p of d.team.dailyLoad) byWeek.set(mondayOf(p.date), (byWeek.get(mondayOf(p.date)) ?? 0) + p.load);
    return [...byWeek].map(([w, v]) => ({ label: shortDate(w), caption: `Semana del ${shortDate(w)}`, value: v, partial: w === currentMonday }));
  }, [d, days, currentMonday]);
  const weekly: BarDatum[] = d.team.weekly.map((w) => ({
    label: shortDate(w.weekStart), caption: `Semana del ${shortDate(w.weekStart)}`, value: w.planned ? (w.done / w.planned) * 100 : 0, partial: w.weekStart === currentMonday,
  }));

  const scores = d.athletes.map((a) => a.readiness.score).filter((v): v is number => v != null);
  const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;
  const lastDone = weekly.length ? Math.round(weekly[weekly.length - 1].value) : null;

  return (
    <Animated.View style={{ gap: 24, opacity: stale ? 0.45 : 1, transitionProperty: 'opacity', transitionDuration: '220ms', transitionTimingFunction: CSS_EASE_OUT }}>
      <TileGrid>
        <Tile
          span={2} variant="glass" icon="account-group-outline" title="Recuperación del equipo" value={avg == null ? '—' : String(avg)} unit="de 100"
          note={`${d.counts.ready} de ${d.athletes.length} atletas listos`}
          micro={<DotScale value={avg == null ? 0 : avg / 100} width={130} />}
        />
        {(['ready', 'caution', 'rest'] as ReadinessStatus[]).map((k) => (
          <Tile key={k} icon={STATUS[k].icon} iconColor={STATUS[k].color} title={STATUS[k].long} value={String(d.counts[k])} unit={d.counts[k] === 1 ? 'atleta' : 'atletas'} />
        ))}
        <Tile icon="target" title="Cumplimiento" value={lastDone == null ? '—' : String(lastDone)} unit="%" micro={<TickBars values={weekly.map((w) => w.value)} />} />
      </TileGrid>

      {wide && d.athletes.length > 0 ? (
        <Section title="Mapa de recuperación · 14 días">
          <ReadinessHeat athletes={d.athletes} />
        </Section>
      ) : null}

      <Section title="Recuperación del equipo">
        {d.athletes.length === 0 ? (
          <Text variant="subhead" secondary>Cuando tus atletas se registren con tu código, verás aquí cómo está cada uno.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {d.athletes.map((a, i) => <Animated.View key={a.id} entering={rowIn(i)} style={{ width: wide ? '49.3%' : '100%' }}><AthleteRow a={a} /></Animated.View>)}
          </View>
        )}
        <Text variant="footnote" tertiary>Ordenados de más a menos atención. Toca un atleta para ver su detalle.</Text>
      </Section>

      <Section title="Equipo">
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, width: '100%' }}><BarChart title={days <= 28 ? 'Carga diaria del equipo' : 'Carga semanal del equipo'} data={loadBars} color={accent.coral} headline="sum" caption={`Total ${days} días`} note="Suma de esfuerzo × minutos de todos los atletas." /></View>
          <View style={{ flex: 1, width: '100%' }}><BarChart title="Cumplimiento del equipo" data={weekly} color={accent.blue} unit="%" yMax={100} caption="Entrenos hechos ÷ planificados" /></View>
        </View>
      </Section>
    </Animated.View>
  );
}

/** Una fila por atleta y una celda por día: el número es la nota de recuperación y el color su estado. */
function ReadinessHeat({ athletes }: { athletes: TeamDashboard['athletes'] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const col = (v: number | null) => (v == null ? null : v >= 70 ? accent.green : v >= 45 ? accent.amber : accent.pink);
  return (
    <View style={styles.heat}>
      {athletes.map((a) => (
        <PressableScale key={a.id} scale={0.99} onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: a.id, name: a.name, tab: 'form' } })} accessibilityLabel={`${a.name}, últimos 14 días`}>
          <View style={styles.heatRow}>
            <Text variant="subhead" numberOfLines={1} style={{ width: 130, fontFamily: 'Inter_600SemiBold' }}>{a.name}</Text>
            <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
              {a.spark.slice(-14).map((v, i) => {
                const c = col(v);
                return <View key={i} style={[styles.cell, { backgroundColor: c ? c + '33' : colors.surface2, borderColor: c ? c + '88' : 'transparent' }]}><Text variant="footnote" mono style={{ fontSize: 10 }}>{v ?? '·'}</Text></View>;
              })}
            </View>
          </View>
        </PressableScale>
      ))}
      <Text variant="footnote" tertiary>Verde: listo (70 o más) · Ámbar: con precaución (45–69) · Rosa: descanso (menos de 45)</Text>
    </View>
  );
}

function AthleteRow({ a }: { a: TeamDashboard['athletes'][number] }) {
  const { ink } = useTheme();
  const styles = useStyles();
  const st = STATUS[a.readiness.status];
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: a.id, name: a.name, tab: 'form' } })}
      style={styles.row}
      accessibilityLabel={`${a.name}. Recuperación ${a.readiness.score ?? 'sin datos'}, ${st.long}`}
    >
      <Avatar name={a.name} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text variant="headline" numberOfLines={1}>{a.name}</Text>
        <StatusBadge label={st.label} icon={st.icon} color={st.color} small />
        {a.drivers[0] ? <Text variant="footnote" secondary numberOfLines={1}>{a.drivers[0].text}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.score, { color: a.readiness.score == null ? undefined : ink(st.color) }]}>{a.readiness.score ?? '—'}</Text>
        <Sparkline values={a.spark} color={st.color} />
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((colors) => ({
  heat: { gap: 6, padding: 14, backgroundColor: colors.surface, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  heatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cell: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  counters: { flexDirection: 'row', gap: 10 },
  counter: { flex: 1, gap: 8, padding: 14, backgroundColor: colors.surface, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.separator },
  
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: colors.surface, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  right: { alignItems: 'flex-end', gap: 2 },
  score: { fontFamily: 'Inter_300Light', fontSize: 30, lineHeight: 34, letterSpacing: -1.2, color: colors.text },
}));
