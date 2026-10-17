import { CheckinCard } from '@/components/CheckinCard';
import { TodayRings } from '@/components/TodayRings';
import { WeekView } from '@/components/WeekView';
import { TeamHome } from '@/components/TeamHome';
import { useAuth } from '@/lib/auth';

// Una sola ruta, dos casas: el atleta ve su día; el entrenador, su equipo.
export default function Home() {
  const { user } = useAuth();
  if (user?.role === 'coach') return <TeamHome />;
  return <WeekView hero canLog webTitle="Hoy" top={<><TodayRings /><CheckinCard /></>} />;
}
