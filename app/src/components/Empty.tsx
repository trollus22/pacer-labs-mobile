import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme, createStyles } from '@/theme';

export function Empty({ icon, title, body }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; body?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}><MaterialCommunityIcons name={icon} size={26} color={colors.textSecondary} /></View>
      <Text variant="headline" center>{title}</Text>
      {body ? <Text variant="subhead" color={colors.textSecondary} center style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 8 },
  badge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  body: { maxWidth: 280 },
}));
