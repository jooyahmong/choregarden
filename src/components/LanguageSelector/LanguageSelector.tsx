import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css';

const LANGUAGES: { code: 'ko' | 'en'; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
];

interface LanguageSelectorProps {
  /** Total width of the selector; the two options split this evenly. Defaults to filling its container (matching sibling buttons like Sign out). */
  width?: string;
}

export const LanguageSelector = ({ width = '100%' }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('ko') ? 'ko' : 'en';

  return (
    <div className={styles.group} style={{ width }} role="group" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={[styles.option, current === code ? styles.active : ''].join(' ')}
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
