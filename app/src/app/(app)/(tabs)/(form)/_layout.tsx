import { Stack } from 'expo-router';
import { useLargeTitleHeader } from '@/theme/header';

export default function Layout() {
  const header = useLargeTitleHeader();
  return <Stack screenOptions={header}><Stack.Screen name="form" options={{ title: 'Forma' }} /></Stack>;
}
