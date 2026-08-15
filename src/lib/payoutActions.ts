import { Timestamp, addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const requestPayout = async (familyId: string, childId: string, amountCents: number) => {
  const request = await addDoc(collection(db, 'payoutRequests'), {
    familyId,
    childId,
    amountCents,
    status: 'requested',
    declineReason: null,
    requestedAt: Timestamp.now(),
    paidAt: null,
  });
  return request.id;
};

export const markPayoutPaid = async (payoutRequestId: string, currencyCode: string) => {
  await updateDoc(doc(db, 'payoutRequests', payoutRequestId), {
    status: 'paid',
    currencyCode,
    paidAt: Timestamp.now(),
  });
};

export const declinePayoutRequest = async (payoutRequestId: string, reason: string) => {
  await updateDoc(doc(db, 'payoutRequests', payoutRequestId), {
    status: 'declined',
    declineReason: reason,
  });
};
