import { MoneyAmount } from '../ui/MoneyAmount';
import { StatusBadge } from '../ui/StatusBadge';
import type { ChoreRequest } from '../../types/models';
import styles from './ApprovalCard.module.css';

interface ApprovalCardProps {
  chore: ChoreRequest;
  childName: string;
  onClick: () => void;
}

export const ApprovalCard = ({ chore, childName, onClick }: ApprovalCardProps) => (
  <button type="button" className={styles.card} onClick={onClick}>
    <div className={styles.main}>
      <div className={styles.childName}>{childName}</div>
      <div>{chore.label}</div>
      <div className={styles.meta}>
        {chore.minutes} min · <MoneyAmount cents={chore.amountCents} />
      </div>
    </div>
    <StatusBadge status={chore.status} />
    <span className={styles.chevron}>›</span>
  </button>
);
