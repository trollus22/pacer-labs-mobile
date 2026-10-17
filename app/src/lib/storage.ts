import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Llavero en el móvil; localStorage solo en la vista web de pruebas.
const KEY = 'pacer.token';
export async function loadToken(): Promise<string | null> {
  try { return Platform.OS === 'web' ? window.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY); } catch { return null; }
}
export async function saveToken(token: string | null) {
  try {
    if (Platform.OS === 'web') { if (token) window.localStorage.setItem(KEY, token); else window.localStorage.removeItem(KEY); }
    else if (token) await SecureStore.setItemAsync(KEY, token);
    else await SecureStore.deleteItemAsync(KEY);
  } catch { /* sin almacenamiento: la sesión dura lo que dure la app */ }
}

const PREF_KEY = 'pacer.theme';
export async function loadPref(): Promise<'system' | 'light' | 'dark' | null> {
  try {
    const v = Platform.OS === 'web' ? window.localStorage.getItem(PREF_KEY) : await SecureStore.getItemAsync(PREF_KEY);
    return v === 'system' || v === 'light' || v === 'dark' ? v : null;
  } catch { return null; }
}
export async function savePref(pref: 'system' | 'light' | 'dark') {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(PREF_KEY, pref);
    else await SecureStore.setItemAsync(PREF_KEY, pref);
  } catch { /* sin almacenamiento: vale para esta sesión */ }
}

// «Ahora no» en la pantalla de relojes: se recuerda por usuario para no insistir en cada inicio de sesión.
const skipKey = (userId: string) => `pacer.devices.skip.${userId}`;
export async function loadDevicesSkipped(userId: string): Promise<boolean> {
  try { return (Platform.OS === 'web' ? window.localStorage.getItem(skipKey(userId)) : await SecureStore.getItemAsync(skipKey(userId))) === '1'; } catch { return false; }
}
export async function saveDevicesSkipped(userId: string) {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(skipKey(userId), '1');
    else await SecureStore.setItemAsync(skipKey(userId), '1');
  } catch { /* sin almacenamiento: se volverá a preguntar */ }
}
