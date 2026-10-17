import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { accent } from '@/theme';
import type { Driver, ReadinessStatus, Suitability } from './types';

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Estados de recuperación. El color nunca va solo: siempre con icono y etiqueta.
export const STATUS: Record<ReadinessStatus, { label: string; long: string; icon: Icon; color: string }> = {
  ready: { label: 'Listo', long: 'Listo para entrenar', icon: 'check-circle', color: accent.green },
  caution: { label: 'Precaución', long: 'Con precaución', icon: 'alert-circle', color: accent.amber },
  rest: { label: 'Descanso', long: 'Necesita descansar', icon: 'power-sleep', color: accent.pink },
  unknown: { label: 'Sin datos', long: 'Sin datos suficientes', icon: 'help-circle-outline', color: '#9898A0' },
};

// Valoración de un entreno para un atleta concreto.
export const SUIT: Record<Suitability, { label: string; icon: Icon; color: string }> = {
  good: { label: 'Recomendado', icon: 'check-circle', color: accent.green },
  caution: { label: 'Con precaución', icon: 'alert-circle', color: accent.amber },
  avoid: { label: 'No recomendado', icon: 'close-circle', color: accent.pink },
  unknown: { label: 'Sin datos', icon: 'help-circle-outline', color: '#9898A0' },
};

export const DRIVER_ICON: Record<Driver['tone'], { icon: Icon; color: string }> = {
  good: { icon: 'check-circle', color: accent.green },
  warn: { icon: 'alert-circle', color: accent.amber },
  bad: { icon: 'close-circle', color: accent.pink },
  info: { icon: 'information-outline', color: '#9898A0' },
};

export const CONFIDENCE: Record<string, string> = { high: 'Fiabilidad alta', medium: 'Fiabilidad media', low: 'Fiabilidad baja', none: 'Sin datos' };

/** Color de una nota 0–100 (bienestar, carga, sensaciones). */
export const scoreColor = (v: number) => (v >= 70 ? accent.green : v >= 45 ? accent.amber : accent.pink);
