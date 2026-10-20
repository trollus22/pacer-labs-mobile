import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../PressableScale';
import { PaceyAvatar } from './PaceyAvatar';
import { haptic } from '@/lib/haptics';

/**
 * Botón de Pacey flotante sobre la barra de pestañas nativa del iPhone. La barra de iOS 26 es de Liquid Glass real del sistema
 * (se encoge al hacer scroll) y no admite vistas propias dentro, así que Pacey va justo encima, a la derecha.
 */
export function PaceyFab() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 14, bottom: insets.bottom + 86 }}>
      <PressableScale scale={0.92} onPress={() => { haptic.select(); router.push('/pacer'); }} accessibilityLabel="Pacey, tu asistente" accessibilityHint="Abre el chat">
        <View style={{ width: 66, height: 66, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } }}>
          <PaceyAvatar size={66} variety />
        </View>
      </PressableScale>
    </View>
  );
}
