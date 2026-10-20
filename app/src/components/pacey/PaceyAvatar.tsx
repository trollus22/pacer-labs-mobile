import { useEffect, useId, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, G, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';
import { PACEY_BOX, PACEY_VARIETY, paceyPose, paceyVarietyPose, type PaceyMood } from '@/lib/pacey';

const FPS = 60;

/**
 * Pacey, el asistente de IA: nube de acero con dos ojos, animada con las expresiones y animaciones de su archivo
 * (`assets/pacey/pacey.avatar.json`). `mood` elige la animación (reposo, escuchando, pensando…); `still` lo deja quieto.
 * `onDark`: difumina la parte baja como en las imágenes de marca (sobre fondo oscuro); en claro, sombreado de acero.
 */
export function PaceyAvatar({ size = 64, mood = 'idle', variety, still, onDark, seed = 1, style }: {
  size?: number; mood?: PaceyMood | 'neutral';
  /** Encadena animaciones distintas (5–9 s cada una, fundidas) en vez de repetir siempre `mood`. */
  variety?: boolean;
  still?: boolean; onDark?: boolean; seed?: number; style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [ms, setMs] = useState(0);
  const start = useRef(0);
  const animate = !still && !reduced;

  useEffect(() => {
    if (!animate) return;
    let raf = 0, last = 0;
    start.current = 0;
    const tick = (t: number) => {
      if (!start.current) start.current = t;
      if (t - last >= 1000 / FPS) { last = t; setMs(t - start.current); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, mood, variety]);

  // Quieto (o con «reducir movimiento»): una pose fija de la animación, con los ojos abiertos.
  const p = variety && animate ? paceyVarietyPose(PACEY_VARIETY, ms, seed) : paceyPose(mood, animate ? ms : 800, seed);
  const B = PACEY_BOX;
  // Sombreado de acero suave abajo; sobre fondo oscuro el difuminado empieza bajo los ojos y nunca desaparece del todo,
  // para que los ojos se lean también cuando Pacey mira hacia abajo.
  const shade = mixToward(p.bodyColor, onDark ? '#6E737A' : '#8E949B', onDark ? 0.3 : 0.45);
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="image" accessibilityLabel="Pacey, el asistente">
      <Svg width={size} height={size} viewBox={`${B.x} ${B.y} ${B.size} ${B.size}`}>
        <Defs>
          <LinearGradient id={`b${uid}`} x1="0" y1={B.top} x2="0" y2={B.bottom} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={mixToward(p.bodyColor, '#FFFFFF', 0.25)} />
            <Stop offset="0.5" stopColor={p.bodyColor} />
            <Stop offset="1" stopColor={shade} />
          </LinearGradient>
          {onDark ? (
            <>
              <LinearGradient id={`f${uid}`} x1="0" y1={B.top} x2="0" y2={B.bottom} gradientUnits="userSpaceOnUse">
                <Stop offset="0.7" stopColor="#fff" stopOpacity={1} />
                <Stop offset="0.86" stopColor="#fff" stopOpacity={0.72} />
                <Stop offset="1" stopColor="#fff" stopOpacity={0.32} />
              </LinearGradient>
              <Mask id={`m${uid}`} maskUnits="userSpaceOnUse" x={B.x} y={B.y} width={B.size} height={B.size}>
                <Rect x={B.x} y={B.y} width={B.size} height={B.size} fill={`url(#f${uid})`} />
              </Mask>
            </>
          ) : null}
        </Defs>
        <G mask={onDark ? `url(#m${uid})` : undefined}>
          <G transform={`translate(${p.shake.body} ${p.drift}) rotate(${p.roll}) scale(${p.breath})`}>
            {p.blobs.map((b, i) => <Ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={`url(#b${uid})`} />)}
          </G>
        </G>
        <G transform={`translate(${p.shake.body} ${p.drift}) rotate(${p.roll}) scale(${p.breath})`}>
          <G transform={`translate(${p.shake.eyes} 0)`}>
            {p.eyes.map((e, i) => (
              <Rect key={i} x={e.cx - e.w / 2} y={e.cy - e.h / 2} width={e.w} height={e.h} rx={Math.min(e.w, e.h) / 2} fill={p.eyeColor}
                transform={e.angle ? `rotate(${e.angle} ${e.cx} ${e.cy})` : undefined} />
            ))}
          </G>
        </G>
      </Svg>
    </View>
  );
}

function mixToward(a: string, b: string, t: number) {
  const h = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const x = h(a), y = h(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Pacey en su círculo oscuro (botón de la barra, mensajes, cabecera): mismo aspecto en cualquier fondo. */
export function PaceyBadge({ size = 32, mood = 'idle', still, variety }: { size?: number; mood?: PaceyMood | 'neutral'; still?: boolean; variety?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#111316', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <PaceyAvatar size={size * 0.92} mood={mood} still={still} variety={variety} onDark />
    </View>
  );
}
