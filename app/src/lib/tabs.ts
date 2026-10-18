import type { TabItem } from '@/components/GlassTabBar';

/** Pestañas de cada rol (iPad y vista web ancha usan la barra flotante de cristal; el iPhone, la nativa). */
export function tabItems(coach: boolean, wide: boolean): TabItem[] {
  return coach
    ? [
      { name: '(home)', label: 'Equipo', icon: 'account-group' },
      ...(wide ? [{ name: '(calendar)', label: 'Calendario', icon: 'calendar-month' } as TabItem] : []),
      { name: '(you)', label: 'Tú', icon: 'run-fast' },
      { name: '(profile)', label: 'Perfil', icon: 'account-circle' },
    ]
    : [
      { name: '(home)', label: 'Hoy', icon: 'lightning-bolt' },
      { name: '(calendar)', label: 'Calendario', icon: 'calendar-month' },
      { name: '(form)', label: 'Forma', icon: 'heart-pulse' },
      { name: '(profile)', label: 'Perfil', icon: 'account-circle' },
    ];
}
