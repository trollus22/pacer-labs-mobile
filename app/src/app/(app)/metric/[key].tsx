import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MetricDetail, METRIC_TITLES } from '@/components/MetricDetail';
import { ErrorState, Loading, Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { todayISO } from '@/lib/dates';
import { useQuery } from '@/lib/query';
import type { Dashboard } from '@/lib/types';

// Hoja con el gráfico completo de una métrica: lo que abre el ↗ de cada tarjeta de Forma.
export default function MetricSheet() {
  const { key, path, days } = useLocalSearchParams<{ key: string; path: string; days: string }>();
  const { kept: d, error, refresh } = useQuery<Dashboard>(path ? `${path}?date=${todayISO()}&days=${days ?? 28}` : null);
  return (
    <Screen contentStyle={{ paddingTop: 28, gap: 16 }}>
      <Stack.Screen options={{ title: METRIC_TITLES[key] ?? 'Detalle' }} />
      <Text variant="largeTitle">{METRIC_TITLES[key] ?? 'Detalle'}</Text>
      {error && !d ? <ErrorState message={error.message} onRetry={refresh} /> : !d ? <Loading /> : <View style={{ gap: 14 }}><MetricDetail d={d} k={key} days={Number(days ?? 28)} /></View>}
    </Screen>
  );
}
