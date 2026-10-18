import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { AppBackground } from './AppBackground';
import { Button } from './Button';
import { GUTTER, useTheme, createStyles } from '@/theme';
import { ContentWidthProvider } from '@/lib/layout';
import { FLOATING_BAR_SPACE } from './GlassTabBar';

type Props = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Título grande solo en web: en iOS lo pinta la cabecera nativa. */
  webTitle?: string;
  contentStyle?: StyleProp<ViewStyle>;
  keyboard?: boolean;
  /** Sin fondo propio, para pintar algo detrás (degradado del detalle). */
  transparent?: boolean;
};

// Contenedor de pantalla: fondo negro, insets automáticos (cabecera nativa y barra de pestañas) y pull-to-refresh nativo.
export function Screen({ children, refreshing, onRefresh, webTitle, contentStyle, keyboard, transparent }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [measured, setMeasured] = useState(0);
  const win = useWindowDimensions().width;
  const wide = (measured || win) >= 700;
  // iPad (y la vista web ancha) llevan la barra flotante de cristal encima del contenido: hay que dejarle sitio.
  const floating = (Platform.OS === 'ios' && Platform.isPad) || Platform.OS === 'web';
  return (
    <View onLayout={(e) => setMeasured(Math.round(e.nativeEvent.layout.width))} style={{ flex: 1, backgroundColor: transparent ? 'transparent' : colors.bg }}>
      {transparent ? null : <AppBackground />}
    <ScrollView
      style={[styles.scroll, { backgroundColor: 'transparent' }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={keyboard ? 'interactive' : 'none'}
      automaticallyAdjustKeyboardInsets={keyboard}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, wide && { paddingHorizontal: 32, gap: 28 }, floating && { paddingBottom: FLOATING_BAR_SPACE }, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} /> : undefined}
    >
      {Platform.OS === 'web' && webTitle ? <Text variant="largeTitle" style={styles.webTitle}>{webTitle}</Text> : null}
      <ContentWidthProvider value={measured}>{children}</ContentWidthProvider>
    </ScrollView>
    </View>
  );
}

export function Loading() {
  const { colors } = useTheme();
  const styles = useStyles();
  return <View style={styles.center}><ActivityIndicator color={colors.textSecondary} /></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <Text variant="headline" center>No se pudo cargar</Text>
      <Text variant="subhead" color={colors.textSecondary} center>{message}</Text>
      <View style={{ marginTop: 8 }}><Button title="Reintentar" kind="ghost" small onPress={onRetry} /></View>
    </View>
  );
}

export const Section = ({ title, trailing, children }: { title: string; trailing?: ReactNode; children: ReactNode }) => {
  const styles = useStyles();
  return (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <Text variant="title3">{title}</Text>
      {trailing}
    </View>
    {children}
  </View>
);
};

const useStyles = createStyles((colors) => ({
  scroll: { flex: 1, backgroundColor: colors.bg },
  // En pantallas anchas (web/tablet) el contenido se centra con un ancho máximo: misma tarjeta, más columnas.
  content: { paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 48, gap: 24, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  webTitle: { marginTop: 24 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, paddingHorizontal: 32, gap: 6 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
