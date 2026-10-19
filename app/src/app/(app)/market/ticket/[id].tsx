import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { AppBackground } from '@/components/AppBackground';
import { Text } from '@/components/Text';
import { Loading } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { MarketHeader, useStyles as useCardStyles, weekday } from '@/components/market/ui';
import { createStyles, fonts, tone, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useQuery, invalidateAll } from '@/lib/query';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { dayNum, eur, type MarketEventDetail } from '@/lib/market';

/** Entrada del evento: QR para pasar lista, la sesión en el calendario y el envío al reloj. */
export default function Ticket() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const card = useCardStyles();
  const { user } = useAuth();
  const { data } = useQuery<{ event: MarketEventDetail }>(`/market/events/${id}`);
  const e = data?.event;
  if (!e || !e.ticket) return <View style={{ flex: 1, backgroundColor: colors.bg }}><MarketHeader /><Loading /></View>;
  const t = e.ticket;
  const cancel = async () => {
    if (!(await confirm('¿Cancelar tu inscripción?', t.paid ? `Se te devolverán ${eur(t.paid)} y la sesión saldrá de tu Calendario.` : 'La sesión saldrá de tu Calendario.', 'Cancelar inscripción'))) return;
    await api(`/market/events/${e.id}/signup`, { method: 'DELETE' }); invalidateAll(); router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBackground metalHeight="30%" />
      <MarketHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.duration(260)} style={styles.check}><MaterialCommunityIcons name="check-bold" size={28} color="#fff" /></Animated.View>
        <Text style={styles.big}>¡Estás dentro!{'\n'}<Text style={[styles.big, { color: colors.textTertiary }]}>{weekday(e.date) === 'Sáb' ? 'Sábado' : weekday(e.date) === 'Dom' ? 'Domingo' : weekday(e.date)} {dayNum(e.date)}, {e.start}</Text></Text>
        <View style={styles.ticket}>
          <View style={{ padding: 18, gap: 4 }}>
            <Text variant="caption" color={tone.clay} style={{ fontSize: 10.5 }}>Entrada · {t.paid ? `${eur(t.paid)} pagados` : 'gratis'}</Text>
            <Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 18 }}>{e.title}</Text>
            <Text variant="footnote" tertiary>{e.place}{t.paceGroup ? ` · Grupo ${t.paceGroup}` : ''}</Text>
          </View>
          <View style={styles.cut}><View style={[styles.notch, { left: -12 }]} /><View style={[styles.notch, { right: -12 }]} /></View>
          <View style={{ alignItems: 'center', padding: 18, gap: 8 }}>
            <QrSketch seed={`${e.id}:${t.no}`} />
            <Text variant="footnote" tertiary style={{ fontSize: 12 }}>Enséñalo al llegar · {user?.name.split(' ')[0]} · nº {String(t.no).padStart(4, '0')}</Text>
          </View>
        </View>
        {t.workoutId ? (
          <>
            <PressableScale scale={0.98} onPress={() => router.push(`/workout/${t.workoutId}`)} accessibilityLabel="Ver la sesión en tu Calendario">
              <View style={[card.card, styles.row]}>
                <View style={styles.ic}><MaterialCommunityIcons name="calendar-check-outline" size={18} color={colors.text} /></View>
                <View style={{ flex: 1 }}><Text variant="subhead">Añadido a tu Calendario</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Cuenta en tu carga como cualquier entreno</Text></View>
                <MaterialCommunityIcons name="check" size={20} color={tone.sage} />
              </View>
            </PressableScale>
            <PressableScale scale={0.98} onPress={() => router.push(`/workout/${t.workoutId}`)} accessibilityLabel="Enviar la sesión al reloj">
              <View style={[card.card, styles.row]}>
                <View style={styles.ic}><MaterialCommunityIcons name="watch-variant" size={18} color={colors.text} /></View>
                <View style={{ flex: 1 }}><Text variant="subhead">Enviar la sesión al reloj</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }} numberOfLines={1}>{e.session || 'Desde el detalle del entreno'}</Text></View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
              </View>
            </PressableScale>
          </>
        ) : null}
        <PressableScale scale={0.97} onPress={() => void cancel()} accessibilityLabel="Cancelar inscripción" style={{ alignSelf: 'center', marginTop: 6 }}>
          <Text variant="subhead" color={tone.brick}>Cancelar inscripción</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

/** Código visual de la entrada (muestra: aún no se escanea; el entrenador pasa lista tocando el nombre). */
function QrSketch({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const n = 25, out: [number, number][] = [];
    const finder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([a, b]) => x >= a - 1 && x <= a + 7 && y >= b - 1 && y <= b + 7);
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) { h = (h * 1103515245 + 12345) >>> 0; if (!finder(x, y) && (h >>> 16) % 100 > 50) out.push([x, y]); }
    return out;
  }, [seed]);
  const s = 6;
  return (
    <Svg width={150} height={150} viewBox="0 0 150 150" accessibilityLabel="Código de la entrada">
      <Rect width={150} height={150} fill="#fff" />
      {cells.map(([x, y]) => <Rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill="#111" />)}
      {[[0, 0], [18, 0], [0, 18]].map(([a, b]) => (
        <Svg key={`${a}${b}`}>
          <Rect x={a * s} y={b * s} width={7 * s} height={7 * s} fill="#111" />
          <Rect x={(a + 1) * s} y={(b + 1) * s} width={5 * s} height={5 * s} fill="#fff" />
          <Rect x={(a + 2) * s} y={(b + 2) * s} width={3 * s} height={3 * s} fill="#111" />
        </Svg>
      ))}
    </Svg>
  );
}

const useStyles = createStyles((c) => ({
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 60, gap: 14, width: '100%', maxWidth: 620, alignSelf: 'center' },
  check: { width: 56, height: 56, borderRadius: 28, backgroundColor: tone.sage, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: fonts.light, fontSize: 30, lineHeight: 35, letterSpacing: -1, color: c.text },
  ticket: { backgroundColor: c.surface, borderRadius: 24, borderCurve: 'continuous', borderWidth: 1, borderColor: c.hairline },
  cut: { height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: c.hairline, marginHorizontal: 14 },
  notch: { position: 'absolute', top: -12, width: 22, height: 22, borderRadius: 11, backgroundColor: c.bg, borderWidth: 1, borderColor: c.hairline },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.hairline, alignItems: 'center', justifyContent: 'center' },
}));
