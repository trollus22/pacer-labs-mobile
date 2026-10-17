import { Platform } from 'react-native';
import { fonts } from './tokens';
import { useTheme } from './context';

// Cabecera nativa de iOS con título grande y material translúcido. En web no existe: cada pantalla pinta su título.
export function useLargeTitleHeader() {
  const { colors, scheme } = useTheme();
  return {
    headerShown: Platform.OS !== 'web',
    headerLargeTitleEnabled: true,
    headerTransparent: Platform.OS === 'ios',
    headerBlurEffect: scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerLargeStyle: { backgroundColor: 'transparent' },
    headerStyle: { backgroundColor: Platform.OS === 'ios' ? undefined : colors.bg },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
    headerLargeTitleStyle: { fontFamily: fonts.regular, color: colors.text, fontSize: 36 },
    contentStyle: { backgroundColor: colors.bg },
  } as const;
}

/** Cabecera con solo el botón de volver, para pantallas con encabezado propio. */
export function useFloatingHeader() {
  const { colors } = useTheme();
  return {
    headerShown: true,
    // En iOS la cabecera flota sobre el contenido; en Android y web ocupa su sitio para no pisarlo.
    headerTransparent: Platform.OS === 'ios',
    headerStyle: { backgroundColor: Platform.OS === 'ios' ? undefined : colors.bg },
    headerTitle: '',
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    headerTintColor: colors.text,
    contentStyle: { backgroundColor: colors.bg },
  } as const;
}
