import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useFamilyChildren } from '../../hooks/useFamilyChildren';
import { useFamilyLedger } from '../../hooks/useFamilyLedger';
import { ApprovalCard } from '../../components/parent/ApprovalCard';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { Button } from '../../components/ui/Button';
import { approveChoreRequest, declineChoreRequest } from '../../lib/choreActions';
import { calculateAmountCents } from '../../lib/money';
import { DEFAULT_CURRENCY } from '../../utils/currencies';
import type { ChoreRequest } from '../../types/models';
import styles from './ParentChoresPage.module.css';

export const ParentChoresPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = user?.familyId ?? null;
  const { children } = useFamilyChildren(familyId);
  const ledger = useFamilyLedger(familyId);

  const autoSelectChildId = (location.state as { childId?: string } | null)?.childId ?? null;
  const [childFilter, setChildFilter] = useState<'all' | string>(autoSelectChildId ?? 'all');
  const [selected, setSelected] = useState<ChoreRequest | null>(null);
  const [adjustMode, setAdjustMode] = useState(false);
  const [adjustedMinutes, setAdjustedMinutes] = useState(0);
  const [declineMode, setDeclineMode] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pending = ledger.choreRequests.filter((c) => c.status === 'pending');
  const filtered = childFilter === 'all' ? pending : pending.filter((c) => c.childId === childFilter);

  const childName = (childId: string) => children.find((c) => c.id === childId)?.name ?? '';

  const openReview = (chore: ChoreRequest) => {
    setSelected(chore);
    setAdjustMode(false);
    setAdjustedMinutes(chore.minutes);
    setDeclineMode(false);
    setReason('');
  };

  // Arrived here from the family garden's "N waiting" chip for a specific
  // child — jump straight into reviewing their first pending chore instead
  // of making the parent tap into the list again.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current || !autoSelectChildId) return;
    const first = ledger.choreRequests.find(
      (c) => c.status === 'pending' && c.childId === autoSelectChildId
    );
    if (first) {
      openReview(first);
      autoOpenedRef.current = true;
    }
  }, [autoSelectChildId, ledger.choreRequests]);

  const handleApprove = async (minutes?: number) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await approveChoreRequest(selected.id, family?.currencyCode ?? DEFAULT_CURRENCY, minutes);
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!selected || !reason.trim()) return;
    setSubmitting(true);
    try {
      await declineChoreRequest(selected.id, reason.trim());
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (selected) {
    const previewAmount = calculateAmountCents(selected.hourlyRateCentsSnapshot, adjustedMinutes);

    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button type="button" className={styles.backButton} onClick={() => setSelected(null)} aria-label={t('common.back')}>
            ←
          </button>
          <h1 className={styles.title}>{t('parent.review_chore_title')}</h1>
        </div>
        <div className={styles.reviewCard}>
          <div className={styles.reviewChildName}>{childName(selected.childId)}</div>
          <div className={styles.reviewDivider} />
          <div className={styles.reviewRow}>
            <span>{selected.label}</span>
            <MoneyAmount cents={adjustMode ? previewAmount : selected.amountCents} />
          </div>
          {selected.note && <div className={styles.note}>{selected.note}</div>}
        </div>

        {adjustMode && (
          <div className={styles.stepperRow}>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() => setAdjustedMinutes((m) => Math.max(5, m - 5))}
            >
              −
            </button>
            <span className={styles.stepperValue}>{adjustedMinutes} min</span>
            <button type="button" className={styles.stepperButton} onClick={() => setAdjustedMinutes((m) => m + 5)}>
              +
            </button>
          </div>
        )}

        {declineMode && (
          <textarea
            className={styles.reasonInput}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('parent.reason_placeholder')}
          />
        )}

        {!adjustMode && !declineMode && (
          <div className={styles.actionRow}>
            <Button disabled={submitting} onClick={() => handleApprove()}>
              {t('parent.approve')}
            </Button>
            <Button variant="outline" onClick={() => setAdjustMode(true)}>
              {t('parent.adjust_approve')}
            </Button>
            <Button variant="danger" onClick={() => setDeclineMode(true)}>
              {t('parent.decline')}
            </Button>
          </div>
        )}

        {adjustMode && (
          <div className={styles.actionRow}>
            <Button disabled={submitting} onClick={() => handleApprove(adjustedMinutes)}>
              {t('parent.approve')}
            </Button>
            <Button variant="outline" onClick={() => setAdjustMode(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        )}

        {declineMode && (
          <div className={styles.actionRow}>
            <Button variant="danger" disabled={submitting || !reason.trim()} onClick={handleDecline}>
              {t('parent.decline')}
            </Button>
            <Button variant="outline" onClick={() => setDeclineMode(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{t('parent.chores_to_review')}</h1>
        <span className={styles.count}>{t('parent.n_waiting', { count: pending.length })}</span>
      </div>

      <div className={styles.filterRow}>
        <button
          type="button"
          className={[styles.filterTab, childFilter === 'all' ? styles.filterTabActive : ''].join(' ')}
          onClick={() => setChildFilter('all')}
        >
          {t('parent.filter_all')}
        </button>
        {children.map((child) => (
          <button
            key={child.id}
            type="button"
            className={[styles.filterTab, childFilter === child.id ? styles.filterTabActive : ''].join(' ')}
            onClick={() => setChildFilter(child.id)}
          >
            {child.name}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && <p className={styles.empty}>{t('parent.no_pending_approvals')}</p>}
        {filtered.map((chore) => (
          <ApprovalCard
            key={chore.id}
            chore={chore}
            childName={childName(chore.childId)}
            onClick={() => openReview(chore)}
          />
        ))}
      </div>
    </div>
  );
};
