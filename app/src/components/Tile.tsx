import { Children, Fragment, cloneElement, createContext, isValidElement, useContext, useState, type ReactElement, type ReactNode } from 'react';
import { PixelRatio, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FocusIn } from './FocusIn';
import { MeshGradient } from './MeshGradient';
import { InkProvider } from './micro';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { createStyles, heroMesh, tile as T, useTheme, warmMesh, type Mesh } from '@/theme';

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// --- Cuadrícula bento: 2 columnas en móvil, 3–4 en pantallas anchas. Cada tarjeta ocupa celdas (span × rows) y se rellenan los huecos,
// como en el dashboard de TV de la referencia. El sistema es el mismo en todas las superficies; solo cambia el número de columnas. ---
type Placement = { r: number; c: number; w: number; h: number };
function pack(items: { w: number; h: number }[], cols: number): Placement[] {
  const occ: boolean[][] = [];
  const free = (r: number, c: number, w: number, h: number) => {
    for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) if (occ[r + dr]?.[c + dc]) return false;
    return true;
  };
  const out = items.map(({ w, h }) => {
    const ww = Math.min(w, cols);
    for (let r = 0; ; r++) {
      for (let c = 0; c + ww <= cols; c++) {
        if (!free(r, c, ww, h)) continue;
        for (let dr = 0; dr < h; dr++) { occ[r + dr] ??= Array(cols).fill(false); for (let dc = 0; dc < ww; dc++) occ[r + dr][c + dc] = true; }
        return { r, c, w: ww, h };
      }
    }
  });
  // Sin huecos: si una fila acaba antes del borde, la última tarjeta de esa fila se ensancha hasta llenarla.
  for (let r = 0; r < occ.length; r++) {
    const row = occ[r];
    let end = row.length;
    while (end > 0 && !row[end - 1]) end--;
    if (end === 0 || end === row.length) continue;
    const last = out.find((p) => p.r === r && p.h === 1 && p.c + p.w === end);
    if (last) { for (let c = end; c < row.length; c++) row[c] = true; last.w += row.length - end; }
  }
  return out;
}

type Pos = { left: number; top: number; width: number; height: number };

/** Los hijos pueden venir agrupados en fragmentos (`<>…</>`): se aplanan para poder empaquetarlos uno a uno. */
function flatten(nodes: ReactNode): ReactElement<TileProps>[] {
  const out: ReactElement<TileProps>[] = [];
  Children.forEach(nodes, (n) => {
    if (!isValidElement(n)) return;
    if (n.type === Fragment) out.push(...flatten((n.props as { children?: ReactNode }).children));
    else out.push(n as ReactElement<TileProps>);
  });
  return out;
}
const GridCtx = createContext<boolean>(false);

export function TileGrid({ children }: { children: ReactNode }) {
  const [w, setW] = useState(0);
  // Columnas según el ancho real del contenedor (no el de la ventana): la barra lateral de iPad le quita sitio.
  const cols = w >= 1040 ? 4 : w >= 700 ? 3 : 2;
  const items = flatten(children);
  const placements = pack(items.map((c) => ({ w: c.props.span ?? 1, h: c.props.rows ?? 1 })), cols);
  const unit = w ? (w - T.gap * (cols - 1)) / cols : 0;
  // Con el texto grande del sistema la tarjeta crece un poco (hasta ×1,15) en vez de recortar su contenido.
  const rowH = T.rowH * Math.min(1.15, Math.max(1, PixelRatio.getFontScale()));
  const rowsUsed = placements.reduce((m, p) => Math.max(m, p.r + p.h), 0);
  const height = rowsUsed * rowH + Math.max(0, rowsUsed - 1) * T.gap;
  return (
    <GridCtx.Provider value>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height, opacity: w ? 1 : 0 }}>
        {items.map((c, i) => {
          const p = placements[i];
          const pos: Pos = { left: p.c * (unit + T.gap), top: p.r * (rowH + T.gap), width: p.w * unit + (p.w - 1) * T.gap, height: p.h * rowH + (p.h - 1) * T.gap };
          return cloneElement(c as ReactElement<{ index?: number; pos?: Pos }>, { index: i, pos, key: c.key ?? i });
        })}
      </View>
    </GridCtx.Provider>
  );
}

