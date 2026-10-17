import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme';
import { useLargeTitleHeader } from '@/theme/header';
import { useAuth } from '@/lib/auth';

export default function Layout() {
  const largeTitleHeader = useLargeTitleHeader();
  const { user, team, teams } = useAuth();
  const { colors } = useTheme();
  const coach = user?.role === 'coach';
  return (
    <Stack screenOptions={largeTitleHeader}>
      <Stack.Screen name="index" options={{
        title: coach ? team?.name ?? 'Equipo' : 'Hoy',
        // Con varios equipos, un toque en la cabecera cambia de equipo.
        headerRight: coach ? () => (
          <PressableScale scale={0.9} onPress={() => router.push('/teams')} accessibilityLabel={teams.length > 1 ? 'Cambiar de equipo' : 'Mis equipos'}>
            <MaterialCommunityIcons name="swap-horizontal-circle-outline" size={28} color={colors.text} />
          </PressableScale>
        ) : undefined,
      }} />
    </Stack>
  );
}
