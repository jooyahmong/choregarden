import { getMessaging, isSupported, onRegistered, register, unregister } from 'firebase/messaging';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, app, db } from './firebase';

const deviceKey = 'cg-push-device-id';

export type PushState = 'enabled' | 'default' | 'denied' | 'unsupported' | 'ios-install' | 'not-configured';

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const deviceId = async (installationId: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(installationId));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export const getPushState = async (parentUid: string): Promise<PushState> => {
  if (!(await isSupported()) || !('serviceWorker' in navigator)) return 'unsupported';
  if (isIos() && !isStandalone()) return 'ios-install';
  if (Notification.permission === 'denied') return 'denied';
  if (!vapidKey) return 'not-configured';
  const savedId = localStorage.getItem(deviceKey);
  if (!savedId || Notification.permission !== 'granted') return 'default';
  const saved = await getDoc(doc(db, 'pushDevices', parentUid, 'devices', savedId));
  return saved.exists() && saved.data().enabled === true ? 'enabled' : 'default';
};

export const enablePushNotifications = async (parentUid: string) => {
  const state = await getPushState(parentUid);
  if (state === 'unsupported' || state === 'ios-install' || state === 'denied' || state === 'not-configured') return state;
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'default';
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(app);
  const installationId = await new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('fcm_registration_timeout')), 15_000);
    const unsubscribe = onRegistered(messaging, (fid) => { window.clearTimeout(timeout); unsubscribe(); resolve(fid); });
    void register(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch((error) => { window.clearTimeout(timeout); unsubscribe(); reject(error); });
  });
  const id = await deviceId(installationId);
  await setDoc(doc(db, 'pushDevices', parentUid, 'devices', id), {
    installationId, enabled: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, { merge: true });
  localStorage.setItem(deviceKey, id);
  return 'enabled' as const;
};

export const disablePushNotifications = async (parentUid: string) => {
  const id = localStorage.getItem(deviceKey);
  if (id) await deleteDoc(doc(db, 'pushDevices', parentUid, 'devices', id));
  if (await isSupported()) await unregister(getMessaging(app)).catch(() => undefined);
  localStorage.removeItem(deviceKey);
};

export const requestChorePush = async (choreRequestId: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;
  await fetch('/api/push/chore-request', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ choreRequestId }),
  });
};
