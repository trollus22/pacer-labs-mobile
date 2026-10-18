// Sin degradados de malla: las superficies destacadas son planas, con un tinte muy suave (se mantienen el tipo `Mesh` y los nombres).
import { sports, type Sport } from './tokens';
import { darken } from '@/lib/color';

export type Blob = { c: string; x: number; y: number; rx: number; ry?: number; o?: number };
export type Mesh = { base: string; blobs: Blob[] };

/** Tarjeta destacada: acero con un punto de azul pizarra (texto oscuro encima). */
export const heroMesh: Mesh = { base: '#D3DBE3', blobs: [] };
/** Variante cálida: acero con un punto de arena. */
export const warmMesh: Mesh = { base: '#E6DFD0', blobs: [] };

/** Entreno: versión profunda del tono apagado del deporte (texto blanco encima). */
export function sportMesh(sport: Sport): Mesh {
  return { base: darken(sports[sport].color, 0.42), blobs: [] };
}

export const pageGlow: Mesh = { base: '#F4F4F2', blobs: [] };
