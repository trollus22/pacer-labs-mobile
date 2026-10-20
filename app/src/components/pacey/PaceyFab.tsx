import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../PressableScale';
import { PaceyAvatar } from './PaceyAvatar';
import { haptic } from '@/lib/haptics';

const SIZE = 64;

/**
 * Pacey centrado justo encima de la barra de pestañas nativa del iPhone, casi tocando su borde superior. La barra de iOS 26 es de Liquid Glass real
 * del sistema (se encoge al hacer scroll) y no admite vistas propias dentro, así que Pacey va a su lado, sin cristal y animado. La barra mide unos 62 pt y queda ~23 pt sobre el borde inferior (cerca del indicador de inicio).
 */
export function PaceyFab() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', bottom: Math.max(insets.bottom, 12) + 50 }}>
      <PressableScale scale={0.92} onPress={() => { haptic.select(); router.push('/pacer'); }} accessibilityLabel="Pacey, tu asistente" accessibilityHint="Abre el chat">
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } }}>
          <PaceyAvatar size={SIZE} variety />
        </View>
      </PressableScale>
    </View>
  );
}
