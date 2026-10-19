import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { DemoNote, FilterChips, InkButton, Initials, ToggleRow } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { addDays, shortDate, todayISO } from '@/lib/dates';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { eur, type MarketCoachDetail, type MarketEventDetail } from '@/lib/market';

/** Hoja de pago: suscribirse a un plan o comprar la entrada de un evento. Pago simulado (sin pasarela todavía). */
export default function Checkout() {
  const p = useLocalSearchParams<{ kind: 'plan' | 'event'; planId?: string; coachId?: string; eventId?: string }>();
  return p.kind === 'event' ? <EventCheckout eventId={p.eventId!} /> : <PlanCheckout planId={p.planId!} coachId={p.coachId!} />;
}

function PlanCheckout({ planId, coachId }: { planId: string; coachId: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { data } = useQuery<{ coach: MarketCoachDetail }>(`/market/coaches/${coachId}`);
  const [share, setShare] = useState({ wellness: true, workouts: true, notes: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = data?.coach, plan = c?.plans.find((x) => x.id === planId);
  if (!c || !plan) return <View style={styles.sheet}><Loading /></View>;
  const name = firstName(c.name);
  const block = plan.kind === 'block';

  const pay = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ request: { id: string } }>('/market/requests', { method: 'POST', body: { planId, share } });
      haptic.success(); invalidateAll();
      router.dismiss();
      router.push(`/market/request/${r.request.id}`);
    } catch (e) { setErr((e as Error).message); haptic.error(); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
      <View style={styles.who}>
        <Initials initials={c.initials} color={c.tone} size={46} />
        <View><Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 17 }}>{plan.title}</Text><Text variant="footnote" tertiary>con {c.name} · {block ? `${plan.weeks} semanas` : 'mensual'}</Text></View>
      </View>
      <View style={styles.lines}>
        {block ? <Line label="Pago único" value={eur(plan.price)} /> : (
          <>
            <Line label="Primera semana" value="Gratis" green />
            <Line label="Después, cada mes" value={eur(plan.price)} />
            <Line label="Primer cobro" value={shortDate(addDays(todayISO(), 7))} />
          </>
        )}
      </View>
      <View style={styles.box}>
        <Text variant="subhead" style={{ fontFamily: fonts.medium }}>Lo que verá {name}</Text>
        <ToggleRow label="Recuperación, sueño y check-ins" value={share.wellness} onChange={(v) => setShare({ ...share, wellness: v })} />
        <ToggleRow label="Entrenos y datos del reloj" value={share.workouts} onChange={(v) => setShare({ ...share, workouts: v })} />
        <ToggleRow label="Notas privadas" value={share.notes} onChange={(v) => setShare({ ...share, notes: v })} />
        <Text variant="footnote" tertiary style={{ fontSize: 11.5 }}>Puedes cambiarlo cuando quieras desde Perfil.</Text>
      </View>
      {err ? <Text variant="footnote" color={tone.brick} center>{err}</Text> : null}
      <PayButtons busy={busy} onPay={pay} />
      <Text variant="footnote" tertiary center style={{ fontSize: 12, lineHeight: 17 }}>
        <MaterialCommunityIcons name="lock-outline" size={11} color={colors.textTertiary} /> Pago seguro. Cancela cuando quieras desde Perfil.{'\n'}Si {name} no acepta en 48 h, no se te cobra nada.
      </Text>
      <DemoNote />
    </ScrollView>
  );
}

function EventCheckout({ eventId }: { eventId: string }) {
  const styles = useStyles();
  const { data } = useQuery<{ event: MarketEventDetail }>(`/market/events/${eventId}`);
  const [pace, setPace] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const e = data?.event;
  if (!e) return <View style={styles.sheet}><Loading /></View>;
  const group = pace ?? e.paceGroups[Math.min(2, e.paceGroups.length - 1)] ?? '';

  const pay = async () => {
    setBusy(true); setErr(null);
    try {
      await api(`/market/events/${e.id}/signup`, { method: 'POST', body: { paceGroup: group } });
      haptic.success(); invalidateAll();
      router.dismiss();
      router.push(`/market/ticket/${e.id}`);
    } catch (x) { setErr((x as Error).message); haptic.error(); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
      <View style={styles.who}>
        <Initials initials={e.coachInitials} color={e.coachTone} size={46} />
        <View style={{ flex: 1 }}><Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 17 }} numberOfLines={2}>{e.title}</Text><Text variant="footnote" tertiary>{shortDate(e.date)} · {e.start} · {e.place}</Text></View>
      </View>
      {e.paceGroups.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="subhead" style={{ fontFamily: fonts.medium }}>Tu grupo de ritmo</Text>
          <FilterChips options={e.paceGroups.map((g) => ({ key: g, label: g }))} value={group} onChange={setPace} />
        </View>
      ) : null}
      <View style={styles.lines}>
        <Line label="Entrada" value={e.price ? eur(e.price) : 'Gratis'} />
        {e.isCoachAthlete && e.freeForAthletes && e.price ? <Line label={`Atleta de ${firstName(e.coachName)}`} value={`−${eur(e.price)}`} green /> : null}
        <Line label="Total" value={e.myPrice ? eur(e.myPrice) : 'Gratis'} bold />
      </View>
      {err ? <Text variant="footnote" color={tone.brick} center>{err}</Text> : null}
      {e.myPrice ? <PayButtons busy={busy} onPay={pay} /> : <InkButton title="Confirmar inscripción" loading={busy} onPress={() => void pay()} />}
      <Text variant="footnote" tertiary center style={{ fontSize: 12 }}>La sesión se añade a tu Calendario. Si el evento se cancela, se te devuelve el dinero.</Text>
      {e.myPrice ? <DemoNote /> : null}
    </ScrollView>
  );
}

function PayButtons({ busy, onPay }: { busy: boolean; onPay: () => void }) {
  return (
    <View style={{ gap: 8 }}>
      <InkButton title="Pay" icon="apple" loading={busy} onPress={onPay} />
      <InkButton ghost title="Pagar con tarjeta" loading={busy} onPress={onPay} />
    </View>
  );
}

function Line({ label, value, green, bold }: { label: string; value: string; green?: boolean; bold?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }}>
      <Text variant="subhead" color={bold ? colors.text : colors.textSecondary} style={bold ? { fontFamily: fonts.medium } : undefined}>{label}</Text>
      <Text variant="subhead" color={green ? tone.sage : colors.text} style={{ fontFamily: green || bold ? fonts.medium : fonts.regular }}>{value}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  sheet: { flex: 1, backgroundColor: c.surface },
  content: { padding: 20, paddingTop: 26, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 620, alignSelf: 'center' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: 6 },
  box: { backgroundColor: c.surface2, borderRadius: 20, borderCurve: 'continuous', padding: 14, gap: 4 },
}));
