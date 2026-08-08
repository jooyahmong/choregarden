import { useTranslation } from 'react-i18next';
import { MoneyAmount } from '../ui/MoneyAmount';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import type { ChoreRequest, PayoutRequest } from '../../types/models';
import styles from './ChildResultsModal.module.css';

interface ChildResultsModalProps {
  chores: ChoreRequest[];
  payouts: PayoutRequest[];
  onClose: () => void;
}

// Mirrors PendingRequestsModal's "stays until confirmed" behavior, but for
// the child: tells them what happened to chores/payouts they already sent in
// (approved/declined, or paid/declined) since they can't act on those, only
// acknowledge them.
export const ChildResultsModal = ({ chores, payouts, onClose }: ChildResultsModalProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('child.results_title')}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>{t('child.results_title')}</h2>

        <div className={styles.list}>
          {chores.map((chore) => (
            <div key={chore.id} className={styles.item}>
              <div className={styles.itemRow}>
                <span className={styles.itemLabel}>{chore.label}</span>
                <StatusBadge status={chore.status} />
              </div>
              {chore.status === 'approved' && (
                <div className={styles.itemAmount}>
                  <MoneyAmount cents={chore.amountCents} />
                </div>
              )}
              {chore.status === 'declined' && chore.declineReason && (
                <p className={styles.declineReason}>
                  {t('child.reason_prefix', { reason: chore.declineReason })}
                </p>
              )}
            </div>
          ))}

          {payouts.map((payout) => (
            <div key={payout.id} className={styles.item}>
              <div className={styles.itemRow}>
                <span className={styles.itemLabel}>{t('parent.payout_request_title')}</span>
                <StatusBadge status={payout.status} />
              </div>
              {payout.status === 'paid' && (
                <div className={styles.itemAmount}>
                  <MoneyAmount cents={payout.amountCents} currencyCode={payout.currencyCode} />
                </div>
              )}
              {payout.status === 'declined' && payout.declineReason && (
                <p className={styles.declineReason}>
                  {t('child.reason_prefix', { reason: payout.declineReason })}
                </p>
              )}
            </div>
          ))}
        </div>

        <Button fullWidth onClick={onClose}>
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
};
