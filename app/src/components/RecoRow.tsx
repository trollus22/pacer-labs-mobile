import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { PressableScale } from './PressableScale';
import { StatusBadge } from './StatusBadge';
import { Text } from './Text';
import { accent, createStyles, useTheme } from '@/theme';
import { CSS_EASE_OUT } from '@/lib/motion';
import { haptic } from '@/lib/haptics';
import { STATUS, SUIT } from '@/lib/status';
import type { AthleteReco } from '@/lib/types';

/** Un atleta en la lista «Enviar a»: casilla, su recuperación y si este entreno le conviene (con los motivos). */
export function RecoRow({ reco, selected, onToggle, sportNote }: { reco: AthleteReco; selected: boolean; onToggle: () => void; sportNote?: string }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  const level = reco.level ?? 'unknown';
  const suit = SUIT[level];
  const st = STATUS[reco.readiness.status];
  return (
    <PressableScale
      onPress={() => { haptic.select(); onToggle(); }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${reco.name}. ${suit.label}. Recuperación ${reco.readiness.score ?? 'sin datos'}`}
      style={styles.row}
    >
      <Animated.View
        style={[styles.card, selected ? { borderColor: accent.coral, backgroundColor: colors.surface2 } : { borderColor: colors.separator, backgroundColor: colors.surface },
          { transitionProperty: ['borderColor', 'backgroundColor'], transitionDuration: '160ms', transitionTimingFunction: CSS_EASE_OUT }]}
      >
        <Animated.View
          style={[styles.check, selected ? { backgroundColor: accent.coral, borderColor: accent.coral, transform: [{ scale: 1 }] } : { borderColor: colors.hairline, transform: [{ scale: 1 }] },
            { transitionProperty: ['backgroundColor', 'borderColor'], transitionDuration: '160ms', transitionTimingFunction: CSS_EASE_OUT }]}
        >
          {selected ? <MaterialCommunityIcons name="check" size={16} color={colors.onAccent} /> : null}
        </Animated.View>
        <Avatar name={reco.name} size={40} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.top}>
            <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>{reco.name}</Text>
            <Text variant="footnote" mono color={reco.readiness.score == null ? colors.textTertiary : ink(st.color)}>{reco.readiness.score ?? '—'}</Text>
          </View>
          <StatusBadge label={suit.label} icon={suit.icon} color={suit.color} small />
          {reco.reasons.slice(0, 2).map((r) => <Text key={r} variant="footnote" secondary>• {r}</Text>)}
          {sportNote ? <Text variant="footnote" secondary>{sportNote}</Text> : null}
          {reco.suggestion ? (
            <View style={styles.tip}>
              <MaterialCommunityIcons name="lightbulb-outline" size={14} color={ink(accent.amber)} />
              <Text variant="footnote" style={{ flex: 1 }}>{reco.suggestion}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const useStyles = createStyles(() => ({
  row: {},
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1.5 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
}));
