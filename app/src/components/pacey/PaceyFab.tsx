import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../PressableScale';
import { PaceyAvatar } from './PaceyAvatar';
import { haptic } from '@/lib/haptics';

const SIZE = 60;

/**
 * Pacey junto a la barra de pestañas nativa del iPhone, en su misma fila y a su derecha. La barra de iOS 26 es de Liquid Glass real
 * del sistema (se encoge al hacer scroll) y no admite vistas propias dentro, así que Pacey va a su lado, sin cristal y animado.
 */
export function PaceyFab() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 2, bottom: Math.max(insets.bottom - 6, 10) }}>
      <PressableScale scale={0.92} onPress={() => { haptic.select(); router.push('/pacer'); }} accessibilityLabel="Pacey, tu asistente" accessibilityHint="Abre el chat">
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } }}>
          <PaceyAvatar size={SIZE} variety />
        </View>
      </PressableScale>
    </View>
  );
}
