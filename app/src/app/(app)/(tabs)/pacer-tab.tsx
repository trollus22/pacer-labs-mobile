import { Redirect } from 'expo-router';

// Hueco de la pestaña Pacer en la barra nativa: nunca se selecciona (abre /pacer encima). Si se llega aquí por un enlace, se va al chat.
export default function PacerTab() {
  return <Redirect href="/pacer" />;
}
