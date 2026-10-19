import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { radius, accent, useTheme, createStyles } from '@/theme';
import { api, ApiError } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { EASE_OUT } from '@/lib/motion';
import type { AiSummary as Summary } from '@/lib/types';

// Resumen IA del equipo: un borrador que el entrenador lee y revisa. Nada se envía a los atletas desde aquí.
export function AiSummary() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (refresh = false) => {
    haptic.select();
    setBusy(true);
    setError(null);
    try {
      setSummary(await api<Summary>(`/ai/weekly-summary${refresh ? '?refresh=1' : ''}`));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 503 ? 'La IA no está activada en el servidor todavía.' : 'No se pudo generar el resumen. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="auto-fix" size={20} color={accent.violet} />
        <Text variant="headline">Resumen IA</Text>
      </View>

      {busy ? (
        <View style={styles.skeleton} accessibilityLabel="Generando resumen">
          <View style={[styles.bar, { width: '92%' }]} />
          <View style={[styles.bar, { width: '76%' }]} />
          <View style={[styles.bar, { width: '60%' }]} />
        </View>
      ) : summary ? (
        <Animated.View entering={FadeIn.duration(240).easing(EASE_OUT)} style={{ gap: 12 }}>
          <Text variant="body">{summary.text}</Text>
          <Text variant="footnote" color={colors.textSecondary}>Generado por IA · revísalo antes de actuar{summary.cached ? ' · de hace un momento' : ''}</Text>
          <PressableScale scale={0.96} onPress={() => generate(true)} style={styles.ghost} accessibilityLabel="Generar otro resumen">
            <MaterialCommunityIcons name="refresh" size={16} color={colors.text} />
            <Text variant="subhead">Regenerar</Text>
          </PressableScale>
        </Animated.View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text variant="subhead" color={colors.textSecondary}>Un resumen corto de cómo llega el equipo esta semana, para leer en un minuto.</Text>
          {error ? <Text variant="footnote" color={accent.amber}>{error}</Text> : null}
          <PressableScale scale={0.96} onPress={() => generate()} style={styles.cta} accessibilityLabel="Generar resumen del equipo">
            <Text variant="headline" color="#FFFFFF">Generar resumen</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.tileBorder, padding: 20, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skeleton: { gap: 10 },
  bar: { height: 12, borderRadius: 6, backgroundColor: colors.surface2 },
  cta: { height: 48, borderRadius: 24, backgroundColor: accent.violet, alignItems: 'center', justifyContent: 'center' },
  ghost: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface2 },
}));
