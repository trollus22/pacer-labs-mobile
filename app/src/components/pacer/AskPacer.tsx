import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { createStyles, useTheme } from '@/theme';
import { haptic } from '@/lib/haptics';
import type { PacerTopic } from '@/lib/pacer';

/** Abre Pacey en hoja con una pregunta y su contexto; la pregunta se envía sola. */
export function openPacer(q: string, topic: PacerTopic, w?: object) {
  haptic.select();
  router.push({ pathname: '/pacer-sheet', params: { q, topic, ...(w ? { w: JSON.stringify(w) } : {}) } });
}

/** Pregunta sugerida dentro de una tarjeta: «✦ ¿Por qué estoy en precaución? ›». */
export function AskPacer({ q, topic, w, onColor }: { q: string; topic: PacerTopic; w?: object; /** sobre una tarjeta de color: texto blanco y fondo translúcido */ onColor?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const fg = onColor ? '#FFFFFF' : colors.text;
  return (
    <PressableScale scale={0.97} onPress={() => openPacer(q, topic, w)} accessibilityLabel={`Preguntar a Pacey: ${q}`}>
      <View style={[styles.row, { backgroundColor: onColor ? 'rgba(255,255,255,0.16)' : colors.surface2 }]}>
        <MaterialCommunityIcons name="creation" size={16} color={fg} />
        <Text variant="subhead" color={fg} style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>{q}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={onColor ? 'rgba(255,255,255,0.7)' : colors.textTertiary} />
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderCurve: 'continuous' },
}));
