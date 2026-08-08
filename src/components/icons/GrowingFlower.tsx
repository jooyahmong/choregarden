import { SeedStage, SproutStage, StemStage } from './GrowthStages';
import { FlowerIcon } from './FlowerIcon';
import type { FlowerType } from '../../types/models';

interface GrowingFlowerProps {
  type: FlowerType;
  /** 0 (just started) to 1 (ready to bloom) */
  progress: number;
  size?: number;
}

/** Four stages: seed -> sprout -> stem -> the child's chosen flower in bloom. */
export const GrowingFlower = ({ type, progress, size = 96 }: GrowingFlowerProps) => {
  const clamped = Math.max(0, Math.min(1, progress));

  if (clamped < 0.25) return <SeedStage size={size} />;
  if (clamped < 0.5) return <SproutStage size={size} />;
  if (clamped < 0.75) return <StemStage size={size} />;

  const bloomScale = 0.6 + 0.4 * ((clamped - 0.75) / 0.25);
  return (
    <div style={{ transform: `scale(${bloomScale})`, transformOrigin: '50% 100%' }}>
      <FlowerIcon type={type} size={size} />
    </div>
  );
};
