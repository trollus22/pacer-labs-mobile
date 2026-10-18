import { useMemo, type ReactNode } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Chip } from './Chip';
import { Empty } from './Empty';
import { PressableScale } from './PressableScale';
import { TickBars } from './micro';
import { ActionTile, Tile, TileGrid } from './Tile';
import { ErrorState, Loading, Screen, Section } from './Screen';
import { StatusBadge } from './StatusBadge';
import { Text } from './Text';
import { MiniRings } from './TodayRings';
import { feelings, radius, accent, useTheme, createStyles } from '@/theme';
import { useContentWidth, useXWide } from '@/lib/layout';
import { STATUS } from '@/lib/status';
import { firstName } from '@/lib/format';
import { formatWeekRange } from '@/lib/dates';
import { EASE_OUT } from '@/lib/motion';
import { useQuery } from '@/lib/query';
import { useAuth } from '@/lib/auth';
import type { AthleteAlert, AthleteSummary } from '@/lib/types';

type Data = { weekStart: string; weekEnd: string; athletes: AthleteSummary[] };
const ALERT: Record<AthleteAlert, { label: (a: AthleteSummary) => string; color: string }> = {
  missed: { label: (a) => `${a.missed} sin hacer`, color: accent.amber },
  high_rpe: { label: (a) => `Esfuerzo ${a.lastRpe}/10`, color: accent.pink },
  low_feeling: { label: () => 'Se sintió mal', color: accent.coral },
  low_readiness: { label: () => 'Recuperación baja', color: accent.pink },
};

const rowIn = (i: number) => FadeInDown.duration(300).delay(Math.min(i, 8) * 45).easing(EASE_OUT);

export function TeamHome({ top }: { top?: ReactNode }) {
  const wide = useContentWidth() >= 760;
  const xwide = useXWide();
  const styles = useStyles();
  const { user, team } = useAuth();
  const { data, error, refreshing, refresh, loading } = useQuery<Data>('/athletes');

  const totals = useMemo(() => {
    const a = data?.athletes ?? [];
    return { planned: a.reduce((s, x) => s + x.planned, 0), done: a.reduce((s, x) => s + x.done, 0) };
  }, [data]);
  const flagged = data?.athletes.filter((a) => a.alerts.length) ?? [];
  const rest = data?.athletes.filter((a) => !a.alerts.length) ?? [];
  const pct = totals.planned ? Math.round((totals.done / totals.planned) * 100) : 0;
  const invite = () => Share.share({ message: `Únete a mi equipo en PACER LABS con el código ${team?.inviteCode}.` });

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} webTitle="Equipo">
      {top}
      {error && !data ? <ErrorState message={error.message} onRetry={refresh} /> : loading ? <Loading /> : data && (
        <>
          <TileGrid>
            <Tile
              span={2} variant="glass" icon="lightning-bolt" title={`${firstName(user?.name ?? '')}, tu equipo esta semana`} value={String(pct)} unit="% completado"
              note={`${totals.done} de ${totals.planned} entrenos · ${formatWeekRange(data.weekStart)}`}
              micro={<TickBars values={data.athletes.map((a) => (a.planned ? (a.done / a.planned) * 100 : 0))} width={120} />}
            />
          </TileGrid>

          <ActionTile
            icon="plus" title="Nuevo entreno" note="Créalo una vez y envíalo a varios atletas, con recomendación según su recuperación."
            onPress={() => router.push('/workout/edit')} accessibilityLabel="Crear un entreno nuevo y enviarlo a varios atletas"
          />

          {data.athletes.length === 0 ? (
            <View style={styles.card}>
              <Empty icon="account-plus-outline" title="Aún no hay atletas" body="Comparte tu código de invitación. Cuando se registren aparecerán aquí." />
            </View>
          ) : null}

          {xwide && data.athletes.length > 0 ? (
            <Section title="Estado de cada atleta">
              <RosterTable athletes={[...data.athletes].sort((a, b) => (a.readiness.score ?? 101) - (b.readiness.score ?? 101))} />
              <Text variant="footnote" tertiary>Ordenados de quien más atención necesita a quien menos. Toca un atleta para abrir su ficha.</Text>
            </Section>
          ) : null}

          {!xwide && flagged.length > 0 && (
            <Section title="Requiere atención">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {flagged.map((a, i) => <Animated.View key={a.id} entering={rowIn(i)} style={{ width: wide ? '49.3%' : '100%' }}><AthleteRow a={a} flagged /></Animated.View>)}
              </View>
            </Section>
          )}

          {!xwide && rest.length > 0 && (
            <Section title={flagged.length ? 'Al día' : 'Atletas'}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {rest.map((a, i) => <Animated.View key={a.id} entering={rowIn(i + flagged.length)} style={{ width: wide ? '49.3%' : '100%' }}><AthleteRow a={a} /></Animated.View>)}
              </View>
            </Section>
          )}

          <ActionTile icon="account-plus-outline" title="Código de invitación" note={`${team?.inviteCode ?? '—'} · toca para compartirlo con tus atletas`} onPress={invite} />
        </>
      )}
    </Screen>
  );
}

