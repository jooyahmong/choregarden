import { GrowingFlower } from '../icons/GrowingFlower';
import { FlowerIcon } from '../icons/FlowerIcon';
import groundImg from '../../assets/ground.svg';
import type { FlowerEvent, FlowerType } from '../../types/models';
import styles from './GardenPlot.module.css';

interface GardenPlotProps {
  currentFlowerType: FlowerType;
  progress: number;
  /** Newest first, as returned by useChildLedger. */
  completedFlowers: FlowerEvent[];
}

const MAX_PER_SIDE = 2;

export const GardenPlot = ({ currentFlowerType, progress, completedFlowers }: GardenPlotProps) => {
  // Show at most the 6 most recent completed flowers, oldest-to-newest
  // reading left to right, flanking the currently-growing flower in the
  // center — older growth naturally recedes into the Flower Book instead of
  // piling up here forever.
  const recentChronological = completedFlowers.slice(0, MAX_PER_SIDE * 2).reverse();
  const splitIndex = Math.ceil(recentChronological.length / 2);
  const left = recentChronological.slice(0, splitIndex);
  const right = recentChronological.slice(splitIndex);

  return (
    <div className={styles.bed}>
      <div className={styles.plantsRow}>
        {left.map((flower) => (
          <FlowerIcon key={flower.id} type={flower.flowerType} size={56} />
        ))}
        <GrowingFlower type={currentFlowerType} progress={progress} size={72} />
        {right.map((flower) => (
          <FlowerIcon key={flower.id} type={flower.flowerType} size={56} />
        ))}
      </div>
      <img src={groundImg} alt="" className={styles.ground} />
    </div>
  );
};
