import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

// El ancho que importa es el del CONTENIDO, no el de la ventana: en iPad la barra lateral del sistema (y Split View) le quita sitio.
// `Screen` mide su contenedor y lo publica aquí; fuera de una pantalla se usa el ancho de la ventana.
const WidthCtx = createContext<number | null>(null);
export const ContentWidthProvider = WidthCtx.Provider;

export function useContentWidth(): number {
  const c = useContext(WidthCtx);
  const w = useWindowDimensions().width;
  return c && c > 0 ? c : w;
}
/** iPad: la app se organiza como el panel de escritorio, con más columnas y todo a la vista. */
export const useWide = () => useContentWidth() >= 700;
/** Contenido ancho (iPad en horizontal con o sin barra lateral): tablas y rejillas de siete columnas. */
export const useXWide = () => useContentWidth() >= 900;
