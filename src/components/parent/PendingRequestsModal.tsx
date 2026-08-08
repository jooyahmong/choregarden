import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoneyAmount } from '../ui/MoneyAmount';
import { Button } from '../ui/Button';
import type { ChoreRequest, PayoutRequest } from '../../types/models';
import styles from './PendingRequestsModal.module.css';

interface PendingRequestsModalProps {
  choreRequests: ChoreRequest[];
  payoutRequests: PayoutRequest[];
  childNameById: Record<string, string>;
  onClose: () => void;
}

// Deliberately not built on the shared `Modal` (no backdrop-click / Escape
// dismissal) — the parent asked for this to stay up until they explicitly
// tap confirm, so a new pending chore/payout request can't be missed.
export const PendingRequestsModal = ({
  choreRequests,
  payoutRequests,
  childNameById,
  onClose,
}: PendingRequestsModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const total = choreRequests.length + payoutRequests.length;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('parent.new_requests_title')}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>{t('parent.new_requests_title')}</h2>
        <p className={styles.subtitle}>{t('parent.n_waiting', { count: total })}</p>

        <div className={styles.list}>
          {choreRequests.map((chore) => (
            <div key={chore.id} className={styles.item}>
              <span>{childNameById[chore.childId] ?? ''}</span>
              <span className={styles.itemLabel}>{chore.label}</span>
              <MoneyAmount cents={chore.amountCents} />
            </div>
          ))}
          {payoutRequests.map((payout) => (
            <div key={payout.id} className={styles.item}>
              <span>{childNameById[payout.childId] ?? ''}</span>
              <span className={styles.itemLabel}>{t('parent.payout_request_title')}</span>
              <MoneyAmount cents={payout.amountCents} />
            </div>
          ))}
        </div>

        <Button
          fullWidth
          onClick={() => {
            onClose();
            navigate(choreRequests.length > 0 ? '/parent/chores' : '/parent/money');
          }}
        >
          {t('parent.review_now')}
        </Button>
      </div>
    </div>
  );
};
