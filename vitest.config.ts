import { defineConfig } from 'vitest/config';

// Firestore transactions round-trip through the emulator for real, so the
// default 5s test timeout is too tight once a few concurrency tests share
// one emulator process. These env values are the ONLY Firebase config the
// test run ever sees — see tests/emulator-setup.ts for the hard guard that
// refuses to run if anything points anywhere but the local emulator.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    env: {
      VITE_USE_FIREBASE_EMULATOR: 'true',
      VITE_FIREBASE_PROJECT_ID: 'choregarden-test',
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
      VITE_FIREBASE_STORAGE_BUCKET: 'choregarden-test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '0',
      VITE_FIREBASE_APP_ID: '1:0:web:test',
    },
  },
});
