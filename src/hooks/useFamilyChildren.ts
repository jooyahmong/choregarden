import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Child } from '../types/models';

const toChild = (id: string, data: Record<string, unknown>): Child => ({
  id,
  familyId: data.familyId as string,
  name: data.name as string,
  hourlyRateCents: data.hourlyRateCents as number,
  pin: data.pin as string,
  currentFlowerType: data.currentFlowerType as Child['currentFlowerType'],
  flowerProgressCents: data.flowerProgressCents as number,
  payoutRule: data.payoutRule as Child['payoutRule'],
  payoutThresholdCents: (data.payoutThresholdCents as number) ?? 0,
  active: data.active as boolean,
  createdAt: (data.createdAt as Timestamp).toDate(),
});

export const useFamilyChildren = (familyId: string | null) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setChildren([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, 'children'), where('familyId', '==', familyId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toChild(d.id, d.data()))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        setChildren(list);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [familyId]);

  return { children, loading };
};
