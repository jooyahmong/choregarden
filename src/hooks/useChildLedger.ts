import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sumAmountCents } from '../lib/money';
import { toChoreRequest, toFlowerEvent, toPayoutRequest } from '../lib/converters';
import type { ChoreRequest, FlowerEvent, PayoutRequest } from '../types/models';

export interface ChildLedger {
  choreRequests: ChoreRequest[];
  payoutRequests: PayoutRequest[];
  flowerEvents: FlowerEvent[];
  unpaidBalanceCents: number;
  lifetimeEarnedCents: number;
  loading: boolean;
}

export const useChildLedger = (childId: string | null): ChildLedger => {
  const [choreRequests, setChoreRequests] = useState<ChoreRequest[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [flowerEvents, setFlowerEvents] = useState<FlowerEvent[]>([]);
  const [loadingFlags, setLoadingFlags] = useState({ chores: true, payouts: true, flowers: true });

  useEffect(() => {
    if (!childId) {
      setChoreRequests([]);
      setPayoutRequests([]);
      setFlowerEvents([]);
      setLoadingFlags({ chores: false, payouts: false, flowers: false });
      return;
    }

    setLoadingFlags({ chores: true, payouts: true, flowers: true });

    const unsubChores = onSnapshot(
      query(collection(db, 'choreRequests'), where('childId', '==', childId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toChoreRequest(d.id, d.data()))
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        setChoreRequests(list);
        setLoadingFlags((prev) => ({ ...prev, chores: false }));
      }
    );

    const unsubPayouts = onSnapshot(
      query(collection(db, 'payoutRequests'), where('childId', '==', childId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toPayoutRequest(d.id, d.data()))
          .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
        setPayoutRequests(list);
        setLoadingFlags((prev) => ({ ...prev, payouts: false }));
      }
    );

    const unsubFlowers = onSnapshot(
      query(collection(db, 'flowerEvents'), where('childId', '==', childId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toFlowerEvent(d.id, d.data()))
          .sort((a, b) => b.bloomedAt.getTime() - a.bloomedAt.getTime());
        setFlowerEvents(list);
        setLoadingFlags((prev) => ({ ...prev, flowers: false }));
      }
    );

    return () => {
      unsubChores();
      unsubPayouts();
      unsubFlowers();
    };
  }, [childId]);

  const approvedCents = sumAmountCents(
    choreRequests.filter((c) => c.status === 'approved').map((c) => c.amountCents)
  );
  const paidCents = sumAmountCents(
    payoutRequests.filter((p) => p.status === 'paid').map((p) => p.amountCents)
  );

  return {
    choreRequests,
    payoutRequests,
    flowerEvents,
    unpaidBalanceCents: approvedCents - paidCents,
    lifetimeEarnedCents: approvedCents,
    loading: loadingFlags.chores || loadingFlags.payouts || loadingFlags.flowers,
  };
};
