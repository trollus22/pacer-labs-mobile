import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { FilterChips, InkButton, MarketHeader, StickyBar, useStyles as useCardStyles } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { MarketMe } from '@/lib/market';

const GOALS = ['Maratón', 'Media', '10 km', 'Trail', 'Volver a correr'] as const;

/** Solicitud enviada: el atleta cuenta su objetivo para que el entrenador llegue con el plan pensado. */
export default function RequestSent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const card = useCardStyles();
  const { data } = useQuery<MarketMe>('/market/me');
  const r = data?.requests.find((x) => x.id === id);
  const [goal, setGoal] = useState<string>('Maratón');
  const [race, setRace] = useState('');
  const [best, setBest] = useState('');
  const [days, setDays] = useState('5');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!r) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;
  const name = firstName(r.coachName);

  const send = async () => {
    setBusy(true);
    try {
      await api(`/market/requests/${r.id}`, { method: 'PATCH', body: { goal, race, best, days: Number(days) } });
      haptic.success(); invalidateAll(); setSent(true);
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBackground metalHeight="30%" />
      <MarketHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Animated.View entering={ZoomIn.duration(260)} style={styles.check}><MaterialCommunityIcons name="check-bold" size={32} color="#fff" /></Animated.View>
        <Text style={styles.big}>{sent ? 'Brief enviado' : 'Solicitud enviada'}{'\n'}<Text style={[styles.big, { color: colors.textTertiary }]}>a {r.coachName}</Text></Text>
        <Text variant="subhead" secondary style={{ lineHeight: 22 }}>
          {sent ? `${name} ya tiene tu objetivo. Cuando acepte, verás tu plan en Hoy y en Calendario.` : `Te responderá en menos de 48 h. Mientras, cuéntale tu objetivo para que llegue con tu plan pensado.`}
        </Text>
        {!sent ? (
          <Animated.View entering={FadeIn.duration(220)} style={[card.card, { gap: 12 }]}>
            <Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Tu objetivo</Text>
            <FilterChips options={GOALS.map((g) => ({ key: g, label: g }))} value={goal} onChange={setGoal} />
            <Row label="Carrera"><TextInput value={race} onChangeText={setRace} placeholder="Maratón de Sevilla · 21 feb" placeholderTextColor={colors.textTertiary} style={styles.input} accessibilityLabel="Carrera objetivo" /></Row>
            <Row label="Marca actual"><TextInput value={best} onChangeText={setBest} placeholder="3:41:20" placeholderTextColor={colors.textTertiary} style={styles.input} accessibilityLabel="Marca actual" /></Row>
            <Row label="Días por semana"><FilterChips options={['3', '4', '5', '6'].map((d) => ({ key: d, label: d }))} value={days} onChange={setDays} /></Row>
          </Animated.View>
        ) : null}
        <View style={[card.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <MaterialCommunityIcons name="message-outline" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}><Text variant="subhead">Plan: {r.planTitle}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>{r.status === 'pending' ? 'Pendiente de aceptar · sin cobro hasta entonces' : 'Aceptada'}</Text></View>
        </View>
      </ScrollView>
      <StickyBar>
        {sent ? <InkButton flex title="Volver a Hoy" onPress={() => router.dismissTo('/')} /> : <InkButton flex title={`Enviar a ${name}`} loading={busy} onPress={() => void send()} />}
      </StickyBar>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="footnote" secondary>{label}</Text>
      {children}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130, gap: 16, width: '100%', maxWidth: 680, alignSelf: 'center' },
  check: { width: 62, height: 62, borderRadius: 31, backgroundColor: tone.sage, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: fonts.light, fontSize: 31, lineHeight: 36, letterSpacing: -1.1, color: c.text },
  input: { backgroundColor: c.surface2, borderRadius: 14, height: 44, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15.5, color: c.text },
}));