export type TileProps = {
  title: string;
  value?: string | null;
  unit?: string;
  icon: Icon;
  /** plain: blanca (claro) / casi negra (oscuro). glass: malla azul-cobre. warm: cristal marrón. O una malla propia. */
  variant?: 'plain' | 'glass' | 'warm' | Mesh;
  /** Columnas que ocupa: 1 (media anchura) o 2 (héroe). */
  span?: 1 | 2;
  /** Micro-visualización abajo a la derecha. */
  micro?: ReactNode;
  /** Contenido propio entre la cabecera y la cifra (p. ej. el medidor de recuperación). */
  body?: ReactNode;
  /** Línea de apoyo bajo la cifra. */
  note?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  index?: number;
  /** Filas que ocupa: 1 (por defecto) o 2 (héroe alto). */
  rows?: 1 | 2;
  /** Posición calculada por TileGrid (interno). */
  pos?: Pos;
  /** Altura mínima cuando la tarjeta se usa fuera de una TileGrid. */
  minHeight?: number;
  /** false: el pie solo lleva la nota y la micro-visualización (la cifra ya está en `body`). */
  showValue?: boolean;
  /** Color del icono (p. ej. el del estado). Por defecto, el del texto. */
  iconColor?: string;
};

/** Círculo con trazo de 1 px y un icono de línea fina dentro. */
export function IconCircle({ icon, color, size = 44 }: { icon: Icon; color: string; size?: number }) {
  return (
    <View accessibilityElementsHidden style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color, opacity: 0.55, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={icon} size={size * 0.46} color={color} />
    </View>
  );
}

/** Botón circular ↗: blanco sobre cristal, tinta sobre tarjeta clara, contorno sobre tarjeta oscura. */
export function ArrowButton({ onGlass, size = 34 }: { onGlass: boolean; size?: number }) {
  const { colors, scheme } = useTheme();
  void onGlass; void scheme;
  const filled = '#1A1A1A';
  return (
    <View accessibilityElementsHidden style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ?? 'transparent', borderWidth: filled ? 0 : 1, borderColor: colors.hairline }}>
      <MaterialCommunityIcons name="arrow-top-right" size={size * 0.5} color="#FFFFFF" />
    </View>
  );
}

