import { WeekGrid } from '@/components/WeekGrid';
import { WeekView } from '@/components/WeekView';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';

// iPhone: semana con tira de días. iPad: los siete días en columnas (y, para el entrenador, el equipo entero).
export default function Calendar() {
  const wide = useWide();
  const { user } = useAuth();
  if (wide) return <WeekGrid coach={user?.role === 'coach'} />;
  return <WeekView nav webTitle="Calendario" />;
}
