import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';
import { GlassTabs } from '@/components/GlassTabs';

// Vista web (pruebas y escritorio): la misma cápsula de cristal líquido flotante que en iPhone (iOS 26) y iPad.
export default function TabsLayout() {
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const wide = useWide();
  return <GlassTabs coach={coach} wide={wide} />;
}
