import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { PaceyBadge } from '../pacey/PaceyAvatar';
import { fonts, metal, tone, createStyles, useTheme } from '@/theme';
import { alpha } from '@/lib/color';
import { haptic } from '@/lib/haptics';
import { STATUS } from '@/lib/status';
import type { PacerBlock, PacerMessage, PacerTopic } from '@/lib/pacer';

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Color e icono de cada tema: se ven en el menú de conversaciones y en las sugerencias. */
export const TOPIC: Record<PacerTopic, { color: string; icon: Icon }> = {
  recovery: { color: tone.ochre, icon: 'weather-night' },
  today: { color: tone.clay, icon: 'lightning-bolt' },
  week: { color: tone.slate, icon: 'calendar-month' },
  form: { color: tone.sage, icon: 'heart-pulse' },
  team: { color: tone.plum, icon: 'account-group' },
  general: { color: metal.dk, icon: 'creation' },
};

/** Texto con **negritas** (lo único que usa Pacey). */
export function RichText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Text variant="body" style={[{ fontSize: 16, lineHeight: 24 }, style]}>
      {parts.map((p, i) => (i % 2 ? <Text key={i} variant="body" style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.semibold }}>{p}</Text> : p))}
    </Text>
  );
}

export function UserBubble({ m }: { m: PacerMessage }) {
  const styles = useStyles();
  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.user}>
      <Text variant="body" color="#fff" style={{ fontSize: 16, lineHeight: 22 }}>{m.text}</Text>
    </Animated.View>
  );
}

/** Mensaje de Pacey: sin burbuja y a todo el ancho; dice qué ha mirado, escribe el texto y añade tarjetas con acciones. */
export function PacerReply({ m, last, onFollowUp }: { m: PacerMessage; last: boolean; onFollowUp: (q: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  return (
    <View style={styles.reply} accessibilityLiveRegion={last ? 'polite' : 'none'}>
      <View style={styles.who}>
        {/* Solo el último mensaje anima a Pacey: piensa mientras mira tus datos, trabaja mientras escribe y luego descansa. */}
        <PaceyBadge size={m.state === 'thinking' ? 46 : 30} mood={!last ? 'neutral' : m.state === 'thinking' ? 'thinking' : m.state === 'writing' ? 'working' : 'idle'} still={!last} />
        <Text variant="caption" tertiary style={{ fontSize: 11, letterSpacing: 0.8 }}>{m.state === 'thinking' ? 'Pacey está mirando tus datos…' : 'Pacey'}</Text>
      </View>
      {!m.error && m.steps?.map((s) => (
        <View key={s} style={styles.step}><View style={styles.dot} /><Text variant="footnote" secondary>{s}</Text></View>
      ))}
      {m.text ? (m.error
        ? <View style={styles.error}><MaterialCommunityIcons name="alert-circle-outline" size={18} color={tone.clay} /><Text variant="subhead" secondary style={{ flex: 1 }}>{m.text}</Text></View>
        : <RichText text={m.text} style={{ marginTop: 6 }} />) : null}
      {m.blocks?.map((b, i) => <Animated.View key={i} entering={FadeIn.duration(220)}><Block b={b} /></Animated.View>)}
      {m.state === 'done' && !m.error ? (
        <View style={styles.feedback}>
          <PressableScale scale={0.88} onPress={() => { haptic.select(); setVote(vote === 'up' ? null : 'up'); }} accessibilityLabel="Respuesta útil" accessibilityState={{ selected: vote === 'up' }}>
            <MaterialCommunityIcons name={vote === 'up' ? 'thumb-up' : 'thumb-up-outline'} size={18} color={vote === 'up' ? colors.text : colors.textTertiary} />
          </PressableScale>
          <PressableScale scale={0.88} onPress={() => { haptic.select(); setVote(vote === 'down' ? null : 'down'); }} accessibilityLabel="Respuesta poco útil" accessibilityState={{ selected: vote === 'down' }}>
            <MaterialCommunityIcons name={vote === 'down' ? 'thumb-down' : 'thumb-down-outline'} size={18} color={vote === 'down' ? colors.text : colors.textTertiary} />
          </PressableScale>
        </View>
      ) : null}
      {last && m.state === 'done' && m.followUps?.length ? (
        <Animated.View entering={FadeIn.duration(220).delay(80)} style={styles.chips}>
          {m.followUps.map((q) => (
            <PressableScale key={q} scale={0.95} onPress={() => onFollowUp(q)} style={styles.chip} accessibilityHint="Pregunta a Pacey">
              <Text variant="footnote" style={{ fontSize: 13.5 }}>{q}</Text>
            </PressableScale>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Tarjeta de atletas con sus datos reales; tocar una fila abre la ficha del atleta. */
function Block({ b }: { b: PacerBlock }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.card, { paddingVertical: 4 }]}>
      {b.rows.map((r, i) => {
        const st = STATUS[r.status];
        return (
          <PressableScale key={r.id} scale={0.98} onPress={() => { haptic.select(); router.push(`/athlete/${r.id}`); }} accessibilityRole="button" accessibilityLabel={`Abrir la ficha de ${r.name}`}
            style={[styles.athlete, i > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 16 }}>{r.name}</Text>
              <Text variant="footnote" secondary numberOfLines={2}>{r.detail}</Text>
            </View>
            <View style={[styles.score, { borderColor: alpha(st.color, 0.7) }]} accessibilityLabel={`Recuperación ${r.score ?? 'sin datos'}, ${st.label}`}>
              <Text variant="footnote" color={st.color} style={{ fontFamily: fonts.semibold }}>{r.score ?? '—'}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  user: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: c.ink, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 22, borderBottomRightRadius: 6, borderCurve: 'continuous', marginVertical: 8 },
  reply: { marginVertical: 8, gap: 2 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tone.sage },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 28 },
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline, borderRadius: 22, borderCurve: 'continuous', padding: 14, marginTop: 12 },
  athlete: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  score: { minWidth: 34, height: 26, paddingHorizontal: 8, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  feedback: { flexDirection: 'row', gap: 16, marginTop: 10 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderCurve: 'continuous', backgroundColor: c.surface2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: c.hairline, backgroundColor: c.surface },
}));
