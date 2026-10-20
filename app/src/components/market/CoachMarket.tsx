import { useState, type ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Loading, ErrorState } from '../Screen';
import { Text } from '../Text';
import { PressableScale } from '../PressableScale';
import { StatusBadge } from '../StatusBadge';
import { EventCard, InkButton, Initials, SectionTitle, Stars, useStyles } from './ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { STATUS } from '@/lib/status';
import { shortDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { confirm } from '@/lib/confirm';
import { useWide } from '@/lib/layout';
import { dec1, eur, type CoachDashboard, type CoachRequest, type MarketReview } from '@/lib/market';

const MONTH = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTH_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «Mercado» del entrenador (tercera sección de Equipo): ingresos, solicitudes, atletas del mercado, eventos y reseñas. */
export function CoachMarket({ top }: { top?: ReactNode }) {
  const { data: d, error, refresh, refreshing } = useQuery<CoachDashboard>('/market/coach/dashboard');
  return (
    <Screen refreshing={refreshing} onRefresh={refresh} webTitle="Mercado">
      {top}
      {error && !d ? <ErrorState message={error.message} onRetry={refresh} /> : !d ? <Loading /> : <Body d={d} />}
    </Screen>
  );
}

function Body({ d }: { d: CoachDashboard }) {
  const s = useStyles();
  const st = useLocalStyles();
  const { colors } = useTheme();
  const wide = useWide();
  const max = Math.max(1, ...d.monthly.map((m) => m.net));
  const mIdx = Number(d.month.key.slice(5, 7)) - 1;
  return (
    <Animated.View entering={FadeIn.duration(220)} style={{ gap: 14 }}>
      <View style={[st.grid, wide && { flexDirection: 'row' }]}>
        <View style={[s.card, { padding: 18, borderRadius: 28 }, wide && { flex: 1.4 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={st.ic}><MaterialCommunityIcons name="currency-eur" size={18} color={colors.text} /></View>
            {d.month.change != null ? <View style={[st.pill, { borderColor: d.month.change >= 0 ? tone.sage : tone.brick }]}><Text variant="footnote" color={d.month.change >= 0 ? tone.sage : tone.brick} style={{ fontSize: 11.5, fontFamily: fonts.medium }}>{d.month.change >= 0 ? '+' : ''}{d.month.change} % vs. {MONTH[(mIdx + 11) % 12]}</Text></View> : null}
          </View>
          <Text variant="tileLabel" style={{ marginTop: 12 }}>Ingresos de {MONTH_LONG[mIdx]}</Text>
          <Text style={st.num}>{eur(d.month.net)}<Text variant="footnote" tertiary> netos</Text></Text>
          <Text variant="footnote" tertiary style={{ fontSize: 12 }}>Planes {eur(d.month.plans)} · Eventos {eur(d.month.events)} · comisión {Math.round(d.fee * 100)} % ya descontada</Text>
          <View style={st.bars} accessibilityLabel={`Ingresos netos de los últimos 6 meses: ${d.monthly.map((m) => `${MONTH[Number(m.month.slice(5, 7)) - 1]} ${Math.round(m.net)} euros`).join(', ')}`}>
            {d.monthly.map((m, i) => (
              <View key={m.month} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '100%', height: Math.max(4, (m.net / max) * 70), borderRadius: 6, backgroundColor: i === d.monthly.length - 1 ? colors.ink : colors.surface3 }} />
                <Text variant="footnote" tertiary style={{ fontSize: 10.5 }}>{MONTH[Number(m.month.slice(5, 7)) - 1]}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[{ gap: 8 }, wide ? { flex: 1 } : { flexDirection: 'row', flexWrap: 'wrap' }]}>
          <Kpi label="Suscriptores" value={String(d.subscribers)} note={`${eur(d.mrrNet)}/mes netos`} />
          <Kpi label="Plazas" value={`${d.profile.used}/${d.profile.capacity}`} note={d.profile.accepting ? 'Aceptando' : 'Pausado'} />
          <Kpi label="Valoración" value={dec1(d.rating.avg)} note={`${d.rating.count} reseñas`} />
          <Kpi label="Eventos" value={String(d.events.length)} note="próximos" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <InkButton flex title="Nuevo evento" icon="plus" onPress={() => router.push('/market/new-event')} />
        <InkButton flex ghost title="Perfil público" icon="storefront-outline" onPress={() => router.push('/market/manage')} />
      </View>

      <SectionTitle title="Solicitudes" right={d.requests.length ? <View style={st.badge}><Text variant="footnote" color="#fff" style={{ fontSize: 11.5, fontFamily: fonts.semibold }}>{d.requests.length} nueva{d.requests.length === 1 ? '' : 's'}</Text></View> : undefined} />
      {d.requests.length === 0 ? <Text variant="subhead" secondary>No tienes solicitudes pendientes.</Text> : d.requests.map((r) => <RequestRow key={r.id} r={r} />)}

      <SectionTitle title="Atletas del mercado" right={<Text variant="footnote" tertiary>{d.athletes.length}</Text>} />
      <View style={[s.card, { paddingVertical: 4 }]}>
        {d.athletes.map((a, i) => (
          <View key={a.id} style={[st.athlete, i > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline }]}>
            <Initials initials={a.initials} color={['#506F8F', '#7B5C7E', '#8F7340', '#4F7A63', '#A25F4C'][i % 5]} size={38} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="subhead" style={{ fontFamily: fonts.medium }} numberOfLines={1}>{a.name}</Text>
              <Text variant="footnote" tertiary style={{ fontSize: 12 }} numberOfLines={1}>{a.plan} · {eur(a.price)} · {a.nextCharge ? `cobro ${shortDate(a.nextCharge)}` : 'bloque'}</Text>
            </View>
            {a.readiness ? <StatusBadge label={a.readiness.score != null ? String(a.readiness.score) : '—'} icon={STATUS[a.readiness.status].icon} color={STATUS[a.readiness.status].color} small /> : null}
          </View>
        ))}
      </View>

      <SectionTitle title="Tus eventos" />
      {d.events.length === 0 ? <Text variant="subhead" secondary>Sin eventos próximos. Organiza una quedada para darte a conocer.</Text>
        : d.events.map((e) => (
          <View key={e.id} style={{ gap: 6 }}>
            <EventCard e={e} showCoach={false} onPress={() => router.push(`/market/manage-event/${e.id}`)} />
            <Text variant="footnote" tertiary style={{ marginLeft: 6, fontSize: 12 }}>{e.signups} de {e.capacity} apuntados · {eur(e.net)} netos</Text>
          </View>
        ))}

      <SectionTitle title="Últimas reseñas" right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Stars value={d.rating.avg ?? 0} size={12} /><Text variant="footnote" tertiary>{dec1(d.rating.avg)}</Text></View>} />
      {d.reviews.slice(0, 3).map((r) => <ReviewWithReply key={r.id} r={r} />)}
      <Text variant="footnote" tertiary center style={{ fontSize: 12, marginTop: 6 }}>Pagos de demostración: todavía no se cobra ni se paga nada.</Text>
    </Animated.View>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  const s = useStyles();
  return (
    <View style={[s.card, { flexGrow: 1, flexBasis: '46%', paddingVertical: 12, gap: 2 }]}>
      <Text variant="caption" tertiary style={{ fontSize: 10, lineHeight: 14 }}>{label}</Text>
      <Text style={{ fontFamily: fonts.light, fontSize: 26, lineHeight: 34, letterSpacing: -0.8 }}>{value}</Text>
      <Text variant="footnote" tertiary style={{ fontSize: 11.5, lineHeight: 16 }}>{note}</Text>
    </View>
  );
}

function RequestRow({ r }: { r: CoachRequest }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const goal = [r.goal.race || r.goal.goal, r.goal.best ? `marca ${r.goal.best}` : null, r.goal.days ? `${r.goal.days} días` : null].filter(Boolean).join(' · ');
  const act = async (action: 'accept' | 'decline') => {
    if (action === 'decline' && !(await confirm(`¿Rechazar a ${r.athleteName}?`, 'No se le cobrará nada y podrá elegir otro entrenador.', 'Rechazar'))) return;
    setBusy(true);
    try { await api(`/market/coach/requests/${r.id}/${action}`, { method: 'POST' }); haptic.success(); invalidateAll(); } finally { setBusy(false); }
  };
  return (
    <View style={[s.card, { gap: 10 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Initials initials={r.initials} color={tone.plum} size={42} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="subhead" style={{ fontFamily: fonts.medium }}>{r.athleteName}</Text>
          <Text variant="footnote" tertiary style={{ fontSize: 12 }} numberOfLines={2}>{goal || 'Sin brief todavía'}</Text>
          <Text variant="footnote" secondary style={{ fontSize: 12 }}>{r.planTitle} · {eur(r.price)}/mes</Text>
        </View>
        {r.readiness ? <StatusBadge label={r.readiness.score != null ? String(r.readiness.score) : '—'} icon={STATUS[r.readiness.status].icon} color={STATUS[r.readiness.status].color} small /> : null}
      </View>
      {r.readiness && r.readiness.status !== 'ready' ? <Text variant="footnote" color={tone.clay} style={{ fontSize: 12 }}>{STATUS[r.readiness.status].long} esta semana: empieza suave.</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <InkButton flex title="Aceptar" loading={busy} onPress={() => void act('accept')} />
        <InkButton flex ghost title="Rechazar" onPress={() => void act('decline')} />
      </View>
      <Text variant="footnote" tertiary style={{ fontSize: 11.5, color: colors.textTertiary }}>Comparte: {[r.share.wellness && 'recuperación y sueño', r.share.workouts && 'entrenos', r.share.notes && 'notas'].filter(Boolean).join(', ')}</Text>
    </View>
  );
}

function ReviewWithReply({ r }: { r: MarketReview }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(r.reply ?? '');
  const save = async () => { await api(`/market/coach/reviews/${r.id}/reply`, { method: 'POST', body: { reply: text } }); haptic.success(); setOpen(false); invalidateAll(); };
  return (
    <View style={[s.card, { gap: 8 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="subhead" style={{ fontFamily: fonts.medium }}>{r.author} <Text variant="footnote" tertiary>· {r.kind === 'event' ? 'evento' : 'atleta'}</Text></Text>
        <Stars value={r.rating} size={12} />
      </View>
      {r.body ? <Text variant="footnote" secondary style={{ fontSize: 13.5, lineHeight: 19 }}>{r.body}</Text> : null}
      {open ? (
        <View style={{ gap: 8 }}>
          <TextInput value={text} onChangeText={setText} multiline placeholder="Tu respuesta pública" placeholderTextColor={colors.textTertiary} style={{ backgroundColor: colors.surface2, borderRadius: 12, padding: 10, minHeight: 60, fontFamily: fonts.regular, fontSize: 14, color: colors.text }} accessibilityLabel="Respuesta a la reseña" />
          <InkButton title="Publicar respuesta" onPress={() => void save()} />
        </View>
      ) : r.reply ? <Text variant="footnote" tertiary style={{ fontSize: 12 }}>Tu respuesta: {r.reply}</Text> : (
        <PressableScale scale={0.95} onPress={() => setOpen(true)} style={{ alignSelf: 'flex-start' }} accessibilityLabel="Responder a la reseña"><Text variant="footnote" style={{ fontFamily: fonts.semibold }}>Responder</Text></PressableScale>
      )}
    </View>
  );
}

const useLocalStyles = createStyles((c) => ({
  grid: { gap: 8 },
  ic: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.hairline, alignItems: 'center', justifyContent: 'center' },
  pill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, height: 24, justifyContent: 'center' },
  num: { fontFamily: fonts.light, fontSize: 42, lineHeight: 52, letterSpacing: -1.5, color: c.text, marginTop: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 96, marginTop: 14 },
  badge: { backgroundColor: c.ink, borderRadius: 11, paddingHorizontal: 9, height: 22, justifyContent: 'center' },
  athlete: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
}));
