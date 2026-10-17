import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { ErrorState, Loading, Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { ActionTile } from '@/components/Tile';
import { accent, useTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { useQuery } from '@/lib/query';
import { saveDevicesSkipped } from '@/lib/storage';
import type { WearablesInfo } from '@/lib/types';
import { brand, providerNote } from '@/lib/wearables';

// Pantalla de relojes y pulseras. Con `first=1` es la bienvenida tras iniciar sesión (y se puede saltar); si no, se abre desde Perfil.
export default function Devices() {
  const { first } = useLocalSearchParams<{ first?: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data, error, refresh, refreshing } = useQuery<WearablesInfo>('/wearables');
  const [leaving, setLeaving] = useState(false);
  const welcome = first === '1';

  const done = async () => {
    setLeaving(true);
    if (welcome && user) await saveDevicesSkipped(user.id);
    if (router.canGoBack()) router.back(); else router.replace('/');
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingTop: welcome ? 56 : 28, gap: 22 }}>
      <View style={{ gap: 8 }}>
        <MaterialCommunityIcons name="watch-variant" size={34} color={colors.text} />
        <Text variant="largeTitle">{welcome ? 'Conecta tu reloj' : 'Relojes y pulseras'}</Text>
        <Text variant="body" secondary>
          Elige la marca de tu reloj o pulsera e inicia sesión. Importamos tu sueño, pulso en reposo, HRV y entrenos para calcular tu recuperación sin que tengas que escribirlo.
        </Text>
      </View>

      {data ? (
        <>
          {!data.configured ? (
            <Text variant="subhead" color={accent.amber}>La conexión con relojes todavía no está activada en este servidor.</Text>
          ) : null}
          <View style={{ gap: 12 }}>
            {data.providers.map((p, i) => (
              <ActionTile
                key={p.id} index={i}
                icon={p.state === 'connected' ? 'check-circle-outline' : brand[p.id].icon}
                iconColor={p.state === 'connected' ? accent.green : p.state === 'reconnect' ? accent.amber : brand[p.id].color}
                title={p.name}
                note={providerNote(p)}
                onPress={() => { haptic.light(); router.push({ pathname: '/connect/[provider]', params: { provider: p.id } }); }}
                accessibilityLabel={`${p.name}. ${p.state === 'connected' ? 'Conectado' : p.state === 'reconnect' ? 'Hay que volver a conectarlo' : 'Sin conectar'}`}
              />
            ))}
          </View>

          <View style={{ gap: 10 }}>
            <Text variant="caption" secondary>Próximamente</Text>
            {data.soon.map((s) => (
              <View key={s.id} accessible accessibilityLabel={`${s.name}. ${s.reason}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textTertiary} />
                <View style={{ flex: 1 }}>
                  <Text variant="subhead">{s.name}</Text>
                  <Text variant="footnote" tertiary>{s.reason}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : error ? <ErrorState message={error.message} onRetry={refresh} /> : <Loading />}

      <Button title={welcome ? (data?.hasConnection ? 'Continuar' : 'Ahora no') : 'Listo'} kind={welcome && !data?.hasConnection ? 'ghost' : 'primary'} onPress={done} loading={leaving} />
      {welcome ? <Text variant="footnote" tertiary center>Siempre puedes conectarlo después desde Perfil.</Text> : null}
    </Screen>
  );
}
