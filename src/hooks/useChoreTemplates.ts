import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ChoreTemplate } from '../types/models';

export const useChoreTemplates = (familyId: string | null, activeOnly = true) => {
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, 'choreTemplates'), where('familyId', '==', familyId)),
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as ChoreTemplate)
          .filter((template) => !activeOnly || template.active)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setTemplates(list);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [familyId, activeOnly]);

  return { templates, loading };
};
