import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { StatusBadge } from '@/components/StatusBadge';
import { GlassIcon, InkButton, Initials, MarketHeader, SectionTitle, Tag, useStyles as useCardStyles, weekday } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { STATUS } from '@/lib/status';
import { haptic } from '@/lib/haptics';
import { confirm } from '@/lib/confirm';
import { dayNum, eur, type CoachEventDetail } from '@/lib/market';

/** Gestionar un evento: apuntados por grupo de ritmo, quién es atleta tuyo y quién nuevo, cobros y pasar lista. */
export default function ManageEvent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const card = useCardStyles();
  const { data } = useQuery<{ event: CoachEventDetail }>(`/market/coach/events/${id}`);
  const [list, setList] = useState(false);
  const e = data?.event;
  if (!e) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;
  const groups = [...new Set(e.attendees.map((a) => a.paceGroup || 'Sin grupo'))];
  const checked = e.attendees.filter((a) => a.checkedIn).length;

  const toggle = async (userId: string, value: boolean) => { haptic.select(); await api(`/market/coach/events/${e.id}/checkin`, { method: 'POST', body: { userId, value } }); invalidateAll(); };
  const cancel = async () => {
    if (!(await confirm('¿Cancelar el evento?', `Se devolverá el dinero a los ${e.signups} apuntados y la sesión saldrá de sus calendarios.`, 'Cancelar evento'))) return;
    await api(`/market/coach/events/${e.id}`, { method: 'DELETE' }); invalidateAll(); router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBackground metalHeight="30%" />
      <MarketHeader title={e.title} right={<GlassIcon icon="export-variant" label="Compartir evento" onPress={() => void Share.share({ message: `${e.title} · ${weekday(e.date)} ${dayNum(e.date)} · ${e.start} · ${e.place}. Apúntate en PACER LABS.` })} />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="footnote" secondary center>{weekday(e.date)} {dayNum(e.date)} · {e.start}–{e.end} · {e.place}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Kpi value={`${e.signups}`} label={`de ${e.capacity}`} />
          <Kpi value={`${e.newCount}`} label="Nuevos" />
          <Kpi value={eur(e.net)} label="Netos" />
        </View>
        <InkButton title={list ? `Pasando lista · ${checked}/${e.signups}` : 'Pasar lista'} icon={list ? 'check-all' : 'clipboard-check-outline'} onPress={() => setList(!list)} />
        {groups.map((g) => (
          <View key={g} style={{ gap: 6 }}>
            <SectionTitle title={g} right={<Text variant="footnote" tertiary>{e.attendees.filter((a) => (a.paceGroup || 'Sin grupo') === g).length}</Text>} />
            <View style={[card.card, { paddingVertical: 2 }]}>
              {e.attendees.filter((a) => (a.paceGroup || 'Sin grupo') === g).map((a, i) => (
                <PressableScale key={a.userId} scale={list ? 0.98 : 1} disabled={!list} onPress={() => void toggle(a.userId, !a.checkedIn)} accessibilityLabel={`${a.name}${a.checkedIn ? ', ha llegado' : ''}`}>
                  <View style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline }]}>
                    {list ? <MaterialCommunityIcons name={a.checkedIn ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={22} color={a.checkedIn ? tone.sage : colors.textTertiary} /> : null}
                    <Initials initials={a.initials} color={a.isMine ? tone.slate : tone.plum} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text variant="subhead" style={{ fontFamily: fonts.medium }}>{a.name}</Text>
                      <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{a.isMine ? 'Tu atleta' : 'Nuevo'} · nº {String(a.ticket).padStart(4, '0')}</Text>
                    </View>
                    {a.readiness ? <StatusBadge label={String(a.readiness.score ?? '—')} icon={STATUS[a.readiness.status].icon} color={STATUS[a.readiness.status].color} small /> : null}
                    <Tag label={a.paid ? eur(a.paid) : 'Gratis'} small color={a.paid ? undefined : tone.sage} />
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>
        ))}
        <PressableScale scale={0.98} onPress={() => void Share.share({ message: `Aviso del evento «${e.title}»: ` })} accessibilityLabel="Mensaje a todos los apuntados">
          <View style={[card.card, styles.row, { paddingVertical: 14 }]}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.text} />
            <View style={{ flex: 1 }}><Text variant="subhead">Mensaje a todos</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Avisos de última hora, cambio de lugar…</Text></View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
        </PressableScale>
        <PressableScale scale={0.97} onPress={() => void cancel()} style={{ alignSelf: 'center', marginTop: 6 }} accessibilityLabel="Cancelar el evento"><Text variant="subhead" color={tone.brick}>Cancelar el evento</Text></PressableScale>
      </ScrollView>
    </View>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  const card = useCardStyles();
  return (
    <View style={[card.card, { flex: 1, alignItems: 'center', paddingVertical: 12 }]}>
      <Text style={{ fontFamily: fonts.light, fontSize: 24, letterSpacing: -0.7 }}>{value}</Text>
      <Text variant="caption" tertiary style={{ fontSize: 10 }}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles(() => ({
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 60, gap: 10, width: '100%', maxWidth: 720, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
}));
