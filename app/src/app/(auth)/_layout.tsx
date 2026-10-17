import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/theme';

export const unstable_settings = { initialRouteName: 'welcome' };

export default function AuthLayout() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: reduced ? 'fade' : 'default' }} />;
}
