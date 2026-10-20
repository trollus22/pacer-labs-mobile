import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { Empty } from '@/components/Empty';
import { ErrorState, Loading } from '@/components/Screen';
import { DemoBanner, EventCard, FilterChips, GlassIcon, InkButton, Initials, MarketHeader, ReviewCard, Stars, StickyBar, Tag, ToneGradient, useStyles } from '@/components/market/ui';
import { createStyles, fonts, sports, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { dec1, eur, type MarketCoachDetail, type MarketReview, type RatingSummary } from '@/lib/market';

type Tab = 'profile' | 'reviews' | 'events';
type Sort = 'useful' | 'recent' | 'event';

/** Perfil público del entrenador: Perfil · Reseñas · Eventos, con el precio y el botón siempre a la vista. */
export default function CoachProfile() {
  const { id, tab: t0 } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { colors } = useTheme();
  const styles = useScreenStyles();
  const [tab, setTab] = useState<Tab>(t0 === 'reviews' || t0 === 'events' ? t0 : 'profile');
  const { data, error, refresh } = useQuery<{ coach: MarketCoachDetail }>(`/market/coaches/${id}`);
  const c = data?.coach;
  if (error && !c) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><ErrorState message={error.message} onRetry={refresh} /></View>;
  if (!c) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;
  const name = firstName(c.name);

  const cta = c.isMyCoach ? null : c.demo ? 'demo' : c.request?.status === 'pending' ? 'pending' : c.spotsLeft <= 0 ? 'full' : 'plans';
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ToneGradient color={c.tone} style={styles.hero} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
        <MarketHeader right={<GlassIcon icon="export-variant" label="Compartir perfil" onPress={() => void Share.share({ message: `${c.name} en PACER LABS: ${c.headline}` })} />} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Initials initials={c.initials} color="#111" size={76} verified={c.verified} ring />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title1" color="#fff" style={{ fontSize: 27 }} numberOfLines={1}>{c.name}</Text>
            <Text variant="footnote" color="rgba(255,255,255,0.85)" numberOfLines={2}>{c.certification || c.headline}{c.years ? ` · ${c.years} años` : ''}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat value={dec1(c.rating.avg)} label={`${c.rating.count} reseñas`} />
          <View style={styles.sep} />
          <Stat value={String(c.athletes)} label="Atletas" />
          <View style={styles.sep} />
          <Stat value={`<${c.responseHours} h`} label="Respuesta" />
        </View>
        {c.demo ? <DemoBanner text="Perfil de ejemplo: así se verá un entrenador en PACER LABS. Todavía no acepta atletas." /> : null}
        <Segmented value={tab} onChange={setTab} options={[{ key: 'profile', label: 'Perfil' }, { key: 'reviews', label: `Reseñas · ${c.rating.count}` }, { key: 'events', label: `Eventos · ${c.events.length}` }]} />
        {tab === 'profile' ? <ProfileTab c={c} /> : tab === 'reviews' ? <ReviewsTab c={c} /> : <EventsTab c={c} />}
      </ScrollView>
      {cta ? (
        <StickyBar>
          <View style={{ flex: 1 }}>
            {cta === 'demo' ? <Text variant="headline" style={{ fontFamily: fonts.medium }}>{c.priceFrom != null ? eur(c.priceFrom) : '—'}<Text variant="footnote" tertiary> / mes</Text></Text> : cta === 'pending' ? <Text variant="headline">Solicitud enviada</Text> : cta === 'full' ? <Text variant="headline">Sin plazas ahora</Text> : (
              <Text variant="headline" style={{ fontFamily: fonts.medium }}>{c.priceFrom != null ? eur(c.priceFrom) : '—'}<Text variant="footnote" tertiary> / mes</Text></Text>
            )}
            <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{cta === 'demo' ? 'Perfil de ejemplo' : cta === 'pending' ? `${name} te responderá en < 48 h` : cta === 'full' ? 'Mira sus eventos mientras tanto' : '1.ª semana gratis'}</Text>
          </View>
          {cta === 'plans' || cta === 'demo' ? <InkButton title="Ver planes" onPress={() => router.push(`/market/plans/${c.id}`)} /> : cta === 'pending' && c.request ? <InkButton ghost title="Ver solicitud" onPress={() => router.push(`/market/request/${c.request!.id}`)} /> : <InkButton ghost title="Eventos" onPress={() => setTab('events')} />}
        </StickyBar>
      ) : (
        <StickyBar>
          <View style={{ flex: 1 }}><Text variant="headline">Es tu entrenador{c.name.endsWith('a') ? 'a' : ''}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Tu plan está en Hoy y en Calendario</Text></View>
          {c.canReview ? <InkButton ghost title="Opinar" icon="star-outline" onPress={() => router.push({ pathname: '/market/review/[coachId]', params: { coachId: c.id } })} /> : null}
        </StickyBar>
      )}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontFamily: fonts.light, fontSize: 26, letterSpacing: -0.8 }}>{value}</Text>
      <Text variant="caption" tertiary style={{ fontSize: 10, letterSpacing: 0.6 }}>{label}</Text>
    </View>
  );
}

