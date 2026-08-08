import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { FlowerType, PayoutRule } from '../types/models';

export const setCurrentFlower = async (childId: string, flowerType: FlowerType) => {
  await updateDoc(doc(db, 'children', childId), { currentFlowerType: flowerType });
};

export const updateChildSettings = async (
  childId: string,
  updates: {
    name: string;
    hourlyRateCents: number;
    payoutRule: PayoutRule;
    payoutThresholdCents: number;
  }
) => {
  await updateDoc(doc(db, 'children', childId), updates);
};

export const resetChildPin = async (childId: string, newPin: string) => {
  await updateDoc(doc(db, 'children', childId), { pin: newPin });
};
