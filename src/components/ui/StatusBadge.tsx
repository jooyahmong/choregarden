import { useTranslation } from 'react-i18next';
import styles from './StatusBadge.module.css';

type Status = 'pending' | 'approved' | 'declined' | 'paid' | 'requested';

export const StatusBadge = ({ status }: { status: Status }) => {
  const { t } = useTranslation();
  return <span className={[styles.badge, styles[status]].join(' ')}>{t(`status.${status}`)}</span>;
};
