import { Platform, View } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { GlassTabs } from '@/components/GlassTabs';
import { PaceyFab } from '@/components/pacey/PaceyFab';
import { fonts, accent } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';

const IS_PAD = Platform.OS === 'ios' && Platform.isPad;
const IS_PHONE_IOS = Platform.OS === 'ios' && !Platform.isPad;

// iPhone: barra de pestañas NATIVA de iOS (Liquid Glass real del sistema en iOS 26, que se encoge al hacer scroll), con Pacey en un botón
// flotante justo encima. iPad, Android y web: barra flotante propia (GlassView en iOS 26, material desenfocado antes) con Pacey dentro.
export default function TabsLayout() {
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const wide = useWide();

  if (!IS_PHONE_IOS) return <GlassTabs coach={coach} wide={IS_PAD || wide} />;

  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor={accent.coral} labelStyle={{ fontFamily: fonts.semibold }} minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>{coach ? 'Equipo' : 'Hoy'}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={coach ? 'person.3.fill' : 'bolt.fill'} md={coach ? 'groups' : 'bolt'} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(calendar)" hidden={coach && !wide}>
          <NativeTabs.Trigger.Label>Calendario</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(form)" hidden={coach}>
          <NativeTabs.Trigger.Label>Forma</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="waveform.path.ecg" md="monitor_heart" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(you)" hidden={!coach}>
          <NativeTabs.Trigger.Label>Tú</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="figure.run" md="directions_run" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(profile)">
          <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="person" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="pacer-tab" hidden />
      </NativeTabs>
      <PaceyFab />
    </View>
  );
}
