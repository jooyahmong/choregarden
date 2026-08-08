import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { Family } from '../types/models';

interface FamilyContextValue {
  family: Family | null;
  loading: boolean;
}

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const familyId = user?.familyId ?? null;

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setFamily(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'families', familyId), (snapshot) => {
      if (!snapshot.exists()) {
        setFamily(null);
        setLoading(false);
        return;
      }

      const data = snapshot.data();
      setFamily({
        id: snapshot.id,
        name: data.name,
        familyCode: data.familyCode,
        currencyCode: data.currencyCode,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        notifyChoreRequests: data.notifyChoreRequests ?? true,
        notifyPayoutRequests: data.notifyPayoutRequests ?? true,
        createdAt: (data.createdAt as Timestamp).toDate(),
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [familyId]);

  return (
    <FamilyContext.Provider value={{ family, loading }}>{children}</FamilyContext.Provider>
  );
};

export const useFamily = (): FamilyContextValue => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within FamilyProvider');
  }
  return context;
};
