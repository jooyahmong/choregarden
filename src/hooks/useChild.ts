import { useEffect, useState } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Child } from '../types/models';

export const useChild = (childId: string | null) => {
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) {
      setChild(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'children', childId), (snapshot) => {
      if (!snapshot.exists()) {
        setChild(null);
        setLoading(false);
        return;
      }
      const data = snapshot.data();
      setChild({
        id: snapshot.id,
        familyId: data.familyId,
        name: data.name,
        hourlyRateCents: data.hourlyRateCents,
        pin: data.pin,
        currentFlowerType: data.currentFlowerType,
        flowerProgressCents: data.flowerProgressCents,
        payoutRule: data.payoutRule,
        payoutThresholdCents: data.payoutThresholdCents ?? 0,
        active: data.active,
        createdAt: (data.createdAt as Timestamp).toDate(),
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [childId]);

  return { child, loading };
};
