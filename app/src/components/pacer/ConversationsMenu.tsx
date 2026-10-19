import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, useReducedMotion } from 'react-native-reanimated';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { Glass } from './Glass';
import { TOPIC } from './Messages';
import { createStyles, useTheme } from '@/theme';
import { haptic } from '@/lib/haptics';
import { confirm } from '@/lib/confirm';
import { deleteConversation, groupConversations, type PacerConversation } from '@/lib/pacer';
import { EASE_OUT } from '@/lib/motion';

const SHORT = 6;
const when = (iso: string, group: string) => {
  const d = new Date(iso);
  if (group === 'Hoy') return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (group === 'Ayer') return 'ayer';
  return new Intl.DateTimeFormat('es-ES', group === 'Esta semana' ? { weekday: 'short' } : { day: 'numeric', month: 'short' }).format(d).replace('.', '');
};

/**
 * Menú pequeño de conversaciones que despliega el botón de arriba a la izquierda del chat: las recientes agrupadas por día,
 * con el color de su tema. Un toque abre una; mantener pulsado la borra; tocar fuera lo cierra. «Ver todas» lo amplía.
 */
export function ConversationsMenu({ top, left, conversations, currentId, onPick, onClose }: {
  top: number; left: number; conversations: PacerConversation[]; currentId: string | null;
  onPick: (id: string) => void; onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const [all, setAll] = useState(false);
  // Sin «Ver todas», solo las SHORT más recientes (los grupos ya vienen ordenados de nuevo a viejo).
  const groups = groupConversations(conversations).reduce<{ label: string; items: PacerConversation[] }[]>((acc, g) => {
    const used = acc.reduce((n, x) => n + x.items.length, 0);
    const items = all ? g.items : g.items.slice(0, Math.max(0, SHORT - used));
    return items.length ? [...acc, { ...g, items }] : acc;
  }, []);
  const more = conversations.length > SHORT;

  const remove = async (c: PacerConversation) => {
    haptic.medium();
    if (await confirm('¿Borrar la conversación?', `«${c.title}» se borrará de este dispositivo.`, 'Borrar')) deleteConversation(c.id);
  };

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.veil}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar conversaciones" />
      </Animated.View>
      <Animated.View
        entering={reduced ? FadeIn.duration(120) : ZoomIn.duration(220).easing(EASE_OUT).withInitialValues({ transform: [{ scale: 0.92 }] })}
        exiting={reduced ? FadeOut.duration(100) : ZoomOut.duration(140)}
        style={[styles.anchor, { top, left }, Platform.OS === 'web' ? ({ transformOrigin: 'top left' } as never) : { transformOrigin: 'top left' }]}
        accessibilityViewIsModal
      >
        <Glass radius={24} style={styles.menu}>
          <ScrollView style={{ maxHeight: all ? 460 : undefined }} contentContainerStyle={{ padding: 8 }} showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? <Text variant="subhead" secondary style={{ padding: 12 }}>Aún no tienes conversaciones.</Text> : null}
            {groups.map((g) => (
              <View key={g.label} accessibilityRole="list">
                <Text variant="caption" tertiary style={styles.group}>{g.label}</Text>
                {g.items.map((c) => {
                  const on = c.id === currentId;
                  return (
                    <PressableScale key={c.id} scale={0.97} onPress={() => onPick(c.id)} onLongPress={() => void remove(c)}
                      style={[styles.item, on && { backgroundColor: 'rgba(0,0,0,0.06)' }]}
                      accessibilityLabel={`${c.title}, ${when(c.updatedAt, g.label)}`} accessibilityState={{ selected: on }} accessibilityHint="Mantén pulsado para borrarla">
                      <View style={[styles.dot, { backgroundColor: TOPIC[c.topic].color }]} />
                      <Text variant="subhead" numberOfLines={1} style={{ flex: 1, fontSize: 15 }}>{c.title}</Text>
                      <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{when(c.updatedAt, g.label)}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            ))}
            {more ? (
              <>
                <View style={styles.sep} />
                <PressableScale scale={0.97} onPress={() => setAll(!all)} style={styles.all} accessibilityLabel={all ? 'Ver menos' : 'Ver todas las conversaciones'}>
                  <Text variant="subhead" style={{ fontSize: 15 }}>{all ? 'Ver menos' : 'Ver todas'}</Text>
                  <MaterialCommunityIcons name={all ? 'chevron-up' : 'chevron-right'} size={18} color={colors.textTertiary} />
                </PressableScale>
              </>
            ) : null}
          </ScrollView>
        </Glass>
      </Animated.View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  veil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(244,244,242,0.55)' },
  anchor: { position: 'absolute', width: 292, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  menu: { backgroundColor: 'rgba(255,255,255,0.86)' },
  group: { fontSize: 10.5, letterSpacing: 0.9, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, paddingHorizontal: 10, borderRadius: 14, borderCurve: 'continuous' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sep: { height: 1, backgroundColor: c.hairline, marginVertical: 6, marginHorizontal: 10 },
  all: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, paddingHorizontal: 10 },
}));
