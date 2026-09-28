import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, where, type Firestore } from 'firebase/firestore';
import {
  DuplicatePayoutRequestError,
  PayoutAlreadyProcessedError,
  deletePaidPayoutRequest,
  declinePayoutRequest,
  markPayoutPaid,
  requestPayout,
} from '../src/lib/payoutActions';
import {
  CHILD_1,
  CHILD_2,
  PARENT_UID,
  assertEmulatorSafety,
  asChildDb,
  asParentDb,
  initializeTestEnv,
  seedChild,
  seedLock,
  seedPayoutRequest,
  withAdminDb,
} from './emulator-setup';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  await assertEmulatorSafety();
  testEnv = await initializeTestEnv();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedChild(testEnv, CHILD_1);
  await seedChild(testEnv, CHILD_2);
});

const requestedDocsFor = (childId: string) =>
  withAdminDb(testEnv, async (db) => {
    const snap = await getDocs(
      query(collection(db, 'payoutRequests'), where('childId', '==', childId), where('status', '==', 'requested'))
    );
    return snap.docs;
  });

const getLock = (childId: string) =>
  withAdminDb(testEnv, async (db) => {
    const snap = await getDoc(doc(db, 'payoutRequestLocks', childId));
    return snap.exists() ? snap.data() : null;
  });

const getPayout = (id: string) =>
  withAdminDb(testEnv, async (db) => {
    const snap = await getDoc(doc(db, 'payoutRequests', id));
    if (!snap.exists()) throw new Error(`payoutRequests/${id} does not exist`);
    return snap.data();
  });

const payoutExists = (id: string) =>
  withAdminDb(testEnv, async (db) => (await getDoc(doc(db, 'payoutRequests', id))).exists());

const paidTotalFor = (childId: string) =>
  withAdminDb(testEnv, async (db) => {
    const snap = await getDocs(
      query(collection(db, 'payoutRequests'), where('childId', '==', childId), where('status', '==', 'paid'))
    );
    return snap.docs.reduce((total, payout) => total + (payout.data().amountCents as number), 0);
  });

