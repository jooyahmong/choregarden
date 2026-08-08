import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { LegalModal, type LegalDocKey } from '../../components/legal/LegalModal';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import formStyles from './AuthForm.module.css';
import styles from './AuthPage.module.css';

type Tab = 'parent' | 'child';
type ParentMode = 'login' | 'forgot';

export const AuthPage = () => {
  const { t } = useTranslation();
  const { signInParent, signInChild, sendPasswordReset } = useAuth();

  const [tab, setTab] = useState<Tab>('parent');
  const [mode, setMode] = useState<ParentMode>('login');
  const [openDoc, setOpenDoc] = useState<LegalDocKey | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [pin, setPin] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const switchTab = (next: Tab) => {
    setTab(next);
    setMode('login');
    setError('');
  };

  const handleParentLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInParent(email, password, true);
    } catch {
      setError(t('auth.error_invalid_credentials'));
      setSubmitting(false);
    }
  };

  const handleChildLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInChild(familyCode, pin, true);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'family_not_found') setError(t('auth.error_family_not_found'));
      else if (code === 'invalid_pin') setError(t('auth.error_invalid_pin'));
      else setError(t('common.error'));
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch {
      setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <header className={styles.header}>
        <img src={logo} alt={t('common.app_name')} className={styles.logo} />
        <p className={styles.tagline}>{t('common.tagline')}</p>
      </header>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'parent'}
          className={[styles.tab, tab === 'parent' ? styles.tabActive : ''].join(' ')}
          onClick={() => switchTab('parent')}
        >
          {t('auth.parent_login_tab')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'child'}
          className={[styles.tab, tab === 'child' ? styles.tabActive : ''].join(' ')}
          onClick={() => switchTab('child')}
        >
          {t('auth.child_login_tab')}
        </button>
      </div>

      {tab === 'parent' && mode === 'login' && (
        <form className={formStyles.form} onSubmit={handleParentLogin}>
          <Field
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Field
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => {
              setMode('forgot');
              setError('');
              setResetSent(false);
            }}
          >
            {t('auth.forgot_password_link')}
          </button>

          {error && <p className={formStyles.formError}>{error}</p>}

          <Button type="submit" fullWidth disabled={submitting}>
            {t('auth.sign_in')}
          </Button>

          <div className={styles.divider}>
            <span>{t('auth.or_divider')}</span>
          </div>

          <p className={styles.signupRow}>
            {t('auth.no_account')} <Link to="/parent/signup">{t('auth.sign_up')}</Link>
          </p>
        </form>
      )}

      {tab === 'parent' && mode === 'forgot' && (
        <form className={formStyles.form} onSubmit={handleForgotPassword}>
          <h2 className={formStyles.title}>{t('auth.reset_password_title')}</h2>
          <Field
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />

          {resetSent && <p className={styles.successNote}>{t('auth.reset_link_sent')}</p>}
          {error && <p className={formStyles.formError}>{error}</p>}

          <Button type="submit" fullWidth disabled={submitting}>
            {t('auth.send_reset_link')}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setMode('login')}>
            {t('auth.back_to_login')}
          </Button>
        </form>
      )}

      {tab === 'child' && (
        <form className={formStyles.form} onSubmit={handleChildLogin}>
          <Field
            label={t('auth.family_code')}
            value={familyCode}
            onChange={(value) => setFamilyCode(value.toUpperCase())}
            required
            autoCapitalize="characters"
          />
          <Field label={t('auth.child_pin')} type="pin" value={pin} onChange={setPin} required />

          {error && <p className={formStyles.formError}>{error}</p>}

          <Button type="submit" fullWidth disabled={submitting}>
            {t('auth.enter_my_garden')}
          </Button>

          <p className={formStyles.hint}>{t('auth.ask_parent_for_code')}</p>
        </form>
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.footerLink} onClick={() => setOpenDoc('privacy')}>
          {t('common.privacy')}
        </button>
        <button type="button" className={styles.footerLink} onClick={() => setOpenDoc('terms')}>
          {t('common.terms')}
        </button>
      </div>

      {openDoc && <LegalModal doc={openDoc} onClose={() => setOpenDoc(null)} />}
    </AuthLayout>
  );
};
