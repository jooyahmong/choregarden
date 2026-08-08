import {
  Timestamp,
  addDoc,
  collection,
  doc,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  applyEarningToFlowerProgress,
  calculateAmountCents,
  flowerThresholdCents,
} from './money';

interface SubmitChoreInput {
  familyId: string;
  childId: string;
  choreTemplateId: string | null;
  label: string;
  icon: string;
  minutes: number;
  hourlyRateCents: number;
  note?: string;
}

export const submitChoreRequest = async ({
  familyId,
  childId,
  choreTemplateId,
  label,
  icon,
  minutes,
  hourlyRateCents,
  note,
}: SubmitChoreInput) => {
  const amountCents = calculateAmountCents(hourlyRateCents, minutes);
  await addDoc(collection(db, 'choreRequests'), {
    familyId,
    childId,
    choreTemplateId,
    label,
    icon,
    minutes,
    note: note ?? null,
    hourlyRateCentsSnapshot: hourlyRateCents,
    amountCents,
    status: 'pending',
    declineReason: null,
    submittedAt: Timestamp.now(),
    reviewedAt: null,
  });
};

/**
 * The paid amount always uses the rate snapshot captured at submission (the
 * rate in effect when the work was done), even if minutes are adjusted here
 * or the child's hourly rate has since changed. Garden growth, by contrast,
 * uses the child's CURRENT hourly rate — the flower is a live reflection of
 * today's allowance rate, not a record of what was earned.
 */
export const approveChoreRequest = async (
  choreRequestId: string,
  currencyCode: string,
  adjustedMinutes?: number
) => {
  await runTransaction(db, async (tx) => {
    const choreRef = doc(db, 'choreRequests', choreRequestId);
    const choreSnap = await tx.get(choreRef);
    if (!choreSnap.exists() || choreSnap.data().status !== 'pending') {
      throw new Error('chore_not_pending');
    }
    const chore = choreSnap.data();
    const finalMinutes = adjustedMinutes ?? chore.minutes;
    const finalAmountCents = calculateAmountCents(chore.hourlyRateCentsSnapshot, finalMinutes);

    const childRef = doc(db, 'children', chore.childId);
    const childSnap = await tx.get(childRef);
    if (!childSnap.exists()) throw new Error('child_not_found');
    const child = childSnap.data();

    const { newProgressCents, bloomsCompleted } = applyEarningToFlowerProgress(
      child.flowerProgressCents,
      finalAmountCents,
      child.hourlyRateCents
    );

    tx.update(choreRef, {
      status: 'approved',
      minutes: finalMinutes,
      amountCents: finalAmountCents,
      currencyCode,
      reviewedAt: Timestamp.now(),
    });
    tx.update(childRef, { flowerProgressCents: newProgressCents });

    for (let i = 0; i < bloomsCompleted; i += 1) {
      const flowerRef = doc(collection(db, 'flowerEvents'));
      tx.set(flowerRef, {
        familyId: chore.familyId,
        childId: chore.childId,
        flowerType: child.currentFlowerType,
        amountCents: flowerThresholdCents(child.hourlyRateCents),
        bloomedAt: Timestamp.now(),
      });
    }
  });
};

export const declineChoreRequest = async (choreRequestId: string, reason: string) => {
  await updateDoc(doc(db, 'choreRequests', choreRequestId), {
    status: 'declined',
    declineReason: reason,
    reviewedAt: Timestamp.now(),
  });
};
