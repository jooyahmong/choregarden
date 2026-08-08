import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { privacyPolicy, termsOfService } from '../../content/legalContent';
import styles from './LegalModal.module.css';

export type LegalDocKey = 'privacy' | 'terms';

export const LegalModal = ({ doc, onClose }: { doc: LegalDocKey; onClose: () => void }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  const content = (doc === 'privacy' ? privacyPolicy : termsOfService)[lang];

  return (
    <Modal title={content.title} onClose={onClose}>
      <p className={styles.effectiveDate}>{content.effectiveDate}</p>
      <p className={styles.intro}>{content.intro}</p>
      {content.sections.map((section) => (
        <div key={section.heading} className={styles.section}>
          <h3 className={styles.sectionHeading}>{section.heading}</h3>
          <ul className={styles.sectionBody}>
            {section.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </Modal>
  );
};
