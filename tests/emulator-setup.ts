import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Timestamp, doc, setDoc, type Firestore } from 'firebase/firestore';

/**
 * Deliberately not a real Firebase project — nothing on the internet answers
 * to this ID, so even if the emulator-connection wiring somehow failed, the
 * Firestore/Auth SDKs would have nowhere real to send a write. This constant
 * must match vitest.config.ts's VITE_FIREBASE_PROJECT_ID exactly.
 */
export const PROJECT_ID = 'choregarden-test';

const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080;

/**
 * Hard stop before any test touches Firestore. Two independent checks:
 * 1. The env vars this whole test run relies on are exactly the dummy test
 *    project, not production (belt) — see PROJECT_ID comment above.
 * 2. The Firestore emulator is actually reachable right now (suspenders) —
 *    fails fast with an actionable message instead of every test timing out
 *    one by one against a connection that was never going to come up.
 * Call this once, in beforeAll, before initializeTestEnv().
 */
export const assertEmulatorSafety = async () => {
  if (process.env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID) {
    throw new Error(
      `Refusing to run: VITE_FIREBASE_PROJECT_ID is "${process.env.VITE_FIREBASE_PROJECT_ID}", ` +
        `expected the dummy test project "${PROJECT_ID}". This guard exists so these tests can ` +
        `never point at real Firebase project data. Run via "npm run test:payout" — do not run ` +
        `vitest directly with a different env configuration.`
    );
  }
  if (process.env.VITE_USE_FIREBASE_EMULATOR !== 'true') {
    throw new Error('Refusing to run: VITE_USE_FIREBASE_EMULATOR must be "true" for these tests.');
  }

  const url = `http://${FIRESTORE_EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}/`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
  } catch {
    throw new Error(
      `Refusing to run: could not reach the Firestore emulator at ${url}. ` +
        `Run tests via "npm run test:payout", which starts it for you ` +
        `(firebase emulators:exec --only firestore,auth "vitest run ..."). ` +
        `Running "vitest" directly without the emulator running will not work.`
    );
  }
};

export const initializeTestEnv = () =>
  initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: FIRESTORE_EMULATOR_HOST,
      port: FIRESTORE_EMULATOR_PORT,
    },
  });

// --- Fixtures -----------------------------------------------------------
// Kept intentionally minimal: only the fields firestore.rules or
// payoutActions.ts actually reads. Parent auth uid IS the familyId in this
// app's schema (see isParentOfFamily), so there is no separate family doc.

export const PARENT_UID = 'qa-parent-uid';
export const CHILD_1 = 'qa-child-1';
export const CHILD_2 = 'qa-child-2';
export const DEFAULT_HOURLY_RATE_CENTS = 1000;

export const seedChild = async (
  testEnv: RulesTestEnvironment,
  childId: string,
  { familyId = PARENT_UID, hourlyRateCents = DEFAULT_HOURLY_RATE_CENTS } = {}
) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'children', childId), {
      familyId,
      name: `QA Child ${childId}`,
      hourlyRateCents,
      flowerProgressCents: 0,
      currentFlowerType: 'tulip',
      payoutRule: 'anytime',
      payoutThresholdCents: 0,
    });
    await setDoc(doc(db, 'childSessions', childId), { childId, familyId });
  });
};

interface SeedPayoutRequestOptions {
  id: string;
  childId: string;
  familyId?: string;
  status: 'requested' | 'paid' | 'declined';
  amountCents?: number;
  currencyCode?: string | null;
}

/** Writes a payoutRequests doc directly, bypassing Rules — used to set up
 * legacy/stale states (e.g. an already-paid doc) that no client is actually
 * allowed to create through normal writes. */
export const seedPayoutRequest = async (testEnv: RulesTestEnvironment, options: SeedPayoutRequestOptions) => {
  const { id, childId, familyId = PARENT_UID, status, amountCents = 500, currencyCode = null } = options;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'payoutRequests', id), {
      familyId,
      childId,
      amountCents,
      status,
      declineReason: null,
      currencyCode,
      requestedAt: Timestamp.now(),
      paidAt: status === 'paid' ? Timestamp.now() : null,
    });
  });
};

export const seedLock = async (
  testEnv: RulesTestEnvironment,
  { childId, payoutRequestId, familyId = PARENT_UID }: { childId: string; payoutRequestId: string; familyId?: string }
) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'payoutRequestLocks', childId), {
      familyId,
      payoutRequestId,
      requestedAt: Timestamp.now(),
    });
  });
};

export const asChildDb = (testEnv: RulesTestEnvironment, childId: string): Firestore =>
  testEnv.authenticatedContext(childId).firestore() as unknown as Firestore;

export const asParentDb = (testEnv: RulesTestEnvironment, parentUid: string = PARENT_UID): Firestore =>
  testEnv.authenticatedContext(parentUid).firestore() as unknown as Firestore;

/** For verification reads that should be independent of who's "allowed" to
 * read what — the point is checking what's actually in Firestore, not
 * re-testing read permissions here (that's TEST 10/11's job). */
export const withAdminDb = <T>(testEnv: RulesTestEnvironment, fn: (db: Firestore) => Promise<T>): Promise<T> => {
  let result: T;
  return testEnv
    .withSecurityRulesDisabled(async (context) => {
      result = await fn(context.firestore() as unknown as Firestore);
    })
    .then(() => result);
};
