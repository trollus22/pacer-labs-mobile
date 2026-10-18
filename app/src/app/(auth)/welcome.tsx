import { View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { Keyframe, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { AppBackground } from '@/components/AppBackground';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { GUTTER, fonts, useTheme, createStyles, ForceScheme } from '@/theme';
import { EASE_OUT } from '@/lib/motion';

// Entrada escalonada: es la única pantalla que se ve una vez por sesión, así que aquí sí hay lugar para un gesto de marca.
const rise = (delay: number) =>
  new Keyframe({ from: { opacity: 0, transform: [{ translateY: 18 }] }, to: { opacity: 1, transform: [{ translateY: 0 }], easing: EASE_OUT } }).duration(650).delay(delay);
const logoIn = new Keyframe({ from: { opacity: 0, transform: [{ scale: 0.86 }] }, to: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT } }).duration(800);

export default function Welcome() {
  return (
    <ForceScheme scheme="dark">
      <StatusBar style="dark" />
      <WelcomeScreen />
    </ForceScheme>
  );
}

function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const at = (d: number) => (reduced ? undefined : rise(d));
  return (
    <View style={styles.root}>
      <AppBackground metalHeight="72%" />
      <View style={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 20 }]}>
        <Animated.View entering={reduced ? undefined : logoIn} style={styles.brand}>
          <Logo width={92} />
          <Text variant="title3" style={styles.wordmark}>PACER <Text variant="title3" color={colors.textSecondary} style={styles.labs}>LABS</Text></Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <View style={styles.copy}>
          <Animated.View entering={at(250)}>
            <Text style={styles.headline}>Entrena con{'\n'}<Text style={[styles.headline, { fontFamily: fonts.regular, color: colors.text }]}>intención.</Text></Text>
          </Animated.View>
          <Animated.View entering={at(380)}>
            <Text variant="body" color={colors.textSecondary} style={{ maxWidth: 320 }}>Tu plan, tu progreso y tu entrenador, en un solo lugar.</Text>
          </Animated.View>
        </View>

        <Animated.View entering={at(520)} style={styles.actions}>
          <Button title="Crear cuenta" onPress={() => router.push('/register')} />
          <PressableScale onPress={() => router.push('/login')} style={styles.link} accessibilityLabel="Iniciar sesión">
            <Text variant="headline" color={colors.textSecondary}>Ya tengo cuenta</Text>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: '72%' },
  // En pantallas anchas el contenido se acota y se centra (misma composición, más aire).
  content: { flex: 1, paddingHorizontal: GUTTER, width: '100%', maxWidth: 520, alignSelf: 'center' },
  brand: { alignItems: 'flex-start', gap: 18 },
  wordmark: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: 3 },
  labs: { fontFamily: fonts.medium, fontSize: 20, letterSpacing: 4.5 },
  copy: { gap: 14, marginBottom: 36 },
  // Dos tonos, como en la referencia: la primera línea ligera y atenuada, la segunda regular y blanca.
  headline: { fontFamily: fonts.light, fontSize: 48, lineHeight: 52, letterSpacing: -1.8, color: '#5C5C5C' },
  actions: { gap: 4 },
  link: { height: 52, alignItems: 'center', justifyContent: 'center' },
}));
