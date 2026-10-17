import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Loading, Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { accent, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { invalidateAll, useQuery } from '@/lib/query';
import type { WearableProvider, WearablesInfo } from '@/lib/types';
import { brand, providerNote } from '@/lib/wearables';

type Imported = { days: number; activities: number; notes?: string[] } | null;
type Connected = { status: 'connected'; imported: Imported; warning?: string };
type Reply = { status: 'mfa'; mfaId: string } | Connected;

export default function Connect() {
  const { provider } = useLocalSearchParams<{ provider: string }>();
  const { data } = useQuery<WearablesInfo>('/wearables');
  const p = data?.providers.find((x) => x.id === provider);
  return (
    <Screen keyboard contentStyle={{ paddingTop: 28, gap: 22 }}>
      {p ? <ConnectForm p={p} /> : <Loading />}
    </Screen>
  );
}

function ConnectForm({ p }: { p: WearableProvider }) {
  const { colors } = useTheme();
  const b = brand[p.id];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaId, setMfaId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Connected | null>(null);
  const [syncMsg, setSyncMsg] = useState('');
  const [relogin, setRelogin] = useState(false);

  const fail = (e: unknown) => { haptic.error(); setError((e as Error).message); setBusy(false); };
  const ok = (r: Connected) => { haptic.success(); setPassword(''); setCode(''); invalidateAll(); setResult(r); setBusy(false); };
  const handle = (r: Reply) => { if (r.status === 'mfa') { setMfaId(r.mfaId); setBusy(false); } else ok(r); };

  const connect = async () => {
    setBusy(true); setError('');
    try { handle(await api<Reply>(`/wearables/${p.id}/connect`, { method: 'POST', body: { email: email.trim(), password } })); } catch (e) { fail(e); }
  };
  const verify = async () => {
    setBusy(true); setError('');
    try { handle(await api<Reply>(`/wearables/${p.id}/mfa`, { method: 'POST', body: { mfaId, code } })); } catch (e) { fail(e); }
  };
  const sync = async () => {
    setBusy(true); setError(''); setSyncMsg('');
    try {
      const r = await api<{ skipped?: boolean; imported: Imported }>(`/wearables/${p.id}/sync`, { method: 'POST', body: {} });
      invalidateAll(); setSyncMsg(r.skipped ? 'Ya está al día.' : `Sincronizado: ${r.imported?.days ?? 0} días y ${r.imported?.activities ?? 0} entrenos.`); setBusy(false);
    } catch (e) { fail(e); }
  };
  const disconnect = async () => {
    if (!(await confirm(`¿Desconectar ${p.name}?`, 'Borraremos el acceso y los datos importados de este reloj. Tus check-ins y entrenos no se tocan.', 'Desconectar'))) return;
    setBusy(true);
    try { await api(`/wearables/${p.id}`, { method: 'DELETE' }); haptic.medium(); invalidateAll(); router.back(); } catch (e) { fail(e); }
  };

  const head = (
    <View style={{ gap: 6 }}>
      <MaterialCommunityIcons name={b.icon} size={32} color={b.color} />
      <Text variant="title1">{p.name}</Text>
    </View>
  );

  // Conectado ahora mismo.
  if (result) {
    return (
      <>
        {head}
        <View style={{ gap: 8 }}>
          <Text variant="headline" color={accent.green}>Conectado</Text>
          {result.imported
            ? <Text variant="body" secondary>Hemos importado {result.imported.days} días de datos y {result.imported.activities} entrenos. Tu recuperación ya los tiene en cuenta.</Text>
            : <Text variant="body" secondary>La cuenta está conectada, pero la primera lectura no ha funcionado{result.warning ? `: ${result.warning}` : '.'} Puedes reintentarla desde esta pantalla.</Text>}
        </View>
        <Button title="Listo" onPress={() => router.back()} />
      </>
    );
  }

  // Ya estaba conectado: gestión.
  if (p.state !== 'available' && !relogin && !mfaId) {
    return (
      <>
        {head}
        <Text variant="body" color={p.state === 'reconnect' ? accent.amber : colors.textSecondary}>{providerNote(p)}</Text>
        {p.lastError ? <Text variant="footnote" tertiary>{p.lastError}</Text> : null}
        {syncMsg ? <Text variant="subhead" color={accent.green}>{syncMsg}</Text> : null}
        {p.state === 'connected'
          ? <Button title="Sincronizar ahora" onPress={sync} loading={busy} />
          : <Button title="Volver a iniciar sesión" onPress={() => setRelogin(true)} />}
        <Button title="Desconectar" kind="danger" onPress={disconnect} loading={busy} />
      </>
    );
  }

  return (
    <>
      {head}
      {mfaId ? (
        <>
          <Text variant="body" secondary>{p.name} te ha enviado un código de verificación. Escríbelo aquí.</Text>
          <Field label="Código de verificación" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} autoComplete="one-time-code" textContentType="oneTimeCode" autoFocus />
          {error ? <Text variant="subhead" color={accent.pink}>{error}</Text> : null}
          <Button title="Verificar" onPress={verify} loading={busy} disabled={code.trim().length < 4} tint={b.color} kind="accent" />
        </>
      ) : (
        <>
          <Text variant="body" secondary>Inicia sesión con la cuenta de {p.name} que usas con tu reloj.</Text>
          <Field label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" />
          <View style={{ gap: 6 }}>
            <Text variant="footnote" secondary>{p.disclosure}</Text>
            <Text variant="footnote" tertiary>{p.note}</Text>
          </View>
          {error ? <Text variant="subhead" color={accent.pink}>{error}</Text> : null}
          <Button title="Conectar" onPress={connect} loading={busy} disabled={!email.trim() || !password} tint={b.color} kind="accent" />
        </>
      )}
    </>
  );
}
