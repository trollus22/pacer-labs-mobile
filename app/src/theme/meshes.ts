// Degradados de malla: manchas de color con borde difuminado superpuestas sobre un color base. Dan el aspecto de
// «cristal esmerilado» de la tarjeta héroe de la referencia sin necesitar un motor de desenfoque.
import { sportGradient, type Sport } from './tokens';
import { darken, lighten } from '@/lib/color';

export type Blob = { c: string; x: number; y: number; rx: number; ry?: number; o?: number };
export type Mesh = { base: string; blobs: Blob[] };

/** Tarjeta héroe: azul acero + cobre/ámbar con un resplandor claro (azul y ámbar son los de la marca). */
export const heroMesh: Mesh = {
  base: '#2B6389',
  blobs: [
    { c: '#C5702F', x: 6, y: 92, rx: 78, ry: 70, o: 1 },
    { c: '#E8A667', x: 28, y: 62, rx: 38, ry: 34, o: 0.55 },
    { c: '#A596A6', x: 52, y: 52, rx: 44, ry: 38, o: 0.85 },
    { c: '#8DB4D2', x: 80, y: 30, rx: 50, ry: 46, o: 0.8 },
    { c: '#12405E', x: 96, y: 4, rx: 46, ry: 44, o: 0.95 },
  ],
};

/** Variante cálida (la tarjeta «Credit Age» de la referencia): cristal marrón-cobre. */
export const warmMesh: Mesh = {
  base: '#3A2819',
  blobs: [
    { c: '#8A5A2E', x: 20, y: 30, rx: 60, ry: 55, o: 0.95 },
    { c: '#C98A4B', x: 88, y: 80, rx: 55, ry: 50, o: 0.7 },
    { c: '#1F150C', x: 90, y: 5, rx: 40, ry: 40, o: 0.8 },
  ],
};

/** Mesh de un entreno: manchas del color del deporte. */
export function sportMesh(sport: Sport): Mesh {
  const [g0, g1] = sportGradient[sport];
  return {
    base: darken(g1, 0.45),
    blobs: [
      { c: g0, x: 10, y: 88, rx: 82, ry: 72, o: 1 },
      { c: lighten(g0, 0.35), x: 70, y: 22, rx: 52, ry: 46, o: 0.6 },
      { c: g1, x: 94, y: 78, rx: 58, ry: 56, o: 0.9 },
      { c: darken(g1, 0.7), x: 88, y: 2, rx: 46, ry: 44, o: 0.9 },
    ],
  };
}

/** Resplandor cálido detrás de las pantallas en modo claro (en oscuro el fondo es negro puro). */
export const pageGlow: Mesh = {
  base: '#F2F2F7',
  blobs: [
    { c: '#F6D58D', x: 78, y: 8, rx: 62, ry: 34, o: 0.85 },
    { c: '#F0A56B', x: 100, y: 34, rx: 52, ry: 36, o: 0.6 },
    { c: '#BCD3E6', x: 0, y: 22, rx: 60, ry: 36, o: 0.75 },
    { c: '#FFFFFF', x: 40, y: 0, rx: 50, ry: 22, o: 0.7 },
  ],
};
