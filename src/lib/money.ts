/**
 * All money math happens in integer cents to avoid floating point drift.
 */
export const calculateAmountCents = (hourlyRateCents: number, minutes: number): number =>
  Math.round((hourlyRateCents / 60) * minutes);

/**
 * One full flower costs one hour of the child's hourly rate. hourlyRateCents
 * is already "dollars-per-hour in cents" (e.g. 1200 = $12/hr), so the
 * threshold for one flower IS that number — do not multiply by 60 here,
 * that would treat it as a per-minute rate instead.
 */
export const flowerThresholdCents = (hourlyRateCents: number): number => hourlyRateCents;

export interface FlowerProgressResult {
  newProgressCents: number;
  bloomsCompleted: number;
}

/**
 * Adds an approved earning to a child's in-progress flower and reports how
 * many flowers completed (usually 0 or 1; a large manual adjustment could
 * complete more than one at once). Remainder carries over to the next flower.
 */
export const applyEarningToFlowerProgress = (
  currentProgressCents: number,
  earnedCents: number,
  hourlyRateCents: number
): FlowerProgressResult => {
  const threshold = flowerThresholdCents(hourlyRateCents);
  let progress = currentProgressCents + earnedCents;
  let bloomsCompleted = 0;

  if (threshold <= 0) {
    return { newProgressCents: progress, bloomsCompleted };
  }

  while (progress >= threshold) {
    progress -= threshold;
    bloomsCompleted += 1;
  }

  return { newProgressCents: progress, bloomsCompleted };
};

export const sumAmountCents = (amounts: number[]): number =>
  amounts.reduce((total, amount) => total + amount, 0);
