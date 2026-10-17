import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AthleteDashboard } from '@/components/AthleteDashboard';
import { CheckinCard } from '@/components/CheckinCard';
import { Segmented } from '@/components/Segmented';
import { TodayRings } from '@/components/TodayRings';
import { WeekView } from '@/components/WeekView';
import { useAuth } from '@/lib/auth';

type Tab = 'today' | 'form';

// El entrenador también es persona: aquí ve y planifica lo suyo (anillos, check-in, su semana de entrenos y su forma), aparte del equipo.
// El selector va DENTRO del contenido que se desplaza: fuera, la cabecera transparente de iOS lo taparía.
export default function You() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('today');
  if (!user) return null;
  const add = (date: string) => router.push({ pathname: '/workout/edit', params: { athleteId: user.id, date } });
  const switcher = (
    <View style={{ maxWidth: 440, width: '100%' }}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'today', label: 'Hoy' }, { key: 'form', label: 'Forma' }]} />
    </View>
  );
  return tab === 'today'
    ? <WeekView athleteId={user.id} hero canLog nav onAdd={add} webTitle="Tú" top={<>{switcher}<TodayRings /><CheckinCard /></>} />
    : <AthleteDashboard path="/me/dashboard" mine webTitle="Tú" header={<>{switcher}<TodayRings /></>} />;
}
