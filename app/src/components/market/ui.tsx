import type { ReactNode } from 'react';
import { Platform, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { Glass } from '../pacer/Glass';
import { accent, createStyles, fonts, sports, tone, useTheme } from '@/theme';
import { darken, lighten } from '@/lib/color';
import { haptic } from '@/lib/haptics';
import { dayNum, dec1, eur, monthShort, type MarketCoach, type MarketEvent, type MarketReview } from '@/lib/market';

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Círculo con iniciales en el tono del entrenador; con ✓ si su titulación está verificada. */
export function Initials({ initials, color, size = 48, verified, ring }: { initials: string; color: string; size?: number; verified?: boolean; ring?: boolean }) {
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: 'rgba(255,255,255,0.85)' }}>
        <Text style={{ color: '#fff', fontFamily: fonts.medium, fontSize: size * 0.34, letterSpacing: 0.2 }}>{initials}</Text>
      </View>
      {verified ? (
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: size * 0.36, height: size * 0.36, minWidth: 18, minHeight: 18, borderRadius: 12, backgroundColor: '#111', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="check-bold" size={Math.max(10, size * 0.2)} color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

export function Stars({ value, size = 13, color = tone.ochre }: { value: number; size?: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessibilityLabel={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => <MaterialCommunityIcons key={i} name="star" size={size} color={i <= Math.round(value) ? color : colors.surface3} />)}
    </View>
  );
}

export function StarInput({ value, onChange, size = 40, label }: { value: number; onChange: (v: number) => void; size?: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: size > 30 ? 10 : 2 }} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${value} de 5`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(1, Math.min(5, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}>
      {[1, 2, 3, 4, 5].map((i) => (
        <PressableScale key={i} scale={0.85} onPress={() => { haptic.select(); onChange(i); }} accessibilityLabel={`${i} estrellas`}>
          <MaterialCommunityIcons name="star" size={size} color={i <= value ? tone.ochre : colors.surface3} />
        </PressableScale>
      ))}
    </View>
  );
}

/** Píldora de contorno; `solid` = tinta. */
export function Tag({ label, color, solid, icon, small }: { label: string; color?: string; solid?: boolean; icon?: Icon; small?: boolean }) {
  const { colors } = useTheme();
  const fg = solid ? '#fff' : color ?? colors.text;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: small ? 9 : 12, height: small ? 24 : 32, borderRadius: 16,
      borderWidth: 1, borderColor: solid ? colors.ink : color ?? colors.hairline, backgroundColor: solid ? colors.ink : colors.surface }}>
      {icon ? <MaterialCommunityIcons name={icon} size={small ? 12 : 14} color={fg} /> : null}
      <Text variant="footnote" color={fg} style={{ fontSize: small ? 11.5 : 13, fontFamily: fonts.medium }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/** Fila de filtros que se pueden tocar (una sola activa). */
export function FilterChips<K extends string>({ options, value, onChange }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <PressableScale key={o.key} scale={0.94} onPress={() => { haptic.select(); onChange(o.key); }} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <View style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center', borderWidth: 1, borderColor: on ? colors.ink : colors.hairline, backgroundColor: on ? colors.ink : colors.surface }}>
              <Text variant="footnote" color={on ? '#fff' : colors.text} style={{ fontSize: 13.5, fontFamily: on ? fonts.semibold : fonts.regular }}>{o.label}</Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function CoachCard({ c, onPress }: { c: MarketCoach; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const full = c.spotsLeft <= 0;
  const few = !full && c.spotsLeft <= 3;
  return (
    <PressableScale scale={0.98} onPress={onPress} accessibilityLabel={`${c.name}. ${c.headline}. ${c.rating ? `${dec1(c.rating)} estrellas, ${c.reviewCount} reseñas.` : ''} Desde ${c.priceFrom} euros al mes.`}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Initials initials={c.initials} color={c.tone} size={54} verified={c.verified} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 16.5, flexShrink: 1 }} numberOfLines={1}>{c.name}</Text>
              {c.demo ? <DemoTag /> : null}
            </View>
            <Text variant="footnote" tertiary numberOfLines={2} style={{ fontSize: 12.5 }}>{c.headline}</Text>
          </View>
          {c.rating != null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><MaterialCommunityIcons name="star" size={14} color={tone.ochre} /><Text variant="subhead" style={{ fontFamily: fonts.medium }}>{dec1(c.rating)}</Text></View>
              <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{c.reviewCount} reseñas</Text>
            </View>
          ) : null}
        </View>
        {c.tags.length ? <View style={styles.tags}>{c.tags.slice(0, 3).map((t) => <Tag key={t} label={t} small />)}</View> : null}
        <View style={styles.bottom}>
          <Text variant="headline" style={{ fontFamily: fonts.medium }}>{c.priceFrom != null ? `desde ${eur(c.priceFrom)}` : '—'}<Text variant="footnote" tertiary> / mes</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: full ? colors.textTertiary : few ? tone.clay : tone.sage }} />
            <Text variant="footnote" color={full ? colors.textTertiary : few ? tone.clay : tone.sage} style={{ fontFamily: fonts.medium, fontSize: 12.5 }}>
              {full ? 'Completo' : few ? `Quedan ${c.spotsLeft} plaza${c.spotsLeft === 1 ? '' : 's'}` : 'Plazas libres'}
            </Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

/** Degradado en el tono de un entrenador o de un deporte (cabecera de perfil, foto de evento). */
export function ToneGradient({ color, style, children }: { color: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <LinearGradient colors={[lighten(color, 0.28), color, darken(color, 0.38)]} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export function DateBadge({ date }: { date: string }) {
  return (
    <View style={{ width: 50, height: 54, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <Text style={{ fontFamily: fonts.medium, fontSize: 21, lineHeight: 23, color: '#111' }}>{dayNum(date)}</Text>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.8, color: tone.clay }}>{monthShort(date)}</Text>
    </View>
  );
}

const WEEKDAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const weekday = (iso: string) => WEEKDAY[new Date(`${iso}T12:00:00`).getDay()];

export function EventCard({ e, onPress, showCoach = true }: { e: MarketEvent; onPress: () => void; showCoach?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = e.coachTone || sports[e.sport].color;
  return (
    <PressableScale scale={0.98} onPress={onPress} accessibilityLabel={`${e.title}. ${weekday(e.date)} ${dayNum(e.date)} a las ${e.start}. ${e.place}, ${e.city}. ${e.price ? eur(e.price) : 'Gratis'}.`}>
      <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
        <ToneGradient color={color} style={{ height: 108, padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <DateBadge date={e.date} />
            {e.demo ? <Pill label="Evento de ejemplo" /> : e.ticket ? <Pill label="Apuntado" icon="check" /> : e.spotsLeft <= 8 ? <Pill label={e.spotsLeft ? `Quedan ${e.spotsLeft} plazas` : 'Completo'} /> : null}
          </View>
        </ToneGradient>
        <View style={{ padding: 14, gap: 3 }}>
          <Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 16.5 }} numberOfLines={2}>{e.title}</Text>
          <Text variant="footnote" tertiary style={{ fontSize: 12.5 }} numberOfLines={1}>{weekday(e.date)} {e.start} · {e.place}, {e.city}</Text>
          <View style={[styles.row, { marginTop: 8, justifyContent: 'space-between' }]}>
            {showCoach ? (
              <View style={styles.row}><Initials initials={e.coachInitials} color={e.coachTone} size={24} /><Text variant="footnote" style={{ fontSize: 13 }}>{e.coachName}</Text></View>
            ) : <Text variant="footnote" tertiary>{e.signups} apuntados</Text>}
            <Text variant="headline" style={{ fontFamily: fonts.medium }}>{e.myPrice === 0 ? (e.price ? 'Gratis para ti' : 'Gratis') : eur(e.myPrice)}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
  function Pill({ label, icon }: { label: string; icon?: Icon }) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.92)' }}>
        {icon ? <MaterialCommunityIcons name={icon} size={13} color={tone.sage} /> : null}
        <Text variant="footnote" color={colors.text} style={{ fontSize: 11.5, fontFamily: fonts.medium }}>{label}</Text>
      </View>
    );
  }
}

export function ReviewCard({ r, coachFirstName, onHelpful }: { r: MarketReview; coachFirstName: string; onHelpful?: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const who = r.kind === 'event' ? 'Asistente a un evento' : `Atleta verificado${r.months ? ` · ${r.months} ${r.months === 1 ? 'mes' : 'meses'}` : ''}`;
  return (
    <View style={[styles.card, { gap: 8 }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={styles.row}>
          <Initials initials={r.initials} color={r.kind === 'event' ? tone.ochre : tone.slate} size={32} />
          <View><Text variant="subhead" style={{ fontFamily: fonts.medium }}>{r.author}</Text><Text variant="footnote" tertiary style={{ fontSize: 12 }}>{who}</Text></View>
        </View>
        <Stars value={r.rating} size={12} />
      </View>
      {r.body ? <Text variant="subhead" secondary style={{ lineHeight: 21 }}>{r.body}</Text> : null}
      {r.progress ? <Tag label={r.progress} icon="trending-up" small color={tone.sage} /> : null}
      {r.reply ? (
        <View style={{ backgroundColor: colors.surface2, borderRadius: 12, padding: 10 }}>
          <Text variant="footnote" secondary style={{ fontSize: 12.5 }}><Text variant="footnote" style={{ fontSize: 12.5, fontFamily: fonts.medium }}>Respuesta de {coachFirstName}</Text> · {r.reply}</Text>
        </View>
      ) : null}
      {onHelpful ? (
        <PressableScale scale={0.94} onPress={onHelpful} accessibilityLabel={`Marcar como útil. ${r.helpful} personas la marcaron`} style={{ alignSelf: 'flex-start' }}>
          <View style={styles.row}><MaterialCommunityIcons name="thumb-up-outline" size={14} color={colors.textTertiary} /><Text variant="footnote" tertiary style={{ fontSize: 12 }}>Útil · {r.helpful}</Text></View>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Cabecera flotante de las pantallas del mercado: botones de cristal y título centrado. */
export function MarketHeader({ title, right, onDark, back = true }: { title?: string; right?: ReactNode; onDark?: boolean; back?: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 6, gap: 10 }}>
      <View style={{ width: 92 }}>
        {back ? (
          <PressableScale scale={0.9} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityLabel="Volver">
            <Glass radius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} interactive><MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} /></Glass>
          </PressableScale>
        ) : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>{title ? <Text variant="headline" numberOfLines={1} color={onDark ? '#fff' : colors.text} style={{ fontSize: 16 }}>{title}</Text> : null}</View>
      <View style={{ width: 92, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>{right}</View>
    </View>
  );
}

export function GlassIcon({ icon, onPress, label, active }: { icon: Icon; onPress: () => void; label: string; active?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale scale={0.9} onPress={onPress} accessibilityLabel={label} accessibilityState={{ selected: active }}>
      <Glass radius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} interactive><MaterialCommunityIcons name={icon} size={20} color={active ? tone.brick : colors.text} /></Glass>
    </PressableScale>
  );
}

/** Barra fija abajo (precio + botón), de cristal. */
export function StickyBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: Math.max(insets.bottom, 12) + 4, alignItems: 'center' }}>
      <Glass radius={32} style={{ width: '100%', maxWidth: 720, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingRight: 10, paddingLeft: 18 }}>{children}</Glass>
    </View>
  );
}

export function InkButton({ title, onPress, icon, disabled, flex, ghost, loading }: { title: string; onPress: () => void; icon?: Icon; disabled?: boolean; flex?: boolean; ghost?: boolean; loading?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale scale={0.97} feedback onPress={() => { if (!disabled && !loading) onPress(); }} accessibilityState={{ disabled: !!disabled, busy: !!loading }} style={flex ? { flex: 1 } : undefined}>
      <View style={{ height: 50, paddingHorizontal: flex ? 14 : 22, borderRadius: 25, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ghost ? colors.surface2 : colors.ink, opacity: disabled ? 0.4 : loading ? 0.7 : 1 }}>
        {icon ? <MaterialCommunityIcons name={icon} size={19} color={ghost ? colors.text : '#fff'} /> : null}
        <Text variant="headline" color={ghost ? colors.text : '#fff'} style={{ fontSize: flex ? 15 : 16, flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit>{loading ? 'Un momento…' : title}</Text>
      </View>
    </PressableScale>
  );
}

export function ToggleRow({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 }}>
      <View style={{ flex: 1 }}>
        <Text variant="subhead" style={{ fontSize: 14.5 }}>{label}</Text>
        {note ? <Text variant="footnote" tertiary style={{ fontSize: 12 }}>{note}</Text> : null}
      </View>
      <Switch value={value} onValueChange={(v) => { haptic.select(); onChange(v); }} trackColor={{ true: tone.sage, false: colors.surface3 }} thumbColor="#fff"
        {...(Platform.OS === 'web' ? ({ activeThumbColor: '#fff' } as object) : {})} accessibilityLabel={label} />
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 }}>
      <Text variant="title3" style={{ fontSize: 18 }}>{title}</Text>
      {right}
    </View>
  );
}

/** Etiqueta de los perfiles de ejemplo del mercado. */
export function DemoTag() {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 7, height: 20, borderRadius: 10, backgroundColor: colors.surface2, justifyContent: 'center' }} accessibilityLabel="Perfil de ejemplo">
      <Text variant="footnote" tertiary style={{ fontSize: 10.5, fontFamily: fonts.semibold }}>Ejemplo</Text>
    </View>
  );
}

/** Aviso de los perfiles y eventos de ejemplo. */
export function DemoBanner({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: 18, padding: 12 }}>
      <MaterialCommunityIcons name="information-outline" size={18} color={colors.textSecondary} />
      <Text variant="footnote" secondary style={{ flex: 1, lineHeight: 18 }}>{text}</Text>
    </View>
  );
}

/** Aviso de demostración de los pagos (hasta que haya pasarela real). */
export function DemoNote({ text = 'Demostración: no se realiza ningún cargo.' }: { text?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' }}>
      <MaterialCommunityIcons name="flask-outline" size={13} color={accent.amber} />
      <Text variant="footnote" color={accent.amber} style={{ fontSize: 12 }}>{text}</Text>
    </View>
  );
}

export const useStyles = createStyles((c) => ({
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline, borderRadius: 24, borderCurve: 'continuous', padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.hairline },
}));

