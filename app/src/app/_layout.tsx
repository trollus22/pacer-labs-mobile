import { useCallback, useEffect, useState } from 'react';
import { Stack, ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider, accent, useTheme } from '@/theme';

SplashScreen.setOptions({ duration: 380, fade: true });
void SplashScreen.preventAutoHideAsync();

export default function Root() {
  const [fontsLoaded] = useFonts({
    Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });
  const [themeReady, setThemeReady] = useState(false);
  const onThemeReady = useCallback(() => setThemeReady(true), []);
  return (
    <ThemeProvider onReady={onThemeReady}>
      <GestureRoot>
        <AuthProvider>
          <Gate ready={fontsLoaded && themeReady} />
        </AuthProvider>
      </GestureRoot>
    </ThemeProvider>
  );
}

function GestureRoot({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>{children}</GestureHandlerRootView>;
}

function Gate({ ready: assetsReady }: { ready: boolean }) {
  const { status } = useAuth();
  const { colors, scheme } = useTheme();
  const reduced = useReducedMotion();
  const ready = assetsReady && status !== 'loading';
  useEffect(() => { if (ready) void SplashScreen.hideAsync(); }, [ready]);
  if (!ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.separator, primary: accent.coral } };
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: reduced ? 'fade' : 'default' }}>
        {/* Entrar y salir de la sesión es un fundido, no un deslizamiento: no es «ir más adentro» en la jerarquía. */}
        <Stack.Protected guard={status === 'out'}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'in'}>
          <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}
