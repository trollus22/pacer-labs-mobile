import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ErrorState, Loading, Screen } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { ZoneBar } from '@/components/ZoneBar';
import { ExerciseList } from '@/components/ExerciseList';
import { SendToWatch } from '@/components/SendToWatch';
import { feelings, fonts, radius, rpeColor, sports, zones, accent, useTheme, createStyles } from '@/theme';
import { alpha, darken } from '@/lib/color';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatLong, timeAgo, todayISO } from '@/lib/dates';
import { firstName, formatDuration, formatKm, rpeLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { EASE_OUT } from '@/lib/motion';
import { invalidateAll, useQuery } from '@/lib/query';
import type { Comment, Workout } from '@/lib/types';

const FACES = ['emoticon-dead-outline', 'emoticon-sad-outline', 'emoticon-neutral-outline', 'emoticon-happy-outline', 'emoticon-excited-outline'] as const;
const BUBBLE_IN = FadeInDown.duration(220).easing(EASE_OUT);

export default function WorkoutDetail() {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const { data, error, refreshing, refresh, loading } = useQuery<{ workout: Workout; comments: Comment[] }>(`/workouts/${id}`);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);

  const w = data?.workout;
  // Un entrenador ve como atleta sus propios entrenos (registrar, reloj) y además puede editarlos; los de su equipo, como entrenador.
  const own = !!w && w.athleteId === user?.id;
  const coach = isCoach && !own;
  const color = w ? sports[w.sport].color : accent.coral;

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const r = await api<{ comment: Comment }>(`/workouts/${id}/comments`, { method: 'POST', body: { body } });
      setFreshId(r.comment.id);
      setText('');
      haptic.light();
      invalidateAll();
    } catch { haptic.error(); }
    setSending(false);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient pointerEvents="none" colors={scheme === 'dark' ? [alpha(color, 0.85), alpha(darken(color, 0.55), 0.5), 'transparent'] : [alpha(color, 0.38), alpha(color, 0.14), 'transparent']} locations={[0, 0.5, 1]} style={styles.glow} />
      {isCoach && w ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <PressableScale scale={0.94} onPress={() => router.push({ pathname: '/workout/edit', params: { id: w.id } })} accessibilityLabel="Editar entreno">
                <Text variant="headline" color={accent.coral}>Editar</Text>
              </PressableScale>
            ),
          }}
        />
      ) : null}
      <Screen transparent refreshing={refreshing} onRefresh={refresh} keyboard contentStyle={styles.content}>
        {error && !data ? <ErrorState message={error.message} onRetry={refresh} /> : loading || !w ? <Loading /> : (
          <>
            <View style={{ gap: 10, paddingTop: 12 }}>
              <Chip label={sports[w.sport].label} color={color} solid />
              <Text variant="largeTitle">{w.title}</Text>
              <Text variant="callout" color={colors.textSecondary}>{formatLong(w.date)}{coach ? ` · ${w.athleteName}` : ''}</Text>
            </View>

            <View style={styles.metrics}>
              <Metric label="Tiempo" value={formatDuration(w.durationMin)} />
              <View style={styles.sep} />
              <Metric label="Distancia" value={formatKm(w.distanceKm)} />
              <View style={styles.sep} />
              <View style={{ flex: 1.2, gap: 6, alignItems: 'flex-start' }}>
                <ZoneBar zone={w.zone} />
                <Text variant="caption" color={zones[w.zone - 1].color} style={{ fontSize: 10 }}>{zones[w.zone - 1].label}</Text>
              </View>
            </View>

            {w.items?.length ? (
              <View style={{ gap: 10 }}>
                <Text variant="caption" color={colors.textSecondary}>Ejercicios · {w.items.length}</Text>
                <ExerciseList items={w.items} sport={w.sport} />
              </View>
            ) : null}

            {w.description ? (
              <View style={styles.card}>
                <Text variant="caption" color={colors.textSecondary}>{w.items?.length ? 'Notas' : 'Plan'}</Text>
                <Text variant="body">{w.description}</Text>
              </View>
            ) : null}

            {!coach && w.status !== 'skipped' ? <SendToWatch workoutId={w.id} /> : null}
            {coach && w.sends?.length ? (
              <View style={styles.card}>
                <Text variant="caption" color={colors.textSecondary}>En el reloj</Text>
                {w.sends.map((x) => <Text key={x.provider} variant="body">Enviado a {x.name} {timeAgo(x.sentAt)}</Text>)}
              </View>
            ) : null}

            {w.status !== 'planned' && w.result ? <ResultCard w={w} coach={coach} /> : null}

            {!coach ? (
              w.status === 'planned' ? (
                w.date <= todayISO()
                  ? <Button title="Registrar entreno" onPress={() => router.push(`/log/${w.id}`)} />
                  : <Text variant="subhead" color={colors.textSecondary} center>Podrás registrarlo el día del entreno.</Text>
              ) : <Button title="Editar registro" kind="ghost" onPress={() => router.push(`/log/${w.id}`)} />
            ) : null}

            {isCoach && own ? null : <View style={{ gap: 12 }}>
              <Text variant="title3">Conversación</Text>
              {data!.comments.length === 0 ? (
                <Text variant="subhead" color={colors.textTertiary}>{coach ? `Escribe a ${firstName(w.athleteName)} sobre este entreno.` : 'Pregúntale a tu entrenador o cuéntale cómo fue.'}</Text>
              ) : data!.comments.map((c) => {
                const mine = c.userId === user?.id;
                return (
                  <Animated.View key={c.id} entering={c.id === freshId ? BUBBLE_IN : undefined} style={[styles.bubbleWrap, mine && { alignItems: 'flex-end' }]}>
                    {!mine && <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10 }}>{c.author}</Text>}
                    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                      <Text variant="body" color={mine ? colors.bg : colors.text}>{c.body}</Text>
                    </View>
                    <Text variant="footnote" color={colors.textTertiary} style={{ fontSize: 11 }}>{timeAgo(c.createdAt)}</Text>
                  </Animated.View>
                );
              })}
              <View style={styles.composer}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Escribe un comentario"
                  placeholderTextColor={colors.textTertiary}
                  selectionColor={accent.coral}
                  keyboardAppearance={scheme}
                  multiline
                  maxLength={1000}
                  style={styles.input}
                  accessibilityLabel="Comentario"
                />
                <PressableScale scale={0.9} onPress={send} disabled={!text.trim() || sending} style={[styles.send, { opacity: text.trim() ? 1 : 0.35 }]} accessibilityLabel="Enviar comentario">
                  <MaterialCommunityIcons name="arrow-up" size={22} color={colors.bg} />
                </PressableScale>
              </View>
            </View>}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function ResultCard({ w, coach }: { w: Workout; coach: boolean }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  const r = w.result!;
  if (w.status === 'skipped') {
    return (
      <View style={styles.card}>
        <Text variant="caption" color={colors.textSecondary}>{coach ? `${firstName(w.athleteName)} no lo hizo` : 'No lo hiciste'}</Text>
        {r.note ? <Text variant="body">“{r.note}”</Text> : <Text variant="subhead" color={colors.textTertiary}>Sin comentarios.</Text>}
      </View>
    );
  }
  const f = r.feeling ? feelings[r.feeling - 1] : null;
  return (
    <View style={styles.card}>
      <Text variant="caption" color={colors.textSecondary}>{coach ? `Registro de ${firstName(w.athleteName)}` : 'Tu registro'}</Text>
      <View style={styles.resultRow}>
        {r.rpe ? (
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.monoBold, fontSize: 52, lineHeight: 56, letterSpacing: -2, color: ink(rpeColor(r.rpe)) }}>{r.rpe}<Text style={{ fontFamily: fonts.mono, fontSize: 20, color: colors.textTertiary }}>/10</Text></Text>
            <Text variant="subhead" color={colors.textSecondary}>Esfuerzo · {rpeLabel(r.rpe)}</Text>
          </View>
        ) : null}
        {f ? (
          <View style={[styles.feel, { backgroundColor: alpha(f.color, 0.16) }]}>
            <MaterialCommunityIcons name={FACES[r.feeling! - 1]} size={34} color={f.color} />
            <Text variant="caption" color={f.color} style={{ fontSize: 10 }}>{f.label}</Text>
          </View>
        ) : null}
      </View>
      {(r.durationMin || r.distanceKm) ? (
        <Text variant="callout" mono color={colors.textSecondary}>Real · {formatDuration(r.durationMin)}{r.distanceKm ? ` · ${formatKm(r.distanceKm)}` : ''}</Text>
      ) : null}
      {r.note ? <Text variant="body">“{r.note}”</Text> : null}
    </View>
  );
}

const Metric = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
  <View style={{ flex: 1, gap: 4 }}>
    <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10 }}>{label}</Text>
    <Text variant="title2" mono>{value}</Text>
  </View>
);
};

const useStyles = createStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  content: { paddingTop: 8 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: colors.surface, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  sep: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.hairline },
  card: { gap: 10, padding: 18, backgroundColor: colors.surface, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  feel: { width: 84, height: 84, borderRadius: radius.md, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', gap: 4 },
  bubbleWrap: { gap: 3, alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderCurve: 'continuous' },
  mine: { backgroundColor: colors.text, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surface2, borderBottomLeftRadius: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: colors.surface2, borderRadius: 24, borderCurve: 'continuous', paddingLeft: 16, paddingRight: 6, paddingVertical: 6, marginTop: 4 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 16, maxHeight: 110, minHeight: 36, paddingTop: 8, paddingBottom: 8 },
  send: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
}));
