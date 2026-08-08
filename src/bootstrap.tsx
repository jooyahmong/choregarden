import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n/config'
import { AuthProvider } from './contexts/AuthContext'
import { FamilyProvider } from './contexts/FamilyContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App.tsx'

export const mountApp = (container: HTMLElement) => {
  document.documentElement.lang = i18n.language?.split('-')[0] ?? 'ko'
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng.split('-')[0]
  })

  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <AuthProvider>
              <FamilyProvider>
                <App />
              </FamilyProvider>
            </AuthProvider>
          </BrowserRouter>
        </I18nextProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
