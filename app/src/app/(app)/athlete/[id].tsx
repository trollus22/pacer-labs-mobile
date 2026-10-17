import { useState } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AthleteDashboard } from '@/components/AthleteDashboard';
import { PressableScale } from '@/components/PressableScale';
import { Segmented } from '@/components/Segmented';
import { TodayRings } from '@/components/TodayRings';
import { WeekView } from '@/components/WeekView';
import { GUTTER, accent, useTheme } from '@/theme';
import { todayISO } from '@/lib/dates';

type View_ = 'plan' | 'form';

// Ficha del atleta para el entrenador: su plan semanal y su forma (recuperación, carga, salud).
export default function AthleteDetail() {
  const { colors } = useTheme();
  const { id, name, tab } = useLocalSearchParams<{ id: string; name?: string; tab?: string }>();
  const [view, setView] = useState<View_>(tab === 'form' ? 'form' : 'plan');
  const add = (date: string) => router.push({ pathname: '/workout/edit', params: { athleteId: id, date } });
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: name ?? 'Atleta',
          headerRight: view === 'plan' ? () => (
            <PressableScale scale={0.9} onPress={() => add(todayISO())} accessibilityLabel="Añadir entreno" feedback>
              <MaterialCommunityIcons name="plus" size={28} color={accent.coral} />
            </PressableScale>
          ) : undefined,
        }}
      />
      <View style={{ paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 4 }}>
        <Segmented value={view} onChange={setView} options={[{ key: 'plan', label: 'Plan' }, { key: 'form', label: 'Forma' }]} />
      </View>
      {view === 'plan' ? <WeekView athleteId={id} nav onAdd={add} top={<TodayRings path={`/athletes/${id}/dashboard`} />} /> : <AthleteDashboard path={`/athletes/${id}/dashboard`} header={<TodayRings path={`/athletes/${id}/dashboard`} />} />}
    </View>
  );
}
