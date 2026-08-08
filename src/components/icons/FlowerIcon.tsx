import tulipImg from '../../assets/flowers/tulip.svg';
import sunflowerImg from '../../assets/flowers/sunflower.svg';
import daisyImg from '../../assets/flowers/daisy.svg';
import lavenderImg from '../../assets/flowers/lavender.svg';
import type { FlowerType } from '../../types/models';

const FLOWER_IMAGES: Record<FlowerType, string> = {
  tulip: tulipImg,
  sunflower: sunflowerImg,
  daisy: daisyImg,
  lavender: lavenderImg,
};

interface FlowerIconProps {
  type: FlowerType;
  /** Side length in px of the square the flower is scaled to fit inside — the
   * source images have different aspect ratios, so a plain fixed height would
   * render each flower at a different width. Fitting them into a shared
   * square box keeps every flower's footprint the same size. */
  size?: number;
  className?: string;
}

export const FlowerIcon = ({ type, size = 64, className }: FlowerIconProps) => (
  <div
    className={className}
    style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <img
      src={FLOWER_IMAGES[type]}
      alt={type}
      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }}
    />
  </div>
);
