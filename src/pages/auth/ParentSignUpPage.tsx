import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import formStyles from './AuthForm.module.css';

export const ParentSignUpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUpParent } = useAuth();

  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signUpParent(email, password, familyName || 'Our Family', remember);
      navigate('/parent/children/add', { replace: true });
    } catch {
      setError(t('auth.error_invalid_credentials'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <h1 className={formStyles.title}>{t('auth.create_family_title')}</h1>

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
          placeholder={t('auth.create_password')}
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Field
          label={t('auth.family_name')}
          value={familyName}
          onChange={setFamilyName}
          placeholder={t('auth.family_name_placeholder')}
        />

        <label className={formStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          {t('auth.remember_device')}
        </label>

        {error && <p className={formStyles.formError}>{error}</p>}

        <Button type="submit" fullWidth disabled={submitting}>
          {t('auth.create_family_button')}
        </Button>

        <p className={formStyles.switchLink}>
          {t('auth.already_have_account')} <Link to="/">{t('auth.sign_in')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
