import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const messagingServiceWorker = (env: Record<string, string>): Plugin => ({
  name: 'firebase-messaging-service-worker',
  generateBundle() {
    const config = {
      apiKey: env.VITE_FIREBASE_API_KEY ?? '',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: env.VITE_FIREBASE_APP_ID ?? '',
    };
    this.emitFile({
      type: 'asset',
      fileName: 'firebase-messaging-sw.js',
      source: `importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(data.title || 'ChoreGarden', {
    body: data.body || '', icon: '/icon-192.png', badge: '/icon-192.png',
    data: { url: data.url || '/parent/chores' }, tag: data.requestId || undefined,
  });
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/parent/chores', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    return existing ? existing.focus().then(() => existing.navigate(url)) : clients.openWindow(url);
  }));
});`,
    });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), messagingServiceWorker(loadEnv(mode, process.cwd(), ''))],
}))
