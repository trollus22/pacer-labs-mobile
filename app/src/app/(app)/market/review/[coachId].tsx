import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { InkButton, Initials, StarInput, ToggleRow } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { useAuth } from '@/lib/auth';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { MarketCoachDetail } from '@/lib/market';

const WORDS = ['', 'Mal', 'Regular', 'Bien', 'Muy bien', 'Excelente'];

/** Escribir una reseña: nota general, tres aspectos, comentario y, si quiere, el progreso medido con sus datos. */
export default function WriteReview() {
  const { coachId, eventId, rating: r0 } = useLocalSearchParams<{ coachId: string; eventId?: string; rating?: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data } = useQuery<{ coach: MarketCoachDetail }>(`/market/coaches/${coachId}`);
  const event = !!eventId;
  const [rating, setRating] = useState(Number(r0) || 4);
  const [planning, setPlanning] = useState(5);
  const [care, setCare] = useState(4);
  const [results, setResults] = useState(4);
  const [body, setBody] = useState('');
  const [withProgress, setWithProgress] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = data?.coach;
  if (!c) return <View style={styles.sheet}><Loading /></View>;
  const name = firstName(c.name);

  const publish = async () => {
    setBusy(true); setErr(null);
    try {
      await api(`/market/coaches/${c.id}/reviews`, { method: 'POST', body: event ? { kind: 'event', eventId, rating, body } : { rating, planning, care, results, body, withProgress } });
      haptic.success(); invalidateAll(); router.back();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Initials initials={c.initials} color={c.tone} size={46} />
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 17 }}>{event ? '¿Qué tal el evento?' : `¿Qué tal con ${name}?`}</Text>
          <Text variant="footnote" tertiary>Tu opinión ayuda a otros atletas a elegir</Text>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 6, marginVertical: 6 }}>
        <StarInput value={rating} onChange={setRating} label="Valoración general" />
        <Text variant="footnote" tertiary>{WORDS[rating]}</Text>
      </View>
      {!event ? (
        <View style={styles.box}>
          {([['Planificación', planning, setPlanning], ['Trato y respuesta', care, setCare], ['Resultados', results, setResults]] as const).map(([label, v, set]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 }}>
              <Text variant="subhead" style={{ fontSize: 14.5 }}>{label}</Text>
              <StarInput value={v} onChange={set} size={22} label={label} />
            </View>
          ))}
        </View>
      ) : null}
      <TextInput value={body} onChangeText={setBody} multiline maxLength={1200} placeholder={event ? 'Organización, ambiente, lo que aprendiste…' : `Cuenta cómo es entrenar con ${name}`}
        placeholderTextColor={colors.textTertiary} style={styles.input} accessibilityLabel="Tu opinión" />
      {!event ? <ToggleRow label="Añadir mi progreso" note="Se calcula con tus datos de la app" value={withProgress} onChange={setWithProgress} /> : null}
      {err ? <Text variant="footnote" color={tone.brick} center>{err}</Text> : null}
      <InkButton title="Publicar reseña" loading={busy} onPress={() => void publish()} />
      <Text variant="footnote" tertiary center style={{ fontSize: 12 }}>Se publica como «{user ? `${user.name.split(' ')[0]} ${user.name.split(' ')[1]?.[0] ?? ''}.` : ''}» · puedes editarla cuando quieras</Text>
    </ScrollView>
  );
}

const useStyles = createStyles((c) => ({
  sheet: { flex: 1, backgroundColor: c.surface },
  content: { padding: 20, paddingTop: 26, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 620, alignSelf: 'center' },
  box: { backgroundColor: c.surface2, borderRadius: 20, borderCurve: 'continuous', padding: 14, gap: 4 },
  input: { borderWidth: 1, borderColor: c.hairline, borderRadius: 18, padding: 14, minHeight: 110, fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 22, color: c.text, textAlignVertical: 'top' },
}));
