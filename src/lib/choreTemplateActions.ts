import { addDoc, collection, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { ChoreTemplate } from '../types/models';

export const createChoreTemplate = async (
  familyId: string,
  label: string,
  icon: string,
  sortOrder: number
) => {
  await addDoc(collection(db, 'choreTemplates'), {
    familyId,
    label,
    icon,
    active: true,
    sortOrder,
  });
};

export const updateChoreTemplate = async (
  templateId: string,
  updates: Partial<Pick<ChoreTemplate, 'label' | 'icon' | 'active'>>
) => {
  await updateDoc(doc(db, 'choreTemplates', templateId), updates);
};

export const deleteChoreTemplate = async (templateId: string) => {
  await deleteDoc(doc(db, 'choreTemplates', templateId));
};

export const reorderChoreTemplates = async (orderedIds: string[]) => {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'choreTemplates', id), { sortOrder: index });
  });
  await batch.commit();
};