function ProfileTab({ c }: { c: MarketCoachDetail }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ gap: 12 }}>
      <Text variant="subhead" secondary style={{ lineHeight: 22, marginHorizontal: 2 }}>{c.bio}</Text>
      {c.results.completion != null || c.results.improvement ? (
        <View style={s.card}>
          <Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Resultados de sus atletas</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            {c.results.improvement ? <View style={{ flex: 1.3 }}><Text style={{ fontFamily: fonts.light, fontSize: 24, letterSpacing: -0.6 }}>{c.results.improvement}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Mejora media</Text></View> : null}
            {c.results.completion != null ? <View style={{ flex: 1 }}><Text style={{ fontFamily: fonts.light, fontSize: 24, letterSpacing: -0.6 }}>{c.results.completion} %</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Entrenos cumplidos</Text></View> : null}
          </View>
          <Text variant="footnote" tertiary style={{ fontSize: 11.5, marginTop: 10 }}>{c.results.measured ? 'Calculado con los datos de PACER LABS de sus atletas (últimos 90 días)' : 'Datos de ejemplo'}</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {c.sports.map((sp) => <Tag key={sp} label={sports[sp].label} />)}
        {c.tags.map((t) => <Tag key={t} label={t} />)}
        <Tag label={c.languages.join(' · ')} icon="translate" />
        <Tag label={`${c.city} · ${c.modes.join(' y ')}`} icon="map-marker-outline" />
      </View>
      {c.reviews[0] ? (
        <View style={{ gap: 8 }}>
          <Text variant="headline" style={{ marginTop: 6 }}>Lo que dicen sus atletas</Text>
          <ReviewCard r={c.reviews[0]} coachFirstName={firstName(c.name)} />
        </View>
      ) : null}
      <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.textSecondary} />
        <Text variant="footnote" secondary style={{ flex: 1 }}>Pago protegido: si {firstName(c.name)} no acepta tu solicitud en 48 h, no se te cobra nada. Cancela cuando quieras.</Text>
      </View>
    </Animated.View>
  );
}

export function RatingBlock({ r }: { r: RatingSummary }) {
  const s = useStyles();
  const { colors } = useTheme();
  const max = Math.max(1, ...r.stars);
  return (
    <View style={{ gap: 8 }}>
      <View style={[s.card, { flexDirection: 'row', gap: 16, alignItems: 'center' }]}>
        <View style={{ width: 96, alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: fonts.light, fontSize: 46, letterSpacing: -1.6, lineHeight: 50 }}>{dec1(r.avg)}</Text>
          <Stars value={r.avg ?? 0} size={13} />
          <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{r.count} reseñas</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {r.stars.map((n, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel={`${5 - i} estrellas: ${n}`}>
              <Text variant="footnote" tertiary style={{ width: 10, fontSize: 11.5 }}>{5 - i}</Text>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' }}><View style={{ width: `${(n / max) * 100}%`, height: '100%', backgroundColor: tone.ochre }} /></View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['planning', 'Planificación'], ['care', 'Trato'], ['results', 'Resultados']] as const).map(([k, label]) => (
          <View key={k} style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 12 }]}>
            <Text style={{ fontFamily: fonts.light, fontSize: 24, letterSpacing: -0.6 }}>{dec1(r.aspects[k])}</Text>
            <Text variant="caption" tertiary style={{ fontSize: 9.5, letterSpacing: 0.5 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReviewsTab({ c }: { c: MarketCoachDetail }) {
  const [sort, setSort] = useState<Sort>('useful');
  const { data } = useQuery<{ rating: RatingSummary; reviews: MarketReview[] }>(`/market/coaches/${c.id}/reviews${sort === 'useful' ? '' : `?sort=${sort}`}`);
  const helpful = async (id: string) => { haptic.light(); try { await api(`/market/reviews/${id}/helpful`, { method: 'POST' }); invalidateAll(); } catch { /* sin red */ } };
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ gap: 10 }}>
      <RatingBlock r={data?.rating ?? c.rating} />
      <FilterChips options={[{ key: 'useful', label: 'Más útiles' }, { key: 'recent', label: 'Recientes' }, { key: 'event', label: 'De eventos' }]} value={sort} onChange={setSort} />
      {c.canReview ? <InkButton ghost icon="star-outline" title={`Opinar sobre ${firstName(c.name)}`} onPress={() => router.push({ pathname: '/market/review/[coachId]', params: { coachId: c.id } })} /> : null}
      {!data ? <Loading /> : data.reviews.length === 0 ? <Empty icon="star-outline" title="Sin reseñas todavía" /> : data.reviews.map((r) => <ReviewCard key={r.id} r={r} coachFirstName={firstName(c.name)} onHelpful={() => void helpful(r.id)} />)}
      <Text variant="footnote" tertiary center style={{ fontSize: 12 }}>Solo opinan atletas que han entrenado con {firstName(c.name)} o han ido a sus eventos.</Text>
    </Animated.View>
  );
}

function EventsTab({ c }: { c: MarketCoachDetail }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ gap: 8 }}>
      {c.events.length === 0 ? <Empty icon="calendar-blank-outline" title="Sin eventos próximos" body={`Cuando ${firstName(c.name)} organice una quedada, la verás aquí.`} />
        : c.events.map((e) => <EventCard key={e.id} e={e} showCoach={false} onPress={() => router.push(`/market/event/${e.id}`)} />)}
    </Animated.View>
  );
}

const useScreenStyles = createStyles((col) => ({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 290 },
  content: { paddingTop: 120, paddingHorizontal: 18, paddingBottom: 130, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: col.surface, borderRadius: 24, borderCurve: 'continuous', borderWidth: 1, borderColor: col.hairline, paddingVertical: 14, marginTop: 6 },
  sep: { width: 1, height: 34, backgroundColor: col.hairline },
}));