export function Tile({ title, value, unit, icon, variant = 'plain', span = 1, micro, body, note, onPress, accessibilityLabel, index = 0, pos, minHeight, showValue = true, iconColor, rows }: TileProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const inGrid = useContext(GridCtx) && !!pos;
  const mesh: Mesh | null = variant === 'glass' ? heroMesh : variant === 'warm' ? warmMesh : variant === 'plain' ? null : variant;
  const onGlass = !!mesh;
  const fg = colors.text;
  const fg2 = colors.textSecondary;
  const ink = { ink: colors.ink, dim: onGlass ? 'rgba(17,17,17,0.3)' : colors.inkDim };

  const small = span === 1;
  // El título va junto al icono salvo en el héroe alto (2 filas), donde va debajo para dejar sitio al medidor.
  const inline = small || (rows ?? 1) === 1;
  const valueEl = showValue ? (
    <View style={styles.valueRow}>
      <Text variant={span === 2 ? 'numeral' : 'numeralSm'} color={fg} numberOfLines={1} maxFontSizeMultiplier={1.1} style={small ? { fontSize: 32, lineHeight: 36 } : undefined}>{value ?? '—'}</Text>
      {unit ? <Text variant="callout" color={fg2} style={styles.unit} numberOfLines={1} maxFontSizeMultiplier={1.1}>{unit}</Text> : null}
    </View>
  ) : null;
  const noteEl = note ? <View style={{ marginTop: 2 }}>{typeof note === 'string' ? <Text variant="footnote" color={fg2} numberOfLines={2} maxFontSizeMultiplier={1.1}>{note}</Text> : note}</View> : null;

  const content = (
    <View style={[styles.tile, inGrid ? { height: '100%' } : { minHeight: minHeight ?? T.rowH }, !mesh && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.tileBorder }]}>
      {mesh ? <MeshGradient mesh={mesh} /> : null}
      <View style={styles.head}>
        <IconCircle icon={icon} color={iconColor ?? fg} size={small ? 40 : 44} />
        {inline ? <Text variant="tileLabel" color={fg} numberOfLines={2} maxFontSizeMultiplier={1.12} style={styles.titleInline}>{title}</Text> : <View style={{ flex: 1 }} />}
        {!small && onPress ? <ArrowButton onGlass={onGlass} /> : null}
      </View>
      {!inline ? <Text variant="tileLabel" color={fg} style={{ marginTop: 14, fontSize: 17 }}>{title}</Text> : null}
      {body}
      <View style={{ flex: 1, minHeight: 10 }} />
      <InkProvider value={ink}>
        {small ? (
          <View style={{ gap: 10 }}>
            <View>{valueEl}{noteEl}</View>
            <View style={styles.smallBottom}>
              <View style={{ flex: 1 }}>{micro}</View>
              {onPress ? <ArrowButton onGlass={onGlass} size={30} /> : null}
            </View>
          </View>
        ) : (
          <View style={styles.foot}>
            <View style={{ flexShrink: 1 }}>{valueEl}{noteEl}</View>
            {micro ? <View style={styles.micro}>{micro}</View> : null}
          </View>
        )}
      </InkProvider>
    </View>
  );

  return (
    <FocusIn index={index} style={inGrid && pos ? { position: 'absolute', left: pos.left, top: pos.top, width: pos.width, height: pos.height } : undefined}>
      {onPress ? (
        <PressableScale onPress={onPress} scale={0.97} accessibilityLabel={accessibilityLabel ?? `${title}${value ? `: ${value}${unit ? ' ' + unit : ''}` : ''}`}>{content}</PressableScale>
      ) : (
        <View accessible accessibilityLabel={accessibilityLabel ?? `${title}${value ? `: ${value}${unit ? ' ' + unit : ''}` : ''}`}>{content}</View>
      )}
    </FocusIn>
  );
}

const useStyles = createStyles(() => ({
  tile: { borderRadius: 32, borderCurve: 'continuous', overflow: 'hidden', padding: 16, justifyContent: 'flex-start' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleInline: { flex: 1, paddingTop: 1 },
  smallBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 30 },
  foot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 14 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  unit: { opacity: 0.9 },
  micro: { paddingBottom: 6 },
}));

/** Acción en una sola fila: icono en círculo, título, apoyo y botón ↗. Para «Nuevo entreno», el check-in o el código de invitación. */
export function ActionTile({ icon, title, note, onPress, variant = 'plain', iconColor, accessibilityLabel, index = 0 }: {
  icon: Icon; title: string; note?: string; onPress: () => void; variant?: 'plain' | 'warm' | 'glass'; iconColor?: string; accessibilityLabel?: string; index?: number;
}) {
  const { colors } = useTheme();
  const mesh: Mesh | null = variant === 'warm' ? warmMesh : variant === 'glass' ? heroMesh : null;
  const fg = colors.text;
  const fg2 = colors.textSecondary;
  return (
    <FocusIn index={index}>
      <PressableScale onPress={onPress} scale={0.98} accessibilityLabel={accessibilityLabel ?? title}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: 88, borderRadius: 32, borderCurve: 'continuous', overflow: 'hidden' },
          !mesh && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.tileBorder }]}>
          {mesh ? <MeshGradient mesh={mesh} /> : null}
          <IconCircle icon={icon} color={iconColor ?? fg} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="tileLabel" color={fg} style={{ fontSize: 16 }} maxFontSizeMultiplier={1.15}>{title}</Text>
            {note ? <Text variant="footnote" color={fg2} numberOfLines={2} maxFontSizeMultiplier={1.15}>{note}</Text> : null}
          </View>
          <ArrowButton onGlass={!!mesh} />
        </View>
      </PressableScale>
    </FocusIn>
  );
}