/** iPad horizontal: la plantilla en una tabla, como en el panel de escritorio. */
function RosterTable({ athletes }: { athletes: AthleteSummary[] }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.table}>
      <View style={[styles.tr, { paddingBottom: 6 }]}>
        {['Atleta', 'Recuperación', 'Semana', 'Avisos'].map((h, i) => <Text key={h} variant="caption" secondary style={{ flex: [2.2, 1.6, 1.6, 2.4][i], fontSize: 10 }}>{h}</Text>)}
        <View style={{ width: 22 }} />
      </View>
      {athletes.map((a) => {
        const st = STATUS[a.readiness.status];
        const progress = a.planned ? a.done / a.planned : 0;
        return (
          <PressableScale key={a.id} scale={0.995} onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: a.id, name: a.name } })} accessibilityLabel={`${a.name}. Recuperación ${a.readiness.score ?? 'sin datos'}, ${st.long}. ${a.done} de ${a.planned} entrenos`}>
            <View style={[styles.tr, styles.trBorder]}>
              <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Avatar name={a.name} size={36} /><Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>{a.name}</Text></View>
              <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <StatusBadge label={st.label} icon={st.icon} color={st.color} small />
                <Text variant="footnote" mono color={a.readiness.score == null ? colors.textSecondary : ink(st.color)}>{a.readiness.score ?? '—'}</Text>
              </View>
              <View style={{ flex: 1.6, gap: 4 }}>
                <Text variant="footnote" mono secondary>{a.done}/{a.planned}{a.missed ? ` · ${a.missed} sin registrar` : ''}</Text>
                <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
              </View>
              <View style={[styles.chips, { flex: 2.4 }]}>{a.alerts.length ? a.alerts.map((k) => <Chip key={k} label={ALERT[k].label(a)} color={ALERT[k].color} />) : <Text variant="footnote" tertiary>Todo en orden</Text>}</View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

function AthleteRow({ a, flagged }: { a: AthleteSummary; flagged?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const progress = a.planned ? a.done / a.planned : 0;
  const feeling = a.lastFeeling ? feelings[a.lastFeeling - 1] : null;
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: a.id, name: a.name } })}
      style={[styles.row, flagged && { borderColor: 'rgba(240,74,62,0.45)' }]}
      accessibilityLabel={`${a.name}. ${a.done} de ${a.planned} entrenos esta semana`}
    >
      <Avatar name={a.name} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.nameRow}>
          <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>{a.name}</Text>
          <Text variant="footnote" mono color={colors.textSecondary}>{a.done}/{a.planned}</Text>
        </View>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
        <MiniRings effort={a.rings.effort} recovery={a.rings.recovery} sleep={a.rings.sleep} status={a.readiness.status} />
        {a.alerts.length > 0 && (
          <View style={styles.chips}>{a.alerts.map((k) => <Chip key={k} label={ALERT[k].label(a)} color={ALERT[k].color} />)}</View>
        )}
      </View>
      {feeling ? <MaterialCommunityIcons name={(['emoticon-dead-outline', 'emoticon-sad-outline', 'emoticon-neutral-outline', 'emoticon-happy-outline', 'emoticon-excited-outline'] as const)[a.lastFeeling! - 1]} size={26} color={feeling.color} accessibilityLabel={`Última sensación: ${feeling.label}`} /> : <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />}
    </PressableScale>
  );
}

const useStyles = createStyles((colors) => ({
  table: { padding: 14, backgroundColor: colors.surface, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 },
  trBorder: { paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  newCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  newIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: accent.coral, alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 22, borderRadius: radius.xl, borderCurve: 'continuous', overflow: 'hidden' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: colors.surface, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.surface3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: accent.coral },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
}));
