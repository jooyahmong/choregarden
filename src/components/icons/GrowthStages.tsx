import seedImg from '../../assets/growth-stages/seed.svg';
import sproutImg from '../../assets/growth-stages/sprout.svg';
import stemImg from '../../assets/growth-stages/stem.svg';

export const SeedStage = ({ size = 56 }: { size?: number }) => (
  <img src={seedImg} alt="" style={{ height: size, width: 'auto', display: 'block' }} />
);

export const SproutStage = ({ size = 56 }: { size?: number }) => (
  <img src={sproutImg} alt="" style={{ height: size, width: 'auto', display: 'block' }} />
);

export const StemStage = ({ size = 56 }: { size?: number }) => (
  <img src={stemImg} alt="" style={{ height: size, width: 'auto', display: 'block' }} />
);
