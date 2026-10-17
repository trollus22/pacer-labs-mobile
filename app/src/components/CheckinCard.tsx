import { router } from 'expo-router';
import { ActionTile } from './Tile';
import { accent } from '@/theme';
import { todayISO } from '@/lib/dates';
import { useQuery } from '@/lib/query';
import type { Checkin } from '@/lib/types';

// Acceso al check-in diario del atleta: pendiente (cristal cálido, invita a hacerlo) o hecho (tarjeta plana que resume y permite corregir).
export function CheckinCard() {
  const { data } = useQuery<{ date: string; checkin: Checkin | null }>(`/checkins/today?date=${todayISO()}`);
  if (!data) return null;
  const c = data.checkin;
  return (
    <ActionTile
      variant={c ? 'plain' : 'warm'}
      icon={c ? 'check-circle-outline' : 'heart-pulse'} iconColor={c ? accent.green : undefined}
      title={c ? 'Check-in de hoy hecho' : 'Check-in de hoy'}
      note={c ? `Sueño ${String(c.sleepHours).replace('.', ',')} h · agujetas ${c.soreness}/5 · ánimo ${c.mood}/5` : 'Cuéntale a tu entrenador cómo estás. Son 30 segundos.'}
      onPress={() => router.push('/checkin')}
      accessibilityLabel={c ? 'Check-in de hoy hecho. Toca para editarlo' : 'Hacer el check-in de hoy'}
    />
  );
}
