import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sumAmountCents } from '../lib/money';
import { toChoreRequest, toPayoutRequest } from '../lib/converters';
import type { ChoreRequest, PayoutRequest } from '../types/models';

export interface FamilyLedger {
  choreRequests: ChoreRequest[];
  payoutRequests: PayoutRequest[];
  loading: boolean;
  unpaidBalanceCentsByChild: Record<string, number>;
  paidCentsByChild: Record<string, number>;
}

export const useFamilyLedger = (familyId: string | null): FamilyLedger => {
  const [choreRequests, setChoreRequests] = useState<ChoreRequest[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loadingFlags, setLoadingFlags] = useState({ chores: true, payouts: true });

  useEffect(() => {
    if (!familyId) {
      setChoreRequests([]);
      setPayoutRequests([]);
      setLoadingFlags({ chores: false, payouts: false });
      return;
    }

    setLoadingFlags({ chores: true, payouts: true });

    const unsubChores = onSnapshot(
      query(collection(db, 'choreRequests'), where('familyId', '==', familyId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toChoreRequest(d.id, d.data()))
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        setChoreRequests(list);
        setLoadingFlags((prev) => ({ ...prev, chores: false }));
      }
    );

    const unsubPayouts = onSnapshot(
      query(collection(db, 'payoutRequests'), where('familyId', '==', familyId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toPayoutRequest(d.id, d.data()))
          .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
        setPayoutRequests(list);
        setLoadingFlags((prev) => ({ ...prev, payouts: false }));
      }
    );

    return () => {
      unsubChores();
      unsubPayouts();
    };
  }, [familyId]);

  const unpaidBalanceCentsByChild: Record<string, number> = {};
  const paidCentsByChild: Record<string, number> = {};

  for (const chore of choreRequests) {
    if (chore.status === 'approved') {
      unpaidBalanceCentsByChild[chore.childId] =
        (unpaidBalanceCentsByChild[chore.childId] ?? 0) + chore.amountCents;
    }
  }
  for (const payout of payoutRequests) {
    if (payout.status === 'paid') {
      unpaidBalanceCentsByChild[payout.childId] =
        (unpaidBalanceCentsByChild[payout.childId] ?? 0) - payout.amountCents;
      paidCentsByChild[payout.childId] = (paidCentsByChild[payout.childId] ?? 0) + payout.amountCents;
    }
  }

  return {
    choreRequests,
    payoutRequests,
    loading: loadingFlags.chores || loadingFlags.payouts,
    unpaidBalanceCentsByChild,
    paidCentsByChild,
  };
};

export const sumFamilyUnpaid = (byChild: Record<string, number>) =>
  sumAmountCents(Object.values(byChild));
