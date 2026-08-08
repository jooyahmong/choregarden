import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector/LanguageSelector';
import { Button } from '../../components/ui/Button';
import styles from './ChildSettingsPage.module.css';

export const ChildSettingsPage = () => {
  const { t } = useTranslation();
  const { signOutCurrent } = useAuth();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.title')}</h1>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.language')}</p>
        <LanguageSelector />
      </div>

      <Button variant="danger" fullWidth onClick={() => signOutCurrent()}>
        {t('parent.sign_out')}
      </Button>
    </div>
  );
};
