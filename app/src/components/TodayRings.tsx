import { View } from 'react-native';
import { router } from 'expo-router';
import { Ring } from './Ring';
import { StatusBadge } from './StatusBadge';
import { Text } from './Text';
import { PressableScale } from './PressableScale';
import { AskPacer } from './pacer/AskPacer';
import { accent, createStyles, fonts, useTheme } from '@/theme';
import { alpha } from '@/lib/color';
import { todayISO } from '@/lib/dates';
import { useQuery } from '@/lib/query';
import { useWide } from '@/lib/layout';
import { CONFIDENCE, STATUS, scoreColor } from '@/lib/status';
import type { Dashboard, ReadinessStatus } from '@/lib/types';

const dec = (v: number) => v.toFixed(1).replace('.', ',');
const lastOf = (xs: (number | null)[]) => { for (let i = xs.length - 1; i >= 0; i--) if (xs[i] != null) return xs[i] as number; return null; };

const HEADLINE: Record<ReadinessStatus, string> = {
  ready: 'Día verde', caution: 'Ve con cuidado', rest: 'Frena hoy', unknown: 'Aún sin datos',
};

// Pregunta sugerida a Pacer según el estado del día.
const ASK: Record<ReadinessStatus, string> = {
  ready: '¿Cómo aprovecho el día?', caution: '¿Por qué estoy en precaución?', rest: '¿Por qué debo descansar hoy?', unknown: '',
};

// Cabecera de «Hoy» del atleta: tres anillos (esfuerzo, recuperación y sueño) y el consejo del día con sus motivos.
export function TodayRings({ path = '/me/dashboard' }: { path?: string }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  const wide = useWide();
  const { data: d } = useQuery<Dashboard>(`${path}?date=${todayISO()}&days=7`);
  if (!d) return null;

  const cur = d.current, st = STATUS[cur.status];
  const sleep = lastOf(d.daily.map((p) => p.sleepHours));
  // Salud del sueño 0–100 calculada en el servidor: con un reloj usa las fases, los despertares y la duración; sin él, la duración y tu valoración.
  const sleepPct = lastOf(d.daily.map((p) => p.sleepScore));
  const ratio = cur.stats.ratio;
  // Esfuerzo: la nota de carga (0–100) con la que se calcula la recuperación, no el ratio en bruto.
  const loadPct = cur.components.load;
  const ratioLabel = ratio == null ? 'Sin historia' : ratio < 0.8 ? 'Baja' : ratio < 1.3 ? 'Óptima' : ratio < 1.5 ? 'Alta' : 'Muy alta';
  const open = (key: string) => router.push({ pathname: '/metric/[key]', params: { key, path, days: '28' } });
  const reasons = cur.drivers.filter((x) => x.tone !== 'info').slice(0, 2).map((x) => x.text);
  const body = reasons.length ? reasons.join('. ') + '.' : CONFIDENCE[cur.confidence];

  return (
    <View style={[styles.wrap, wide && { flexDirection: 'row', alignItems: 'center', gap: 28 }]}>
      <View style={[styles.rings, wide && { width: 470, flexShrink: 0 }]}>
        <PressableScale scale={0.97} style={styles.item} onPress={() => open('load')}
          accessibilityLabel={`Esfuerzo ${loadPct ?? 'sin datos'} por ciento. Carga ${ratioLabel}`}>
          <Ring size={104} stroke={9} progress={(loadPct ?? 0) / 100} color={loadPct == null ? colors.textTertiary : scoreColor(loadPct)}>
            <Text style={styles.num}>{loadPct ?? '—'}<Text style={styles.unit}>%</Text></Text>
          </Ring>
          <Text variant="caption" style={styles.label}>Esfuerzo</Text>
          <Text variant="footnote" secondary style={styles.sub}>{ratioLabel}</Text>
        </PressableScale>

        <PressableScale scale={0.97} style={styles.item} onPress={() => open('recovery')}
          accessibilityLabel={`Recuperación ${cur.score ?? 'sin datos'} por ciento. ${st.long}`}>
          <Ring size={104} stroke={9} progress={cur.score == null ? 0 : cur.score / 100} color={st.color} delay={100}>
            <Text style={styles.num}>{cur.score ?? '—'}<Text style={styles.unit}>%</Text></Text>
          </Ring>
          <Text variant="caption" style={styles.label}>Recuperación</Text>
          <Text variant="footnote" secondary style={styles.sub}>{st.label}</Text>
        </PressableScale>

        <PressableScale scale={0.97} style={styles.item} onPress={() => open('sleep')}
          accessibilityLabel={`Sueño ${sleepPct ?? 'sin datos'} por ciento de salud del sueño`}>
          <Ring size={104} stroke={9} progress={(sleepPct ?? 0) / 100} color={accent.blue} delay={200}>
            <Text style={styles.num}>{sleepPct ?? '—'}<Text style={styles.unit}>%</Text></Text>
          </Ring>
          <Text variant="caption" style={styles.label}>Sueño</Text>
          <Text variant="footnote" secondary style={styles.sub}>{sleep != null ? `${dec(sleep)} h dormidas` : 'Sin check-in'}</Text>
        </PressableScale>
      </View>

      <View style={[styles.card, wide && { flex: 1 }, cur.status !== 'ready' && cur.status !== 'unknown' && { borderColor: alpha(st.color, 0.35), backgroundColor: alpha(st.color, 0.08) }]}>
        <View style={styles.head}>
          <Text variant="title3" style={{ fontFamily: fonts.semibold }}>{HEADLINE[cur.status]}</Text>
          <StatusBadge label={st.label} icon={st.icon} color={ink(st.color)} small />
        </View>
        <Text variant="subhead" color={colors.textSecondary}>{body}</Text>
        {cur.status !== 'unknown' ? <View style={{ marginTop: 4 }}><AskPacer q={ASK[cur.status]} topic="recovery" /></View> : null}
      </View>
    </View>
  );
}

/** Los tres anillos en pequeño (esfuerzo, recuperación, sueño) para la lista del entrenador. */
export function MiniRings({ effort, recovery, sleep, status }: { effort: number | null; recovery: number | null; sleep: number | null; status: ReadinessStatus }) {
  const styles = useStyles();
  const items = [
    { label: 'Esfuerzo', v: effort, color: effort == null ? undefined : scoreColor(effort) },
    { label: 'Recup.', v: recovery, color: STATUS[status].color },
    { label: 'Sueño', v: sleep, color: accent.blue },
  ];
  return (
    <View style={styles.mini} accessibilityLabel={items.map((i) => `${i.label} ${i.v ?? 'sin datos'}`).join(', ')}>
      {items.map((i) => (
        <View key={i.label} style={{ alignItems: 'center', gap: 2 }}>
          <Ring size={42} stroke={5} progress={(i.v ?? 0) / 100} color={i.color ?? '#9898A0'}>
            <Text style={styles.miniNum}>{i.v ?? '—'}</Text>
          </Ring>
          <Text variant="footnote" secondary style={{ fontSize: 10 }}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  mini: { flexDirection: 'row', gap: 14, marginTop: 4 },
  miniNum: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: -0.3, color: colors.text },
  wrap: { gap: 18 },
  rings: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  item: { alignItems: 'center', gap: 6 },
  num: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -1, color: colors.text },
  unit: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0, color: colors.textSecondary },
  label: { marginTop: 6, color: colors.text, letterSpacing: 1.4, fontSize: 10.5 },
  sub: { fontSize: 11 },
  card: { gap: 8, padding: 18, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder, backgroundColor: colors.surface },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
}));
