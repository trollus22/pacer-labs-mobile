import { View } from 'react-native';
import type { Mesh } from '@/theme';
import { darken } from '@/lib/color';

/** Superficie plana con un filo de 1 px algo más oscuro que su base (antes un degradado de malla). Rellena su contenedor. */
export function MeshGradient({ mesh }: { mesh: Mesh }) {
  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: mesh.base, borderWidth: 1, borderColor: darken(mesh.base, 0.22), borderRadius: 32 }} />;
}
