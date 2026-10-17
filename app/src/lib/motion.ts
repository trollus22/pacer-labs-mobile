import { Easing, cubicBezier } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);     // entradas y salidas
/** La misma curva ease-out fuerte, para transiciones CSS de Reanimated. */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1); // movimiento en pantalla
