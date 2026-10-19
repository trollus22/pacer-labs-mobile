import { useState } from 'react';
import { View } from 'react-native';
import { CheckinCard } from '@/components/CheckinCard';
import { TodayRings } from '@/components/TodayRings';
import { WeekView } from '@/components/WeekView';
import { TeamHome } from '@/components/TeamHome';
import { TeamPanel } from '@/components/TeamPanel';
import { AthleteMarketCards } from '@/components/market/AthleteMarketCards';
import { CoachMarket } from '@/components/market/CoachMarket';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/lib/auth';

type Section = 'team' | 'panel' | 'market';

// Una sola ruta, dos casas: el atleta ve su día; el entrenador, su equipo y, en el mismo sitio, el panel y el mercado (ingresos, solicitudes y eventos).
export default function Home() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('team');
  if (user?.role === 'coach') {
    const switcher = (
      <View style={{ maxWidth: 440, width: '100%' }}>
        <Segmented value={section} onChange={setSection} options={[{ key: 'team', label: 'Equipo' }, { key: 'panel', label: 'Panel' }, { key: 'market', label: 'Mercado' }]} />
      </View>
    );
    return section === 'team' ? <TeamHome top={switcher} /> : section === 'panel' ? <TeamPanel top={switcher} /> : <CoachMarket top={switcher} />;
  }
  return <WeekView hero canLog webTitle="Hoy" top={<><TodayRings /><AthleteMarketCards /><CheckinCard /></>} />;
}
