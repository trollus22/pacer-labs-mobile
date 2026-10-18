import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { GlassTabs } from '@/components/GlassTabs';
import { fonts, accent, useTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';

const IS_PAD = Platform.OS === 'ios' && Platform.isPad;

// iPhone: barra de pestañas real de la plataforma (Liquid Glass en iOS 26). iPad: la misma barra inferior flotante de cristal,
// en vez de las pestañas de arriba / barra lateral de iPadOS, para no quitar sitio al contenido. Las pestañas nunca se deslizan.
export default function TabsLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const wide = useWide();

  if (IS_PAD) return <GlassTabs coach={coach} />;

  return (
    <NativeTabs tintColor={accent.coral} labelStyle={{ fontFamily: fonts.bold }} backgroundColor={colors.bg}>
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
    </NativeTabs>
  );
}
