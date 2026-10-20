import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { loadDevicesSkipped } from '@/lib/storage';
import type { WearablesInfo } from '@/lib/types';
import { useFloatingHeader } from '@/theme/header';

export const unstable_settings = { initialRouteName: '(tabs)' };

// Tras iniciar sesión, un atleta sin reloj conectado ve una vez la pantalla de relojes (se puede saltar y no vuelve a insistir).
function useDevicesPrompt() {
  const { user } = useAuth();
  const asked = useRef<string | null>(null);
  useEffect(() => {
    if (!user || user.role !== 'athlete' || asked.current === user.id) return;
    asked.current = user.id;
    (async () => {
      try {
        if (await loadDevicesSkipped(user.id)) return;
        const info = await api<WearablesInfo>('/wearables');
        if (info.configured && !info.hasConnection) router.push('/devices?first=1');
      } catch { /* sin red o sin servicio: no se molesta al atleta */ }
    })();
  }, [user]);
}

// En iPad las hojas formSheet con altura por fracciones salen vacías; allí se usa la hoja modal de página estándar (centrada, del sistema).
const IS_PAD = Platform.OS === 'ios' && Platform.isPad;
const sheetOpts = <T extends object>(o: T) => (IS_PAD ? { presentation: 'modal' as const, gestureEnabled: true, contentStyle: (o as { contentStyle?: object }).contentStyle } : { presentation: 'formSheet' as const, ...o });

export default function AppLayout() {
  useDevicesPrompt();
  const { colors } = useTheme();
  const floatingHeader = useFloatingHeader();
  const reduced = useReducedMotion();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: reduced ? 'fade' : 'default' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="workout/[id]" options={{ ...floatingHeader, animationMatchesGesture: true, fullScreenGestureEnabled: true }} />
      <Stack.Screen name="athlete/[id]" options={{ ...floatingHeader, animationMatchesGesture: true, fullScreenGestureEnabled: true, headerTitle: undefined, headerTitleStyle: { color: colors.text, fontFamily: 'Inter_600SemiBold' } }} />
      <Stack.Screen name="workout/edit" options={{ presentation: 'modal', headerShown: true, title: 'Entreno', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, headerShadowVisible: false, headerTitleStyle: { fontFamily: 'Inter_600SemiBold' }, contentStyle: { backgroundColor: colors.surface }, animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="metric/[key]" options={{ ...sheetOpts({ sheetAllowedDetents: [0.92], sheetGrabberVisible: true, sheetCornerRadius: 32, contentStyle: { backgroundColor: colors.bg } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="checkin" options={{ ...sheetOpts({ sheetAllowedDetents: [0.96], sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="devices" options={{ presentation: 'modal', gestureEnabled: true, contentStyle: { backgroundColor: colors.bg }, animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="connect/[provider]" options={{ ...sheetOpts({ sheetAllowedDetents: [0.8, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="delete-account" options={{ ...sheetOpts({ sheetAllowedDetents: [0.9, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="sports" options={{ ...sheetOpts({ sheetAllowedDetents: [0.8, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="teams" options={{ ...sheetOpts({ sheetAllowedDetents: [0.7, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="pacer" options={{ animation: reduced ? 'fade' : 'default', fullScreenGestureEnabled: true, contentStyle: { backgroundColor: colors.bg } }} />
      <Stack.Screen name="pacer-sheet" options={{ ...sheetOpts({ sheetAllowedDetents: [0.62, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 32, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="market/checkout" options={{ ...sheetOpts({ sheetAllowedDetents: [0.86, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 32, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="market/review/[coachId]" options={{ ...sheetOpts({ sheetAllowedDetents: [0.9, 0.96], sheetGrabberVisible: true, sheetCornerRadius: 32, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="market/new-event" options={{ presentation: 'modal', gestureEnabled: true, contentStyle: { backgroundColor: colors.surface }, animation: reduced ? 'fade' : 'default' }} />
      <Stack.Screen name="log/[id]" options={{ ...sheetOpts({ sheetAllowedDetents: [0.94], sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: colors.surface } }), animation: reduced ? 'fade' : 'default' }} />
    </Stack>
  );
}
