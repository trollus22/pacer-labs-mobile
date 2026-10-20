import { Platform } from 'react-native';
import { GlassTabs } from '@/components/GlassTabs';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';

const IS_PAD = Platform.OS === 'ios' && Platform.isPad;

// Barra flotante propia en iPhone, iPad, Android y web: cápsula de pestañas + Pacey a su lado (Liquid Glass real con GlassView en iOS 26, material desenfocado antes).
export default function TabsLayout() {
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const wide = useWide();
  return <GlassTabs coach={coach} wide={IS_PAD || wide} />;
}
