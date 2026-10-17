import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Una vibración por acción del usuario, en el mismo instante que el cambio visual. Nunca es el único feedback.
const on = Platform.OS !== 'web';
export const haptic = {
  select: () => { if (on) void Haptics.selectionAsync(); },
  light: () => { if (on) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
  medium: () => { if (on) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
  success: () => { if (on) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
  error: () => { if (on) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); },
};
