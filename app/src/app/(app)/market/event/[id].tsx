import { ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/Text';
import { ErrorState, Loading } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { DemoBanner, GlassIcon, InkButton, Initials, MarketHeader, StickyBar, Tag, ToneGradient, useStyles as useCardStyles, weekday } from '@/components/market/ui';
import { createStyles, fonts, useTheme } from '@/theme';
import { useQuery } from '@/lib/query';
import { firstName } from '@/lib/format';
import { formatLong } from '@/lib/dates';
import { dec1, eur, EVENT_KIND, type MarketEventDetail } from '@/lib/market';

/** Detalle de un evento presencial: cuándo, dónde, quién lo organiza, qué se hace y quién va. */
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const card = useCardStyles();
  const { data, error, refresh } = useQuery<{ event: MarketEventDetail }>(`/market/events/${id}`);
  const e = data?.event;
  if (error && !e) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><ErrorState message={error.message} onRetry={refresh} /></View>;
  if (!e) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;
  const coach = firstName(e.coachName);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ToneGradient color={e.coachTone} style={styles.hero} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
        <MarketHeader right={<GlassIcon icon="export-variant" label="Compartir evento" onPress={() => void Share.share({ message: `${e.title} · ${weekday(e.date)} ${e.start} · ${e.place}, ${e.city}` })} />} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6, marginBottom: 14 }}>
          <Text variant="caption" color="rgba(255,255,255,0.85)" style={{ fontSize: 11.5 }}>{formatLong(e.date)} · {e.start}–{e.end}</Text>
          <Text variant="title1" color="#fff" style={{ fontSize: 28, lineHeight: 32 }}>{e.title}</Text>
        </View>
        {e.demo ? <DemoBanner text="Evento de ejemplo: así se verá una quedada en PACER LABS. Todavía no admite inscripciones." /> : null}
        <View style={[card.card, { padding: 0, overflow: 'hidden' }]}>
          <MapSketch />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
            <View style={{ flex: 1 }}><Text variant="subhead">{e.place}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>{e.city}{e.distanceKm ? ` · ${String(e.distanceKm).replace('.', ',')} km de sesión` : ''}</Text></View>
            <Tag label={EVENT_KIND[e.kind]} small />
          </View>
        </View>
        <PressableScale scale={0.98} onPress={() => router.push(`/market/coach/${e.coachId}`)} accessibilityLabel={`Organiza ${e.coachName}. Ver perfil`}>
          <View style={[card.card, { gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Initials initials={e.coachInitials} color={e.coachTone} size={38} />
              <View style={{ flex: 1 }}><Text variant="subhead" style={{ fontFamily: fonts.medium }}>{e.coachName}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>★ {dec1(e.coachRating)} · organiza {e.coachEventsPerMonth} evento{e.coachEventsPerMonth === 1 ? '' : 's'} al mes</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </View>
            <Text variant="subhead" secondary style={{ lineHeight: 21 }}>{e.description}</Text>
            {e.tags.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{e.tags.map((t) => <Tag key={t} label={t} small />)}</View> : null}
          </View>
        </PressableScale>
        {e.paceGroups.length ? (
          <View style={[card.card, { gap: 8 }]}>
            <Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Grupos por ritmo</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{e.paceGroups.map((g) => <Tag key={g} label={g} small solid={e.ticket?.paceGroup === g} />)}</View>
            {e.session ? <Text variant="footnote" secondary>{e.session}</Text> : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {e.attendees.slice(0, 4).map((a, i) => (
              <View key={i} style={{ marginLeft: i ? -8 : 0, borderRadius: 16, borderWidth: 2, borderColor: colors.bg }}><Initials initials={a.initials} color={['#506F8F', '#7B5C7E', '#8F7340', '#4F7A63'][i % 4]} size={28} /></View>
            ))}
            <Text variant="footnote" style={{ marginLeft: 8 }}>{e.signups} de {e.capacity} apuntados</Text>
          </View>
          {e.known ? <Text variant="footnote" tertiary>{e.known} conocido{e.known === 1 ? '' : 's'}</Text> : null}
        </View>
      </ScrollView>
      <StickyBar>
        {e.ticket ? (
          <>
            <View style={{ flex: 1 }}><Text variant="headline">Ya estás apuntado</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Entrada nº {String(e.ticket.no).padStart(4, '0')}</Text></View>
            <InkButton title="Ver entrada" icon="qrcode" onPress={() => router.push(`/market/ticket/${e.id}`)} />
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Text variant="headline" style={{ fontFamily: fonts.medium }}>{e.myPrice ? eur(e.myPrice) : e.price ? 'Gratis para ti' : 'Gratis'}</Text>
              <Text variant="footnote" tertiary style={{ fontSize: 12 }} numberOfLines={1}>{e.isCoachAthlete && e.freeForAthletes ? `Eres atleta de ${coach}` : e.freeForAthletes && e.price ? `Gratis para atletas de ${coach}` : `${e.spotsLeft} plazas libres`}</Text>
            </View>
            <InkButton title={e.demo ? 'Ejemplo' : e.spotsLeft ? 'Apuntarme' : 'Completo'} disabled={!e.spotsLeft || e.demo} onPress={() => router.push({ pathname: '/market/checkout', params: { kind: 'event', eventId: e.id } })} />
          </>
        )}
      </StickyBar>
    </View>
  );
}

/** Mapa esquemático (sin servicio de mapas todavía): calles, el río y el punto de encuentro. */
function MapSketch() {
  return (
    <View style={{ height: 120, backgroundColor: '#E9EAE7' }} accessibilityElementsHidden>
      <Svg width="100%" height="100%" viewBox="0 0 352 120" preserveAspectRatio="xMidYMid slice">
        <Path d="M-10 78 C60 46 120 104 190 68 S300 34 370 54" stroke="#C9D3D9" strokeWidth={22} fill="none" />
        <Path d="M0 22H352M0 104H352M60 0V120M150 0V120M260 0V120M0 48L352 92" stroke="#fff" strokeWidth={4} />
        <Circle cx={190} cy={68} r={17} fill="rgba(162,95,76,0.22)" />
        <Circle cx={190} cy={68} r={7} fill="#A25F4C" stroke="#fff" strokeWidth={3} />
      </Svg>
    </View>
  );
}

const useStyles = createStyles(() => ({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 270 },
  content: { paddingTop: 128, paddingHorizontal: 18, paddingBottom: 130, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
}));
