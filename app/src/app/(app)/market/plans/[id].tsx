import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { InkButton, MarketHeader, ReviewCard, SectionTitle, StickyBar } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { useQuery } from '@/lib/query';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { dec1, eur, type MarketCoachDetail } from '@/lib/market';

/** Planes del entrenador: tres formatos fijos para poder comparar entre entrenadores. */
export default function Plans() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const { data } = useQuery<{ coach: MarketCoachDetail }>(`/market/coaches/${id}`);
  const c = data?.coach;
  const [sel, setSel] = useState<string | null>(null);
  if (!c) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;
  // Sin elección todavía: el plan destacado.
  const selId = sel ?? c.plans.find((p) => p.featured)?.id ?? c.plans[0]?.id ?? null;
  const plan = c.plans.find((p) => p.id === selId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBackground metalHeight="30%" />
      <MarketHeader title={`Planes de ${firstName(c.name)}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {c.plans.map((p) => {
          const on = p.id === selId;
          return (
            <PressableScale key={p.id} scale={0.98} onPress={() => { haptic.select(); setSel(p.id); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.title}, ${eur(p.price)} ${p.kind === 'block' ? `por ${p.weeks} semanas` : 'al mes'}`}>
              <View style={[styles.plan, on && styles.planOn]}>
                {p.featured ? <View style={styles.badge}><Text variant="footnote" color="#fff" style={{ fontSize: 11, fontFamily: fonts.semibold }}>Más elegido</Text></View> : null}
                <View style={styles.head}>
                  <View style={[styles.radio, on && styles.radioOn]} />
                  <Text variant="headline" style={{ flex: 1, fontFamily: fonts.medium, fontSize: 16.5 }}>{p.title}</Text>
                  <Text variant="headline" style={{ fontFamily: fonts.medium }}>{eur(p.price)}<Text variant="footnote" tertiary> / {p.kind === 'block' ? `${p.weeks} semanas` : 'mes'}</Text></Text>
                </View>
                <View style={{ gap: 6, marginTop: 10, paddingLeft: 34 }}>
                  {p.features.map((f) => (
                    <View key={f} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                      <MaterialCommunityIcons name="check" size={15} color={tone.sage} style={{ marginTop: 2 }} />
                      <Text variant="footnote" secondary style={{ flex: 1, fontSize: 13.5 }}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </PressableScale>
          );
        })}
        <SectionTitle title="Reseñas" right={<PressableScale scale={0.95} onPress={() => router.push({ pathname: '/market/coach/[id]', params: { id: c.id, tab: 'reviews' } })} accessibilityLabel="Ver todas las reseñas"><Text variant="footnote" secondary>★ {dec1(c.rating.avg)} · {c.rating.count} ›</Text></PressableScale>} />
        {c.reviews.slice(0, 2).map((r) => <ReviewCard key={r.id} r={r} coachFirstName={firstName(c.name)} />)}
      </ScrollView>
      <StickyBar>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontFamily: fonts.medium }} numberOfLines={1}>{plan?.title ?? 'Elige un plan'}</Text>
          <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{plan ? (plan.kind === 'block' ? `${eur(plan.price)} en total` : `${eur(plan.price)}/mes · 1.ª semana gratis`) : ''}</Text>
        </View>
        <InkButton title="Continuar" disabled={!plan} onPress={() => plan && router.push({ pathname: '/market/checkout', params: { kind: 'plan', planId: plan.id, coachId: c.id } })} />
      </StickyBar>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 130, gap: 10, width: '100%', maxWidth: 760, alignSelf: 'center' },
  plan: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline, borderRadius: 22, borderCurve: 'continuous', padding: 15 },
  planOn: { borderWidth: 2, borderColor: c.ink, padding: 14 },
  badge: { position: 'absolute', top: -11, left: 16, backgroundColor: c.ink, borderRadius: 11, paddingHorizontal: 9, height: 22, justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: c.hairline },
  radioOn: { borderWidth: 7, borderColor: c.ink },
}));
