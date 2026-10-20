import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../AppBackground';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { Glass } from './Glass';
import { PaceyAvatar, PaceyBadge } from '../pacey/PaceyAvatar';
import { ConversationsMenu } from './ConversationsMenu';
import { PacerReply, TOPIC, UserBubble } from './Messages';
import { createStyles, fonts, useTheme, type Sport } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@/lib/query';
import { todayISO } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { askPacer, isAnswering, seedPacer, stopPacer, suggestions, usePacerConversations, type PacerFacts, type PacerTopic } from '@/lib/pacer';
import type { Dashboard, TeamDashboard } from '@/lib/types';

const TOPIC_LABEL: Record<PacerTopic, string> = { recovery: 'Recuperación de hoy', today: 'Entreno de hoy', week: 'Tu semana', form: 'Tu forma', team: 'Panel del equipo · hoy', general: 'General' };
const MAX_W = 760;

export type PacerParams = { c?: string; topic?: string; q?: string; w?: string };

/** Datos reales con los que Pacey arma sus respuestas simuladas (los mismos que ya ha pedido la pantalla Hoy o el Panel). */
function useFacts(w?: string): PacerFacts {
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const { data: me } = useQuery<Dashboard>(user && !coach ? `/me/dashboard?date=${todayISO()}&days=7` : null);
  const { data: team } = useQuery<TeamDashboard>(coach ? `/dashboard/team?date=${todayISO()}&days=7` : null);
  return useMemo(() => {
    let workout: PacerFacts['workout'];
    try { workout = w ? (JSON.parse(w) as { title: string; sport: Sport; zone: number; durationMin: number | null }) : undefined; } catch { workout = undefined; }
    return { role: coach ? 'coach' : 'athlete', name: user?.name ?? '', me, team, workout };
  }, [coach, user?.name, me, team, w]);
}

const greeting = () => { const h = new Date().getHours(); return h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; };

/**
 * El chat de Pacey. `full`: pantalla completa (desde el botón de la barra) con el menú de conversaciones arriba a la izquierda.
 * `sheet`: hoja deslizable que se abre desde una tarjeta, con el contexto a la vista y «Abrir en grande».
 */
