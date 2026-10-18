import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { palettes, type Palette, type Scheme } from './tokens';
import { loadPref, savePref } from '@/lib/storage';

export type ThemePref = 'system' | 'light' | 'dark';

type Theme = {
  colors: Palette;
  scheme: Scheme;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  /** Color de acento listo para usarse como TEXTO: en modo claro se oscurece para llegar a contraste legible. */
  ink: (color: string) => string;
};

const Ctx = createContext<Theme | null>(null);
export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme fuera de ThemeProvider');
  return c;
};

/** Estilos que dependen de la paleta. Se declaran fuera del componente y se leen con `const styles = useStyles()`. */
export function createStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(factory: (c: Palette) => T) {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Oscuro por defecto: es el aspecto de la marca. «Sistema» sigue el ajuste del teléfono.
export function ThemeProvider({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadPref().then((p) => { if (p) setPrefState(p); setLoaded(true); });
  }, []);
  useEffect(() => { if (loaded) onReady?.(); }, [loaded, onReady]);

  // También se lo decimos al sistema para que teclado, alertas y barras nativas sigan el mismo modo.
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
  }, [pref]);

  const setPref = useCallback((p: ThemePref) => { setPrefState(p); void savePref(p); }, []);
  const scheme: Scheme = 'light'; // un único tema: hormigón claro
  void system;

  const value = useMemo<Theme>(() => ({
    colors: palettes[scheme], scheme, pref, setPref,
    ink: (c: string) => c,
  }), [scheme, pref, setPref]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Fuerza un modo para un subárbol (p. ej. la pantalla de bienvenida, que es siempre oscura). */
export function ForceScheme({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  const base = useTheme();
  const value = useMemo<Theme>(() => ({ ...base, colors: palettes[scheme], scheme, ink: (c: string) => c }), [base, scheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
