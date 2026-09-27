import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export class DuplicatePayoutRequestError extends Error {
  constructor() {
    super('duplicate_payout_request');
    this.name = 'DuplicatePayoutRequestError';
  }
}

export class PayoutAlreadyProcessedError extends Error {
  constructor() {
    super('payout_already_processed');
    this.name = 'PayoutAlreadyProcessedError';
  }
}

/**
 * One non-terminal payout request per child, enforced two ways:
 *
 * 1. A plain query for an existing 'requested' doc for this child — catches
 *    requests created before this lock mechanism existed (no lock doc yet)
 *    and the common case of a child re-opening the request screen.
 * 2. A transaction keyed by a deterministic `payoutRequestLocks/{childId}`
 *    document — this is what actually closes the race between two
 *    concurrent submits (double-tap, two tabs/devices), since Firestore's
 *    client SDK transactions can only `get()` document references, not run
 *    queries, so the lock doc is the only way to get an atomic check here.
 */
export const requestPayout = async (familyId: string, childId: string, amountCents: number) => {
  const existingRequested = await getDocs(
    query(
      collection(db, 'payoutRequests'),
      where('childId', '==', childId),
      where('status', '==', 'requested'),
      limit(1)
    )
  );
  if (!existingRequested.empty) throw new DuplicatePayoutRequestError();

  const lockRef = doc(db, 'payoutRequestLocks', childId);
  const newRequestRef = doc(collection(db, 'payoutRequests'));

  await runTransaction(db, async (tx) => {
    const lockSnap = await tx.get(lockRef);
    if (lockSnap.exists()) {
      const lockedRequestRef = doc(db, 'payoutRequests', lockSnap.data().payoutRequestId as string);
      const lockedRequestSnap = await tx.get(lockedRequestRef);
      if (lockedRequestSnap.exists() && lockedRequestSnap.data().status === 'requested') {
        throw new DuplicatePayoutRequestError();
      }
      // Lock points at an already paid/declined (or since-deleted) request —
      // stale, safe to take over below.
    }

    tx.set(newRequestRef, {
      familyId,
      childId,
      amountCents,
      status: 'requested',
      declineReason: null,
      requestedAt: Timestamp.now(),
      paidAt: null,
    });
    tx.set(lockRef, {
      familyId,
      payoutRequestId: newRequestRef.id,
      requestedAt: Timestamp.now(),
    });
  });

  return newRequestRef.id;
};

const releasePayoutLock = (childId: string) =>
  deleteDoc(doc(db, 'payoutRequestLocks', childId)).catch(() => undefined);

/**
 * Re-reads the request inside the transaction and only transitions it from
 * 'requested' — never re-applies to an already paid/declined doc. This is
 * what actually stops two tabs/devices from both processing the same
 * request: whichever transaction commits first wins, the other's read is
 * invalidated by that write, and its retry sees the new status and throws
 * instead of writing again. The lock is only released after this succeeds,
 * so a failed transaction never leaves the child able to submit a fresh
 * request against a payout that didn't actually get processed.
 */
export const markPayoutPaid = async (payoutRequestId: string, childId: string, currencyCode: string) => {
  const requestRef = doc(db, 'payoutRequests', payoutRequestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists() || snap.data().status !== 'requested') {
      throw new PayoutAlreadyProcessedError();
    }
    tx.update(requestRef, {
      status: 'paid',
      currencyCode,
      paidAt: Timestamp.now(),
    });
  });
  await releasePayoutLock(childId);
};

export const declinePayoutRequest = async (payoutRequestId: string, childId: string, reason: string) => {
  const requestRef = doc(db, 'payoutRequests', payoutRequestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists() || snap.data().status !== 'requested') {
      throw new PayoutAlreadyProcessedError();
    }
    tx.update(requestRef, {
      status: 'declined',
      declineReason: reason,
    });
  });
  await releasePayoutLock(childId);
};
