import { Platform } from 'react-native';
import { GlassTabs } from '@/components/GlassTabs';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';

const IS_PAD = Platform.OS === 'ios' && Platform.isPad;

// Barra flotante de cristal (Liquid Glass real en iOS 26) en iPhone, iPad y Android, con Pacey animado en su círculo.
// La barra nativa de iOS solo admite iconos fijos: por eso no se usa (se pierde que se encoja al hacer scroll).
export default function TabsLayout() {
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const wide = useWide();
  return <GlassTabs coach={coach} wide={IS_PAD || wide} />;
}
