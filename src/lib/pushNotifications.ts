import { getMessaging, isSupported, onRegistered, register, unregister } from 'firebase/messaging';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, app, db } from './firebase';

const deviceKey = 'cg-push-device-id';
export type PushKind = 'chore' | 'payout';
export type PushState = 'enabled' | 'default' | 'denied' | 'unsupported' | 'ios-install' | 'not-configured' | 'error';
type DeviceData = { enabled?: boolean; choreRequests?: boolean; payoutRequests?: boolean };

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const preferenceKey = (kind: PushKind) => kind === 'chore' ? 'choreRequests' : 'payoutRequests';
const deviceId = async (installationId: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(installationId));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

const registerInstallation = async () => {
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(app);
  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('fcm_registration_timeout')), 15_000);
    const unsubscribe = onRegistered(messaging, (fid) => {
      window.clearTimeout(timeout);
      unsubscribe();
      resolve(fid);
    });
    void register(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch((error) => {
      window.clearTimeout(timeout);
      unsubscribe();
      reject(error);
    });
  });
};

const baseState = async (): Promise<Exclude<PushState, 'enabled' | 'error'>> => {
  if (!(await isSupported()) || !('serviceWorker' in navigator)) return 'unsupported';
  if (isIos() && !isStandalone()) return 'ios-install';
  if (Notification.permission === 'denied') return 'denied';
  if (!vapidKey) return 'not-configured';
  return 'default';
};

export const getPushState = async (parentUid: string, kind: PushKind): Promise<PushState> => {
  const state = await baseState();
  if (state !== 'default') return state;
  const savedId = localStorage.getItem(deviceKey);
  if (!savedId || Notification.permission !== 'granted') return 'default';
  const saved = await getDoc(doc(db, 'pushDevices', parentUid, 'devices', savedId));
  if (!saved.exists()) return 'default';
  const data = saved.data() as DeviceData;
  return data[preferenceKey(kind)] === true || (kind === 'chore' && data.choreRequests === undefined && data.enabled === true) ? 'enabled' : 'default';
};

export const enablePushNotifications = async (parentUid: string, kind: PushKind): Promise<PushState> => {
  const initial = await baseState();
  if (initial !== 'default') return initial;
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'default';
  try {
    const installationId = await registerInstallation();
    const id = await deviceId(installationId);
    await setDoc(doc(db, 'pushDevices', parentUid, 'devices', id), { installationId, enabled: true, [preferenceKey(kind)]: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    localStorage.setItem(deviceKey, id);
    return 'enabled';
  } catch { return 'error'; }
};

export const disablePushNotifications = async (parentUid: string, kind: PushKind) => {
  const id = localStorage.getItem(deviceKey);
  if (!id) return;
  const reference = doc(db, 'pushDevices', parentUid, 'devices', id);
  const current = await getDoc(reference);
  const data = current.data() as DeviceData | undefined;
  const otherKind: PushKind = kind === 'chore' ? 'payout' : 'chore';
  const otherEnabled = data?.[preferenceKey(otherKind)] === true || (otherKind === 'chore' && data?.choreRequests === undefined && data?.enabled === true);
  if (otherEnabled) await setDoc(reference, { [preferenceKey(kind)]: false, updatedAt: serverTimestamp() }, { merge: true });
  else { await deleteDoc(reference); if (await isSupported()) await unregister(getMessaging(app)).catch(() => undefined); localStorage.removeItem(deviceKey); }
};

export const syncPushRegistration = async (parentUid: string) => {
  const state = await baseState();
  const previousId = localStorage.getItem(deviceKey);
  if (state !== 'default' || Notification.permission !== 'granted' || !previousId) return;

  const previousRef = doc(db, 'pushDevices', parentUid, 'devices', previousId);
  const previous = await getDoc(previousRef);
  if (!previous.exists()) return;

  const data = previous.data() as DeviceData;
  const choreRequests = data.choreRequests === true || (data.choreRequests === undefined && data.enabled === true);
  const payoutRequests = data.payoutRequests === true;
  if (!choreRequests && !payoutRequests) return;

  const installationId = await registerInstallation();
  const currentId = await deviceId(installationId);
  const currentRef = doc(db, 'pushDevices', parentUid, 'devices', currentId);
  await setDoc(currentRef, {
    installationId,
    enabled: true,
    choreRequests,
    payoutRequests,
    updatedAt: serverTimestamp(),
    ...(currentId === previousId ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });

  if (currentId !== previousId) {
    await deleteDoc(previousRef);
    localStorage.setItem(deviceKey, currentId);
  }
};

const requestPush = async (path: string, requestId: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;
  const response = await fetch(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId }),
    keepalive: true,
  });
  if (!response.ok) throw new Error(`push_request_failed:${response.status}`);
};
export const requestChorePush = (choreRequestId: string) => requestPush('/api/push/chore-request', choreRequestId);
export const requestPayoutPush = (payoutRequestId: string) => requestPush('/api/push/payout-request', payoutRequestId);
