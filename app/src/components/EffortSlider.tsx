import { StepSlider } from './StepSlider';
import { RPE_COLORS, RPE_STOPS } from '@/theme';

/** Esfuerzo percibido 1–10: de verde a rosa. */
export function EffortSlider({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return <StepSlider value={value} onChange={onChange} min={1} max={10} step={1} stops={RPE_STOPS} colors={RPE_COLORS} label="Esfuerzo percibido" />;
}
