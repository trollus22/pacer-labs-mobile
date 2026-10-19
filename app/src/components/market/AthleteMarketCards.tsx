import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../Text';
import { PressableScale } from '../PressableScale';
import { IconCircle, ArrowButton } from '../Tile';
import { Initials, StarInput, ToneGradient, useStyles } from './ui';
import { fonts, tone, useTheme } from '@/theme';
import { useQuery } from '@/lib/query';
import { firstName } from '@/lib/format';
import type { MarketMe } from '@/lib/market';

/**
 * Tarjetas del mercado en «Hoy» del atleta: valorar el evento de ayer (y, si el organizador no es su entrenador, ver sus planes)
 * y, si no tiene entrenador, la entrada a «Entrenadores».
 */
export function AthleteMarketCards() {
  const { data: me } = useQuery<MarketMe>('/market/me');
  const [hideInvite, setHideInvite] = useState(false);
  const { colors } = useTheme();
  const s = useStyles();
  if (!me) return null;
  const r = me.toRate;
  return (
    <View style={{ gap: 12 }}>
      {r ? (
        <View style={[s.card, { padding: 18, gap: 10, borderRadius: 28 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" tertiary style={{ fontSize: 10.5 }}>Después del evento</Text>
            <Text variant="footnote" tertiary style={{ fontSize: 12 }}>con {r.coachName}</Text>
          </View>
          <Text variant="headline" style={{ fontFamily: fonts.medium, fontSize: 18 }}>¿Qué tal «{r.title}»?</Text>
          <StarInput value={0} size={32} label="Valorar el evento" onChange={(v) => router.push({ pathname: '/market/review/[coachId]', params: { coachId: r.coachId, eventId: r.eventId, rating: String(v) } })} />
          <Text variant="footnote" tertiary style={{ fontSize: 12 }}>Tu opinión sale en el perfil de {firstName(r.coachName)} como «asistente a un evento».</Text>
          {r.workout && r.workout.status === 'done' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline }}>
              <MaterialCommunityIcons name="check-circle" size={18} color={tone.sage} />
              <Text variant="footnote" secondary style={{ flex: 1 }}>Sesión registrada{r.workout.distanceKm ? ` · ${String(r.workout.distanceKm).replace('.', ',')} km` : ''}{r.workout.rpe ? ` · esfuerzo ${r.workout.rpe}/10` : ''}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {r && !r.isCoachAthlete && !hideInvite ? (
        <View style={{ borderRadius: 28, overflow: 'hidden' }}>
          <ToneGradient color="#7B8794" style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Initials initials={r.coachInitials} color="#111" size={40} ring />
              <Text variant="subhead" color="rgba(255,255,255,0.92)">Entrena con {firstName(r.coachName)}</Text>
            </View>
            <Text variant="title3" color="#fff" style={{ fontSize: 19, lineHeight: 25 }}>¿Te gustó la sesión? {firstName(r.coachName)} tiene plazas libres y la primera semana es gratis.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PressableScale scale={0.95} onPress={() => router.push(`/market/plans/${r.coachId}`)} accessibilityLabel={`Ver los planes de ${r.coachName}`}>
                <View style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center' }}><Text variant="footnote" style={{ fontFamily: fonts.semibold }}>Ver sus planes</Text></View>
              </PressableScale>
              <PressableScale scale={0.95} onPress={() => setHideInvite(true)} accessibilityLabel="Ahora no">
                <View style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', justifyContent: 'center' }}><Text variant="footnote" color="#fff">Ahora no</Text></View>
              </PressableScale>
            </View>
          </ToneGradient>
        </View>
      ) : null}
      {!me.hasCoach ? (
        <PressableScale scale={0.98} onPress={() => router.push('/market')} accessibilityLabel="Entrenadores: entrena con alguien que mira tus datos">
          <View style={{ borderRadius: 32, overflow: 'hidden' }}>
            <ToneGradient color="#6E7A86" style={{ padding: 18, minHeight: 210, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><IconCircle icon="whistle-outline" color="#FFFFFF" /><ArrowButton onGlass /></View>
              <View style={{ gap: 6, marginTop: 18 }}>
                <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ fontSize: 10.5 }}>Entrenadores</Text>
                <Text variant="title2" color="#fff" style={{ fontFamily: fonts.regular, fontSize: 25, lineHeight: 30 }}>Entrena con alguien{'\n'}que mira tus datos</Text>
                <Text variant="footnote" color="rgba(255,255,255,0.85)">{me.coachCount} entrenadores · {me.upcomingEvents} eventos cerca</Text>
              </View>
            </ToneGradient>
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}
