import { useLocalSearchParams } from 'expo-router';
import { PacerChat, type PacerParams } from '@/components/pacer/PacerChat';

/** Pacey en hoja deslizable, abierto desde una tarjeta con su contexto (recuperación, entreno de hoy, panel del equipo). */
export default function PacerSheet() {
  const params = useLocalSearchParams<PacerParams>();
  return <PacerChat mode="sheet" params={params} />;
}
