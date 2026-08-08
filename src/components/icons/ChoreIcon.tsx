import type { ReactElement } from 'react';
import dishesImg from '../../assets/chore-icons/dishes.svg';
import petImg from '../../assets/chore-icons/pet.svg';
import trashImg from '../../assets/chore-icons/trash.svg';
import cleanImg from '../../assets/chore-icons/clean.svg';
import laundryImg from '../../assets/chore-icons/laundry.svg';

export type ChoreIconKey = 'bed' | 'dishes' | 'toybox' | 'trash' | 'pet' | 'other' | 'laundry';

const STROKE = 'var(--color-charcoal)';

const BedIcon = () => (
  <>
    <rect x="6" y="20" width="12" height="8" rx="2" fill="var(--color-leaf)" stroke={STROKE} strokeWidth="1.6" />
    <rect x="9" y="14" width="16" height="8" rx="2" fill="#fff" stroke={STROKE} strokeWidth="1.6" />
    <path d="M6 32 V20 M28 32 V18" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 24 H28" stroke={STROKE} strokeWidth="1.6" />
  </>
);

const OtherIcon = () => (
  <>
    <circle cx="10" cy="18" r="2" fill={STROKE} />
    <circle cx="17" cy="18" r="2" fill={STROKE} />
    <circle cx="24" cy="18" r="2" fill={STROKE} />
  </>
);

const IMAGE_ICONS: Partial<Record<ChoreIconKey, string>> = {
  dishes: dishesImg,
  pet: petImg,
  trash: trashImg,
  toybox: cleanImg,
  laundry: laundryImg,
};

const VECTOR_ICONS: Record<'bed' | 'other', () => ReactElement> = {
  bed: BedIcon,
  other: OtherIcon,
};

export const ChoreIcon = ({ icon, size = 34 }: { icon: string; size?: number }) => {
  const key = icon as ChoreIconKey;
  const image = IMAGE_ICONS[key];
  if (image) {
    return <img src={image} alt="" style={{ height: size, width: size, display: 'block' }} />;
  }
  const Vector = VECTOR_ICONS[key as 'bed' | 'other'] ?? OtherIcon;
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" role="presentation" aria-hidden="true">
      <Vector />
    </svg>
  );
};
