import { MoneyAmount } from '../ui/MoneyAmount';
import { StatusBadge } from '../ui/StatusBadge';
import type { PayoutRequest } from '../../types/models';
import styles from './ApprovalCard.module.css';

interface PayoutCardProps {
  payout: PayoutRequest;
  childName: string;
  onClick: () => void;
}

export const PayoutCard = ({ payout, childName, onClick }: PayoutCardProps) => (
  <button type="button" className={styles.card} onClick={onClick}>
    <div className={styles.main}>
      <div className={styles.childName}>{childName}</div>
      <div>
        <MoneyAmount cents={payout.amountCents} />
      </div>
    </div>
    <StatusBadge status={payout.status} />
    <span className={styles.chevron}>›</span>
  </button>
);
