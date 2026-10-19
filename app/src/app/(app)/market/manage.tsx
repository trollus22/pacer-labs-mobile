import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { InkButton, Initials, MarketHeader, SectionTitle, ToggleRow, useStyles as useCardStyles } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { haptic } from '@/lib/haptics';
import { dec1, eur, type CoachMarketProfile } from '@/lib/market';

/** El escaparate del entrenador: visibilidad, pasos para salir en el mercado, plazas, planes y comisión. */
export default function ManageProfile() {
  const { colors } = useTheme();
  const styles = useStyles();
  const card = useCardStyles();
  const { data } = useQuery<{ profile: CoachMarketProfile }>('/market/coach/profile');
  const p = data?.profile;
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  if (!p) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;

  const save = async (body: object) => {
    setErr(null);
    try { await api('/market/coach/profile', { method: 'PUT', body }); haptic.success(); invalidateAll(); } catch (e) { setErr((e as Error).message); haptic.error(); }
  };
  const steps: [boolean, string, string][] = [
    [p.steps.verified, 'Titulación verificada', p.certification || 'Sube tu título'],
    [p.steps.payouts, 'Cobros activados', p.payouts ? 'Stripe' : 'Conecta tu cuenta'],
    [p.steps.plans, 'Planes y precios', `${p.plans.length} planes`],
    [p.steps.presentation, 'Presentación', p.bio ? 'Texto añadido' : 'Añadir'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBackground metalHeight="30%" />
      <MarketHeader right={<PressableScale scale={0.95} onPress={() => router.push(`/market/coach/${p.id}`)} accessibilityLabel="Ver cómo lo ven los atletas"><Text variant="subhead" style={{ fontFamily: fonts.semibold }}>Ver</Text></PressableScale>} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text variant="largeTitle">Tu perfil público</Text>
        <View style={[card.card, styles.row]}>
          <Initials initials={p.initials} color={p.tone} size={54} verified={p.verified} />
          <View style={{ flex: 1 }}>
            <Text variant="headline" style={{ fontFamily: fonts.medium }}>{p.name}</Text>
            <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{p.visible ? 'Visible en el mercado' : 'Oculto'} · ★ {dec1(p.rating.avg)} ({p.rating.count})</Text>
          </View>
        </View>
        <View style={[card.card, { gap: 4 }]}>
          <ToggleRow label="Visible en el mercado" note="Los atletas pueden encontrarte" value={p.visible} onChange={(v) => void save({ visible: v })} />
          <ToggleRow label="Aceptar solicitudes" note="Pausa cuando no tengas hueco" value={p.accepting} onChange={(v) => void save({ accepting: v })} />
        </View>
        {err ? <Text variant="footnote" color={tone.brick}>{err}</Text> : null}
        <View style={[card.card, { gap: 10 }]}>
          <Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Paso a paso</Text>
          {steps.map(([ok, label, note]) => (
            <View key={label} style={styles.row}>
              <MaterialCommunityIcons name={ok ? 'check-circle' : 'circle-outline'} size={18} color={ok ? tone.sage : tone.ochre} />
              <Text variant="subhead" style={{ flex: 1, fontSize: 14.5 }}>{label}</Text>
              <Text variant="footnote" tertiary style={{ fontSize: 12 }} numberOfLines={1}>{note}</Text>
            </View>
          ))}
        </View>
        <View style={[card.card, { gap: 10 }]}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}><Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Plazas</Text><Text variant="footnote" tertiary>{p.used} de {p.capacity} ocupadas</Text></View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surface2, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, (p.used / p.capacity) * 100)}%`, height: '100%', backgroundColor: colors.ink }} /></View>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text variant="subhead" style={{ fontSize: 14.5 }}>Capacidad</Text>
            <View style={styles.row}>
              <Step icon="minus" onPress={() => void save({ capacity: Math.max(1, p.capacity - 1) })} />
              <Text variant="headline" style={{ minWidth: 28, textAlign: 'center' }}>{p.capacity}</Text>
              <Step icon="plus" onPress={() => void save({ capacity: p.capacity + 1 })} />
            </View>
          </View>
        </View>
        <SectionTitle title="Planes y precios" />
        <View style={[card.card, { gap: 10 }]}>
          {p.plans.map((pl) => (
            <View key={pl.id} style={styles.row}>
              <View style={{ flex: 1 }}><Text variant="subhead" style={{ fontFamily: fonts.medium }}>{pl.title}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>{pl.kind === 'block' ? `${pl.weeks} semanas` : 'al mes'} · recibes {eur(Math.round(Number(prices[pl.id] || pl.price) * (1 - p.fee) * 100) / 100)}</Text></View>
              <View style={styles.price}>
                <TextInput value={prices[pl.id] ?? String(pl.price)} onChangeText={(v) => setPrices({ ...prices, [pl.id]: v.replace(/[^0-9]/g, '') })} keyboardType="number-pad" style={styles.priceInput} accessibilityLabel={`Precio de ${pl.title}`} />
                <Text variant="subhead">€</Text>
              </View>
            </View>
          ))}
          <InkButton ghost title="Guardar precios" onPress={() => void save({ plans: p.plans.map((pl) => ({ id: pl.id, price: Number(prices[pl.id] || pl.price) })) })} />
        </View>
        <View style={[card.card, { gap: 6 }]}>
          <Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Comisión de PACER LABS</Text>
          <View style={[styles.row, { justifyContent: 'space-between' }]}><Text variant="subhead">De cada pago</Text><Text variant="headline">{Math.round(p.fee * 100)} %</Text></View>
          <Text variant="footnote" tertiary style={{ fontSize: 12, lineHeight: 17 }}>Incluye cobros, facturas y la app para tus atletas. Los atletas que entran con tu código de invitación no pagan comisión.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Step({ icon, onPress }: { icon: 'plus' | 'minus'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale scale={0.9} onPress={() => { haptic.select(); onPress(); }} accessibilityLabel={icon === 'plus' ? 'Una plaza más' : 'Una plaza menos'}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={icon} size={18} color={colors.text} /></View>
    </PressableScale>
  );
}

const useStyles = createStyles((c) => ({
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 60, gap: 10, width: '100%', maxWidth: 720, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface2, borderRadius: 12, paddingHorizontal: 10, height: 40 },
  priceInput: { width: 46, textAlign: 'right', fontFamily: fonts.medium, fontSize: 16, color: c.text },
}));
