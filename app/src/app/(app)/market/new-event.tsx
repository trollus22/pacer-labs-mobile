import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { FilterChips, ToggleRow } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { invalidateAll } from '@/lib/query';
import { addDays, shortDate, todayISO } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { eur, EVENT_KIND, type MarketEvent } from '@/lib/market';

const KINDS = Object.entries(EVENT_KIND).map(([key, label]) => ({ key: key as MarketEvent['kind'], label }));
// Próximos sábados y domingos, para elegir fecha en un toque.
const nextDays = () => { const t = todayISO(); return Array.from({ length: 21 }, (_, i) => addDays(t, i + 1)).filter((d) => [0, 6].includes(new Date(`${d}T12:00:00`).getDay())).slice(0, 4); };

/** Crear un evento presencial: título, tipo, fecha, lugar, plazas y precio; abierto o solo para tus atletas. */
export default function NewEvent() {
  const { colors } = useTheme();
  const styles = useStyles();
  const days = nextDays();
  const [title, setTitle] = useState('Series en el Retiro + café');
  const [kind, setKind] = useState<MarketEvent['kind']>('group');
  const [date, setDate] = useState(days[0]);
  const [start, setStart] = useState('08:30');
  const [end, setEnd] = useState('10:00');
  const [place, setPlace] = useState('Parque del Retiro · Puerta de Alcalá');
  const [city, setCity] = useState('Madrid');
  const [capacity, setCapacity] = useState('25');
  const [price, setPrice] = useState('10');
  const [open, setOpen] = useState(true);
  const [free, setFree] = useState(true);
  const [cal, setCal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const netEach = Math.round(Number(price || 0) * 0.85 * 100) / 100;

  const publish = async () => {
    setBusy(true); setErr(null);
    try {
      await api('/market/coach/events', { method: 'POST', body: { title, kind, sport: kind === 'trail' ? 'trail' : 'run', date, start, end, place, city, capacity: Number(capacity), price: Number(price || 0), open, freeForAthletes: free, addToCalendar: cal,
        paceGroups: kind === 'group' ? ['Rápido', 'Medio', 'Tranquilo'] : [], tags: ['Todos los niveles'] } });
      haptic.success(); invalidateAll(); router.back();
    } catch (e) { setErr((e as Error).message); haptic.error(); } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.bar}>
        <PressableScale scale={0.95} onPress={() => router.back()} accessibilityLabel="Cancelar"><Text variant="body" secondary>Cancelar</Text></PressableScale>
        <Text variant="headline">Nuevo evento</Text>
        <PressableScale scale={0.95} onPress={() => void publish()} accessibilityLabel="Publicar evento" accessibilityState={{ busy }}><Text variant="body" style={{ fontFamily: fonts.semibold, opacity: busy ? 0.5 : 1 }}>Publicar</Text></PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Field label="Título"><TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={80} accessibilityLabel="Título del evento" /></Field>
        <Text variant="caption" tertiary style={{ fontSize: 10.5, marginTop: 4 }}>Tipo</Text>
        <FilterChips options={KINDS} value={kind} onChange={setKind} />
        <Text variant="caption" tertiary style={{ fontSize: 10.5, marginTop: 4 }}>Fecha</Text>
        <FilterChips options={days.map((d) => ({ key: d, label: `${new Date(`${d}T12:00:00`).getDay() === 6 ? 'Sáb' : 'Dom'} ${shortDate(d)}` }))} value={date} onChange={setDate} />
        <View style={styles.two}>
          <Field label="Empieza" flex><TextInput value={start} onChangeText={setStart} style={styles.input} maxLength={5} accessibilityLabel="Hora de inicio" /></Field>
          <Field label="Acaba" flex><TextInput value={end} onChangeText={setEnd} style={styles.input} maxLength={5} accessibilityLabel="Hora de fin" /></Field>
        </View>
        <Field label="Lugar"><TextInput value={place} onChangeText={setPlace} style={styles.input} accessibilityLabel="Lugar" /></Field>
        <View style={styles.two}>
          <Field label="Ciudad" flex><TextInput value={city} onChangeText={setCity} style={styles.input} accessibilityLabel="Ciudad" /></Field>
          <Field label="Plazas" flex><TextInput value={capacity} onChangeText={(v) => setCapacity(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} accessibilityLabel="Plazas" /></Field>
          <Field label="Precio (€)" flex><TextInput value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={styles.input} accessibilityLabel="Precio en euros" /></Field>
        </View>
        <View style={styles.box}>
          <ToggleRow label="Abierto a todos los atletas" value={open} onChange={setOpen} />
          <ToggleRow label="Gratis para mis atletas" value={free} onChange={setFree} />
          <ToggleRow label="Añadir la sesión a su Calendario" value={cal} onChange={setCal} />
        </View>
        <Text variant="footnote" tertiary style={{ fontSize: 12, lineHeight: 17 }}>{Number(price) > 0 ? `Recibirás ${eur(netEach)} por entrada (comisión 15 %). ` : ''}Si cancelas el evento, se devuelve el dinero a todos.</Text>
        {err ? <Text variant="footnote" color={tone.brick}>{err}</Text> : null}
      </ScrollView>
    </View>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.surface2, borderRadius: 16, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 2 }, flex && { flex: 1 }]}>
      <Text variant="caption" tertiary style={{ fontSize: 10 }}>{label}</Text>
      {children}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  content: { paddingHorizontal: 18, paddingBottom: 50, gap: 8, width: '100%', maxWidth: 680, alignSelf: 'center' },
  input: { fontFamily: fonts.regular, fontSize: 16, color: c.text, height: 34 },
  two: { flexDirection: 'row', gap: 8 },
  box: { backgroundColor: c.surface2, borderRadius: 18, padding: 12, gap: 2, marginTop: 4 },
}));