describe('requestPayout — duplicate creation guards', () => {
  it('TEST 1: single request creates exactly one requested doc + a lock pointing at it', async () => {
    const db = asChildDb(testEnv, CHILD_1);
    const id = await requestPayout(PARENT_UID, CHILD_1, 500, db);

    const requested = await requestedDocsFor(CHILD_1);
    expect(requested).toHaveLength(1);
    expect(requested[0].id).toBe(id);

    const lock = await getLock(CHILD_1);
    expect(lock).not.toBeNull();
    expect(lock?.payoutRequestId).toBe(id);
  });

  it('TEST 2: two near-simultaneous requests for the same child — only one succeeds', async () => {
    const db = asChildDb(testEnv, CHILD_1);
    const results = await Promise.allSettled([
      requestPayout(PARENT_UID, CHILD_1, 500, db),
      requestPayout(PARENT_UID, CHILD_1, 500, db),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(DuplicatePayoutRequestError);

    expect(await requestedDocsFor(CHILD_1)).toHaveLength(1);
    expect(await getLock(CHILD_1)).not.toBeNull();
  });

  it('TEST 3: two independent client contexts racing for the same child — only one succeeds', async () => {
    // Two separate RulesTestContexts stand in for two browser tabs/devices —
    // each is its own client instance, unlike TEST 2's shared instance.
    const dbA = asChildDb(testEnv, CHILD_1);
    const dbB = asChildDb(testEnv, CHILD_1);
    const results = await Promise.allSettled([
      requestPayout(PARENT_UID, CHILD_1, 500, dbA),
      requestPayout(PARENT_UID, CHILD_1, 500, dbB),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(DuplicatePayoutRequestError);

    expect(await requestedDocsFor(CHILD_1)).toHaveLength(1);
  });

  it('TEST 4: a legacy requested doc with no lock still blocks a new request', async () => {
    await seedPayoutRequest(testEnv, { id: 'legacy-1', childId: CHILD_1, status: 'requested' });
    expect(await getLock(CHILD_1)).toBeNull(); // legacy: no lock was ever written for it

    const db = asChildDb(testEnv, CHILD_1);
    await expect(requestPayout(PARENT_UID, CHILD_1, 500, db)).rejects.toBeInstanceOf(DuplicatePayoutRequestError);

    const requested = await requestedDocsFor(CHILD_1);
    expect(requested).toHaveLength(1);
    expect(requested[0].id).toBe('legacy-1');
  });

  it('TEST 5: a stale lock pointing at an already-paid request self-heals', async () => {
    await seedPayoutRequest(testEnv, { id: 'old-paid-1', childId: CHILD_1, status: 'paid' });
    await seedLock(testEnv, { childId: CHILD_1, payoutRequestId: 'old-paid-1' });

    const db = asChildDb(testEnv, CHILD_1);
    const newId = await requestPayout(PARENT_UID, CHILD_1, 750, db);
    expect(newId).not.toBe('old-paid-1');

    const requested = await requestedDocsFor(CHILD_1);
    expect(requested).toHaveLength(1);
    expect(requested[0].id).toBe(newId);

    const lock = await getLock(CHILD_1);
    expect(lock?.payoutRequestId).toBe(newId);
  });
});

describe('markPayoutPaid / declinePayoutRequest — duplicate processing guards', () => {
  it('TEST 6: two concurrent approvals of the same request — only one transitions requested -> paid', async () => {
    const id = 'req-6';
    await seedPayoutRequest(testEnv, { id, childId: CHILD_1, status: 'requested', amountCents: 900 });
    const db = asParentDb(testEnv);

    const results = await Promise.allSettled([
      markPayoutPaid(id, CHILD_1, 'USD', db),
      markPayoutPaid(id, CHILD_1, 'USD', db),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(PayoutAlreadyProcessedError);

    const payout = await getPayout(id);
    expect(payout.status).toBe('paid');
    expect(payout.paidAt).not.toBeNull();
  });

  it('TEST 7: approve vs decline race on the same request — exactly one wins, status never flips back', async () => {
    const id = 'req-7';
    await seedPayoutRequest(testEnv, { id, childId: CHILD_1, status: 'requested' });
    const db = asParentDb(testEnv);

    const results = await Promise.allSettled([
      markPayoutPaid(id, CHILD_1, 'USD', db),
      declinePayoutRequest(id, CHILD_1, 'changed my mind', db),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);

    const payout = await getPayout(id);
    expect(['paid', 'declined']).toContain(payout.status);
  });

  it('TEST 8: re-approving an already-paid request is blocked and nothing changes', async () => {
    const id = 'req-8';
    await seedPayoutRequest(testEnv, { id, childId: CHILD_1, status: 'paid', currencyCode: 'AUD' });
    const before = await getPayout(id);
    const db = asParentDb(testEnv);

    await expect(markPayoutPaid(id, CHILD_1, 'USD', db)).rejects.toBeInstanceOf(PayoutAlreadyProcessedError);

    const after = await getPayout(id);
    expect(after.status).toBe('paid');
    expect(after.currencyCode).toBe(before.currencyCode); // still 'AUD', not overwritten to 'USD'
    expect((after.paidAt as Timestamp).toMillis()).toBe((before.paidAt as Timestamp).toMillis());
  });

  it('TEST 9: approving an already-declined request is blocked', async () => {
    const id = 'req-9';
    await seedPayoutRequest(testEnv, { id, childId: CHILD_1, status: 'declined' });
    const db = asParentDb(testEnv);

    await expect(markPayoutPaid(id, CHILD_1, 'USD', db)).rejects.toBeInstanceOf(PayoutAlreadyProcessedError);

    expect((await getPayout(id)).status).toBe('declined');
  });
});

describe('firestore.rules — payoutRequestLocks boundaries', () => {
  it('TEST 10: a child cannot touch another child\'s lock; a parent cannot touch another family\'s', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      await setDoc(doc(db, 'children', 'other-family-child'), { familyId: 'other-parent-uid' });
    });
    await seedLock(testEnv, { childId: 'other-family-child', payoutRequestId: 'irrelevant', familyId: 'other-parent-uid' });

    const childA = asChildDb(testEnv, CHILD_1);
    await assertFails(getDoc(doc(childA, 'payoutRequestLocks', CHILD_2)));
    await assertFails(
      setDoc(doc(childA, 'payoutRequestLocks', CHILD_2), { familyId: PARENT_UID, payoutRequestId: 'x', requestedAt: new Date() })
    );
    await assertFails(setDoc(doc(childA, 'payoutRequestLocks', 'other-family-child'), { payoutRequestId: 'y' }, { merge: true }));
    await assertFails(deleteDoc(doc(childA, 'payoutRequestLocks', 'other-family-child')));

    const parentA = asParentDb(testEnv); // parent of qa-family, not other-parent-uid's family
    await assertFails(deleteDoc(doc(parentA, 'payoutRequestLocks', 'other-family-child')));
  });

  it('TEST 11: a child can create/update but not delete their own lock; a parent can read/delete but not create/update it', async () => {
    const childDb = asChildDb(testEnv, CHILD_1);
    await assertSucceeds(
      setDoc(doc(childDb, 'payoutRequestLocks', CHILD_1), { familyId: PARENT_UID, payoutRequestId: 'r1', requestedAt: new Date() })
    );
    await assertSucceeds(setDoc(doc(childDb, 'payoutRequestLocks', CHILD_1), { payoutRequestId: 'r2' }, { merge: true }));
    await assertFails(deleteDoc(doc(childDb, 'payoutRequestLocks', CHILD_1)));

    const parentDb = asParentDb(testEnv);
    await assertSucceeds(getDoc(doc(parentDb, 'payoutRequestLocks', CHILD_1)));
    await assertFails(setDoc(doc(parentDb, 'payoutRequestLocks', CHILD_1), { payoutRequestId: 'hijack' }, { merge: true }));
    await assertSucceeds(deleteDoc(doc(parentDb, 'payoutRequestLocks', CHILD_1)));
  });
});

describe('deletePaidPayoutRequest — paid-history correction', () => {
  it('TEST 12: a parent can delete one duplicate paid payout, restoring that amount to the unpaid calculation', async () => {
    await seedPayoutRequest(testEnv, { id: 'paid-keep', childId: CHILD_1, status: 'paid', amountCents: 500 });
    await seedPayoutRequest(testEnv, { id: 'paid-delete', childId: CHILD_1, status: 'paid', amountCents: 500 });
    expect(await paidTotalFor(CHILD_1)).toBe(1000);

    await deletePaidPayoutRequest('paid-delete', asParentDb(testEnv));

    expect(await payoutExists('paid-delete')).toBe(false);
    expect(await payoutExists('paid-keep')).toBe(true);
    expect(await paidTotalFor(CHILD_1)).toBe(500);
  });

  it('TEST 13: requested/declined payouts and child-side deletion remain blocked', async () => {
    await seedPayoutRequest(testEnv, { id: 'requested-keep', childId: CHILD_1, status: 'requested' });
    await seedPayoutRequest(testEnv, { id: 'declined-keep', childId: CHILD_1, status: 'declined' });
    await seedPayoutRequest(testEnv, { id: 'paid-child-blocked', childId: CHILD_1, status: 'paid' });

    const parentDb = asParentDb(testEnv);
    await assertFails(deleteDoc(doc(parentDb, 'payoutRequests', 'requested-keep')));
    await assertFails(deleteDoc(doc(parentDb, 'payoutRequests', 'declined-keep')));
    await assertFails(deleteDoc(doc(asChildDb(testEnv, CHILD_1), 'payoutRequests', 'paid-child-blocked')));

    expect(await payoutExists('requested-keep')).toBe(true);
    expect(await payoutExists('declined-keep')).toBe(true);
    expect(await payoutExists('paid-child-blocked')).toBe(true);
  });
});
