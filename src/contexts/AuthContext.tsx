import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { generateFamilyCode } from '../lib/familyCode';
import { DEFAULT_CURRENCY } from '../utils/currencies';
import i18n from '../i18n/config';

export interface ParentIdentity {
  type: 'parent';
  uid: string;
  email: string;
  familyId: string;
}

export interface ChildIdentity {
  type: 'child';
  childId: string;
  familyId: string;
  name: string;
}

export type AuthUser = ParentIdentity | ChildIdentity | null;

interface AuthContextValue {
  user: AuthUser;
  loading: boolean;
  signUpParent: (
    email: string,
    password: string,
    familyName: string,
    remember: boolean
  ) => Promise<void>;
  signInParent: (email: string, password: string, remember: boolean) => Promise<void>;
  signInChild: (familyCode: string, pin: string, remember: boolean) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutCurrent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const applyPersistence = (remember: boolean) =>
  setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

const DEFAULT_CHORE_TEMPLATES: { key: string; icon: string }[] = [
  { key: 'make_bed', icon: 'bed' },
  { key: 'dishes', icon: 'dishes' },
  { key: 'tidy_room', icon: 'toybox' },
  { key: 'take_out_rubbish', icon: 'trash' },
  { key: 'feed_pet', icon: 'pet' },
];

const seedDefaultChoreTemplates = async (familyId: string) => {
  const batch = writeBatch(db);
  DEFAULT_CHORE_TEMPLATES.forEach((template, index) => {
    const ref = doc(collection(db, 'choreTemplates'));
    batch.set(ref, {
      familyId,
      label: i18n.t(`default_chores.${template.key}`),
      icon: template.icon,
      active: true,
      sortOrder: index,
    });
  });
  await batch.commit();
};

const findFamilyIdByCode = async (familyCode: string): Promise<string> => {
  const snapshot = await getDocs(
    query(collection(db, 'families'), where('familyCode', '==', familyCode), limit(1))
  );
  if (snapshot.empty) {
    throw new Error('family_not_found');
  }
  return snapshot.docs[0].id;
};

const resolveChildIdentity = async (uid: string): Promise<ChildIdentity | null> => {
  const sessionSnap = await getDoc(doc(db, 'childSessions', uid));
  if (!sessionSnap.exists()) return null;

  const { childId, familyId } = sessionSnap.data() as { childId: string; familyId: string };
  const childSnap = await getDoc(doc(db, 'children', childId));
  if (!childSnap.exists()) return null;

  return {
    type: 'child',
    childId,
    familyId,
    name: (childSnap.data().name as string) ?? '',
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (fbUser.isAnonymous) {
        const childIdentity = await resolveChildIdentity(fbUser.uid);
        setUser(childIdentity);
      } else {
        setUser({
          type: 'parent',
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          familyId: fbUser.uid,
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpParent = async (
    email: string,
    password: string,
    familyName: string,
    remember: boolean
  ) => {
    await applyPersistence(remember);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const familyId = credential.user.uid;

    let familyCode = generateFamilyCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await getDocs(
        query(collection(db, 'families'), where('familyCode', '==', familyCode), limit(1))
      );
      if (existing.empty) break;
      familyCode = generateFamilyCode();
    }

    await setDoc(doc(db, 'families', familyId), {
      name: familyName,
      familyCode,
      currencyCode: DEFAULT_CURRENCY,
      fiscalYearStartMonth: 7,
      notifyChoreRequests: true,
      notifyPayoutRequests: true,
      createdAt: Timestamp.now(),
    });

    await seedDefaultChoreTemplates(familyId);
  };

  const signInParent = async (email: string, password: string, remember: boolean) => {
    await applyPersistence(remember);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInChild = async (familyCode: string, pin: string, remember: boolean) => {
    const familyId = await findFamilyIdByCode(familyCode.trim().toUpperCase());

    await applyPersistence(remember);
    const credential = await signInAnonymously(auth);

    const childrenSnap = await getDocs(
      query(collection(db, 'children'), where('familyId', '==', familyId))
    );

    const match = childrenSnap.docs.find((childDoc) => childDoc.data().pin === pin);

    if (!match) {
      throw new Error('invalid_pin');
    }

    await setDoc(doc(db, 'childSessions', credential.user.uid), {
      childId: match.id,
      familyId,
    });

    setUser({
      type: 'child',
      childId: match.id,
      familyId,
      name: (match.data().name as string) ?? '',
    });
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOutCurrent = async () => {
    const uid = auth.currentUser?.uid;
    const wasAnonymous = auth.currentUser?.isAnonymous;
    // Delete the session doc BEFORE signing out — the security rule requires
    // request.auth.uid == uid, which is only true while still authenticated.
    if (wasAnonymous && uid) {
      await deleteDoc(doc(db, 'childSessions', uid)).catch(() => undefined);
    }
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUpParent,
        signInParent,
        signInChild,
        sendPasswordReset,
        signOutCurrent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
