import './styles/tokens.css'
import './styles/fonts.css'

const container = document.getElementById('root')!

// Guard against importing anything that touches src/lib/firebase.ts (via
// AuthContext -> bootstrap -> App) when .env.local isn't filled in yet:
// Firebase's getAuth() throws synchronously on an empty apiKey, which — if it
// happened at the top of this module's import chain — would abort the whole
// script before React ever mounts, leaving a silent blank page.
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  container.innerHTML = `
    <div style="max-width:480px;margin:80px auto;padding:24px;font-family:sans-serif;line-height:1.5">
      <h1 style="font-size:1.3rem">Firebase is not configured yet</h1>
      <p>Fill in <code>.env.local</code> with your Firebase project's <code>VITE_FIREBASE_*</code> values, then restart the dev server.</p>
      <h2 style="font-size:1.1rem">Firebase 설정이 비어 있어요</h2>
      <p><code>.env.local</code>에 Firebase 프로젝트 값을 채운 뒤 dev 서버를 다시 시작하세요.</p>
    </div>
  `
} else {
  import('./bootstrap').then(({ mountApp }) => mountApp(container))
}
