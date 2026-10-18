import { useState } from 'react';
import { View } from 'react-native';
import { CheckinCard } from '@/components/CheckinCard';
import { TodayRings } from '@/components/TodayRings';
import { WeekView } from '@/components/WeekView';
import { TeamHome } from '@/components/TeamHome';
import { TeamPanel } from '@/components/TeamPanel';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/lib/auth';

type Section = 'team' | 'panel';

// Una sola ruta, dos casas: el atleta ve su día; el entrenador, su equipo y, en el mismo sitio, el panel (antes era otra pestaña).
export default function Home() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('team');
  if (user?.role === 'coach') {
    const switcher = (
      <View style={{ maxWidth: 440, width: '100%' }}>
        <Segmented value={section} onChange={setSection} options={[{ key: 'team', label: 'Equipo' }, { key: 'panel', label: 'Panel' }]} />
      </View>
    );
    return section === 'team' ? <TeamHome top={switcher} /> : <TeamPanel top={switcher} />;
  }
  return <WeekView hero canLog webTitle="Hoy" top={<><TodayRings /><CheckinCard /></>} />;
}
