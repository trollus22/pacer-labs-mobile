import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * «Iniciar sesión con Apple» solo existe en builds firmadas con una cuenta de Apple Developer de pago (ver app.config.js).
 * Si la build no lleva la capacidad, el botón no aparece: con una cuenta gratuita, tocarlo fallaría.
 */
export const appleEnabled = Platform.OS === 'ios' && Constants.expoConfig?.extra?.appleSignIn === true;

export type AppleCredential = { identityToken: string; nonce: string; fullName?: string };

/** Pide a Apple la identidad. El nonce evita reutilizar un token robado: a Apple se le manda su SHA-256 y a nuestra API el valor en claro. */
export async function appleCredential(): Promise<AppleCredential | null> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Crypto = require('expo-crypto') as typeof import('expo-crypto');
  const raw = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  try {
    const c = await Apple.signInAsync({ requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL], nonce: hashed });
    if (!c.identityToken) throw new Error('Apple no devolvió la identidad. Inténtalo de nuevo.');
    const name = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(' ').trim();   // Apple solo da el nombre la primera vez
    return { identityToken: c.identityToken, nonce: raw, fullName: name || undefined };
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;   // el usuario cerró la hoja de Apple
    throw e;
  }
}
