import { Stack } from 'expo-router';
import { useLargeTitleHeader } from '@/theme/header';

export default function Layout() {
  const largeTitleHeader = useLargeTitleHeader();
  return <Stack screenOptions={largeTitleHeader}><Stack.Screen name="calendar" options={{ title: 'Calendario' }} /></Stack>;
}
