import { useLocalSearchParams } from 'expo-router';
import { PacerChat, type PacerParams } from '@/components/pacer/PacerChat';

/** Pacer a pantalla completa (botón de la barra de pestañas o «Abrir en grande»). */
export default function PacerScreen() {
  const params = useLocalSearchParams<PacerParams>();
  return <PacerChat mode="full" params={params} />;
}
