import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CurrencyCode } from '../utils/currencies';

export const updateFamilyCurrency = async (familyId: string, currencyCode: CurrencyCode) => {
  await updateDoc(doc(db, 'families', familyId), { currencyCode });
};

export const updateFamilyName = async (familyId: string, name: string) => {
  await updateDoc(doc(db, 'families', familyId), { name });
};

export const updateFamilyFiscalYearStartMonth = async (familyId: string, month: number) => {
  await updateDoc(doc(db, 'families', familyId), { fiscalYearStartMonth: month });
};

export const updateFamilyNotificationPref = async (
  familyId: string,
  key: 'notifyChoreRequests' | 'notifyPayoutRequests',
  enabled: boolean
) => {
  await updateDoc(doc(db, 'families', familyId), { [key]: enabled });
};