export function PacerChat({ mode, params }: { mode: 'full' | 'sheet'; params: PacerParams }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { user } = useAuth();
  const facts = useFacts(params.w);
  const all = usePacerConversations();
  const [cid, setCid] = useState<string | null>(params.c ?? null);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const conv = cid ? all.find((c) => c.id === cid) ?? null : null;
  const busy = isAnswering(conv);
  const topic = (params.topic as PacerTopic) || 'general';
  const sheet = mode === 'sheet';

  useEffect(() => { if (user) seedPacer(user.id, user.role); }, [user]);

  const send = (q: string) => {
    const t = q.trim();
    if (!t || busy) return;
    haptic.light();
    setText('');
    setCid(askPacer({ conversationId: cid, question: t, topic, facts, reducedMotion: reduced }));
  };

  // Pregunta que llega desde una tarjeta («¿Por qué estoy en precaución?»): se envía sola al abrir. Se espera a tener los datos.
  const sent = useRef(false);
  const ready = facts.role === 'coach' ? !!facts.team : !!facts.me;
  useEffect(() => {
    if (sent.current || !params.q || params.c) return;
    const t = setTimeout(() => { if (!sent.current) { sent.current = true; send(params.q!); } }, ready ? 250 : 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const newChat = () => { haptic.select(); if (cid) stopPacer(cid); setCid(null); setText(''); setMenu(false); };
  const pick = (id: string) => { haptic.select(); setMenu(false); setCid(id); };
  const expand = () => {
    const id = cid;
    router.back();
    setTimeout(() => router.push({ pathname: '/pacer', params: id ? { c: id } : {} }), Platform.OS === 'ios' ? 350 : 0);
  };

  const headerTop = sheet ? 10 : insets.top + 6;
  const first = user?.name.split(' ')[0] ?? '';
  const sugg = suggestions(facts);
  const composerSpace = 76 + (sheet ? 16 : Math.max(insets.bottom, 12));

  const header = sheet ? (
    <View style={[styles.sheetHead, { paddingTop: 4 }]}>
      <View style={styles.ctx}>
        <PaceyBadge size={20} mood="neutral" still />
        <Text variant="footnote" style={{ fontSize: 12.5 }} numberOfLines={1}>Contexto: {TOPIC_LABEL[topic]}</Text>
      </View>
      <PressableScale scale={0.95} onPress={expand} accessibilityLabel="Abrir Pacey en pantalla completa">
        <Text variant="subhead" secondary>Abrir en grande</Text>
      </PressableScale>
    </View>
  ) : (
    <View style={[styles.head, { paddingTop: headerTop }]}>
      <View style={styles.headSide}>
        <PressableScale scale={0.9} onPress={() => router.back()} accessibilityLabel="Volver">
          <Glass radius={20} style={styles.hbtn} interactive><MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} /></Glass>
        </PressableScale>
        <PressableScale scale={0.9} onPress={() => { haptic.select(); setMenu(!menu); }} accessibilityLabel="Tus conversaciones" accessibilityState={{ expanded: menu }}>
          <Glass radius={20} style={[styles.hbtn, menu && { backgroundColor: colors.ink, borderColor: colors.ink }]} interactive>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color={menu ? '#fff' : colors.text} />
          </Glass>
        </PressableScale>
      </View>
      <View style={styles.title}>
        {conv ? (
          <>
            <Text variant="headline" numberOfLines={1} style={{ fontSize: 15.5, letterSpacing: -0.2 }}>{conv.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><PaceyBadge size={16} mood="neutral" still /><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Pacey</Text></View>
          </>
        ) : (
          <>
            <Text variant="headline" numberOfLines={1} style={{ fontSize: 15.5, letterSpacing: -0.2 }}>Pacey</Text>
            <Text variant="footnote" tertiary style={{ fontSize: 12 }}>Tu asistente</Text>
          </>
        )}
      </View>
      <View style={[styles.headSide, { justifyContent: 'flex-end' }]}>
        <PressableScale scale={0.9} onPress={newChat} accessibilityLabel="Nueva conversación">
          <Glass radius={20} style={styles.hbtn} interactive><MaterialCommunityIcons name="square-edit-outline" size={19} color={colors.text} /></Glass>
        </PressableScale>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: sheet ? colors.surface : colors.bg }}>
      {sheet ? null : <AppBackground metalHeight="34%" />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.list, { paddingBottom: composerSpace + 12 }]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => { if (conv) scroll.current?.scrollToEnd({ animated: !reduced }); }}
        >
          {conv ? conv.messages.map((m, i) => (m.role === 'user'
            ? <UserBubble key={m.id} m={m} />
            : <PacerReply key={m.id} m={m} last={i === conv.messages.length - 1} onFollowUp={send} />))
            : sheet && params.q ? null : (
              <Animated.View entering={FadeIn.duration(260)} style={{ gap: 26, paddingTop: sheet ? 12 : 36 }}>
                <View style={{ gap: 18 }}>
                  <View style={styles.mark}><PaceyAvatar size={sheet ? 92 : 132} mood="listening" variety={!text.trim()} seed={7} onDark /></View>
                  <Text style={styles.hello}>{greeting()}{first ? `, ${first}` : ''}.{'\n'}<Text style={[styles.hello, { color: colors.textTertiary }]}>Soy Pacey, ¿en qué te ayudo?</Text></Text>
                </View>
                <View style={styles.grid}>
                  {sugg.map((s) => (
                    <PressableScale key={s.q} scale={0.97} onPress={() => send(s.q)} style={styles.sugg} accessibilityLabel={s.q} accessibilityHint="Pregunta a Pacey">
                      <View style={styles.suggHead}>
                        <MaterialCommunityIcons name={TOPIC[s.topic].icon} size={12} color={TOPIC[s.topic].color} />
                        <Text variant="caption" color={TOPIC[s.topic].color} style={{ fontSize: 10.5, letterSpacing: 0.8 }}>{s.label}</Text>
                      </View>
                      <Text variant="subhead" style={{ fontSize: 15, lineHeight: 20 }}>{s.q}</Text>
                    </PressableScale>
                  ))}
                </View>
                <Text variant="footnote" tertiary center style={{ fontSize: 12 }}>Pacey orienta; no sustituye a tu entrenador ni a un médico.{'\n'}Versión de demostración: las respuestas son simuladas.</Text>
              </Animated.View>
            )}
        </ScrollView>

        <View style={[styles.composerWrap, { paddingBottom: sheet ? 16 : Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
          <Composer sheet={sheet} value={text} onChange={setText} busy={busy} inputRef={input}
            placeholder={facts.role === 'coach' && sheet ? 'Pregunta sobre el equipo…' : 'Pregunta a Pacey…'}
            onSend={() => send(text)} onStop={() => { if (cid) { haptic.light(); stopPacer(cid); } }} />
        </View>
      </KeyboardAvoidingView>

      {menu && !sheet ? (
        <ConversationsMenu top={headerTop + 48} left={16} conversations={all} currentId={cid} onPick={pick} onClose={() => setMenu(false)} />
      ) : null}
    </View>
  );
}

function Composer({ sheet, value, onChange, busy, onSend, onStop, placeholder, inputRef }: {
  sheet: boolean; value: string; onChange: (s: string) => void; busy: boolean; onSend: () => void; onStop: () => void; placeholder: string; inputRef: React.RefObject<TextInput | null>;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const has = value.trim().length > 0;
  const body = (
    <View style={styles.composer}>
      <PressableScale scale={0.9} onPress={() => inputRef.current?.focus()} accessibilityLabel="Adjuntar (próximamente)" accessibilityState={{ disabled: true }}>
        <View style={styles.plus}><MaterialCommunityIcons name="plus" size={19} color={colors.textSecondary} /></View>
      </PressableScale>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        maxLength={1000}
        style={styles.input}
        submitBehavior="submit"
        onSubmitEditing={onSend}
        returnKeyType="send"
        accessibilityLabel="Mensaje para Pacey"
        maxFontSizeMultiplier={1.35}
      />
      {busy ? (
        <PressableScale scale={0.9} onPress={onStop} accessibilityLabel="Detener respuesta">
          <View style={[styles.send, { backgroundColor: colors.ink }]}><View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#fff' }} /></View>
        </PressableScale>
      ) : has ? (
        <PressableScale scale={0.9} onPress={onSend} accessibilityLabel="Enviar">
          <View style={[styles.send, { backgroundColor: colors.ink }]}><MaterialCommunityIcons name="arrow-up" size={21} color="#fff" /></View>
        </PressableScale>
      ) : (
        <PressableScale scale={0.9} onPress={() => inputRef.current?.focus()} accessibilityLabel="Dictar" accessibilityHint="Abre el teclado; usa el micrófono del teclado para dictar">
          <View style={styles.send}><MaterialCommunityIcons name="microphone-outline" size={22} color={colors.textSecondary} /></View>
        </PressableScale>
      )}
    </View>
  );
  return sheet ? <View style={[styles.composerBox, { backgroundColor: colors.surface2 }]}>{body}</View> : <Glass radius={29} style={styles.composerBox}>{body}</Glass>;
}

const useStyles = createStyles((c) => ({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, width: '100%', maxWidth: MAX_W + 32, alignSelf: 'center' },
  headSide: { width: 88, flexDirection: 'row', gap: 8 },
  // Margen a los dos lados para que el título no toque los botones de la cabecera.
  title: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  hbtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18, paddingBottom: 6 },
  ctx: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 1 },
  list: { paddingHorizontal: 18, paddingTop: 6, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
  mark: { alignSelf: 'flex-start', padding: 10, borderRadius: 40, borderCurve: 'continuous', backgroundColor: '#111316', alignItems: 'center', justifyContent: 'center' },
  hello: { fontFamily: fonts.light, fontSize: 34, lineHeight: 39, letterSpacing: -1.2, color: c.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sugg: { flexBasis: '48%', flexGrow: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline, borderRadius: 20, borderCurve: 'continuous', padding: 14, gap: 6, minHeight: 92 },
  suggHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  composerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, alignItems: 'center' },
  composerBox: { width: '100%', maxWidth: MAX_W, borderRadius: 29, borderCurve: 'continuous' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingLeft: 10, paddingRight: 8, paddingVertical: 8, minHeight: 58 },
  plus: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, lineHeight: 21, color: c.text, maxHeight: 120, paddingTop: 11, paddingBottom: 11, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
}));

