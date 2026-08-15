import { useTranslation } from 'react-i18next';
import type { ChoreRequest, PayoutRequest } from '../../types/models';
import styles from './ParentRequestBanner.module.css';

export type ParentRequestNotice =
  | { type: 'chore'; request: ChoreRequest; childName: string }
  | { type: 'payout'; request: PayoutRequest; childName: string };

export const ParentRequestBanner = ({ notice, onView, onClose }: { notice: ParentRequestNotice; onView: () => void; onClose: () => void }) => {
  const { t } = useTranslation();
  const message = notice.type === 'chore'
    ? t('parent.chore_request_banner', { name: notice.childName })
    : t('parent.payout_request_banner', { name: notice.childName });

  return (
    <aside className={styles.banner} aria-live="polite" aria-atomic="true">
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.viewButton} onClick={onView}>{t('common.view')}</button>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>×</button>
      </div>
    </aside>
  );
};
