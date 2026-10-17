import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { accent } from '@/theme';
import { timeAgo } from './dates';
import type { WearableId, WearableProvider } from './types';

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Un color y un icono por marca. Solo identifican; el estado siempre lleva texto.
export const brand: Record<WearableId, { color: string; icon: Icon }> = {
  garmin: { color: accent.blue, icon: 'watch-variant' },
  zepp: { color: accent.amber, icon: 'watch' },
  coros: { color: accent.coral, icon: 'watch-vibrate' },
};

export function providerNote(p: WearableProvider): string {
  if (p.state === 'reconnect') return 'Hay que volver a iniciar sesión para seguir sincronizando.';
  if (p.state === 'connected') return p.lastSyncAt ? `Conectado · sincronizado ${timeAgo(p.lastSyncAt)}` : 'Conectado · sincronizando…';
  return p.data.join(' · ');
}
