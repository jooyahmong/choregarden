import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useChild } from '../../hooks/useChild';
import { useChildLedger } from '../../hooks/useChildLedger';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { calculateAmountCents } from '../../lib/money';
import { submitChoreRequest } from '../../lib/choreActions';
import { requestChorePush } from '../../lib/pushNotifications';
import type { ChoreRequest } from '../../types/models';
import styles from './ChildChoresPage.module.css';

type View = 'grid' | 'sent' | 'history';
type MainTab = 'grid' | 'history';
type FilterStatus = 'all' | ChoreRequest['status'];

const PAGE_SIZE = 5;

export const ChildChoresPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const childId = user?.type === 'child' ? user.childId : null;
  const familyId = user?.familyId ?? null;

  const { child } = useChild(childId);
  const ledger = useChildLedger(childId);

  const [view, setView] = useState<View>('grid');
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{ label: string; icon: string; minutes: number; amountCents: number } | null>(null);

  const pendingCount = ledger.choreRequests.filter((c) => c.status === 'pending').length;

  const earnCents = child ? calculateAmountCents(child.hourlyRateCents, minutes) : 0;

  const handleSubmit = async () => {
    if (!child || !familyId || !childId) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    setSubmitting(true);
    try {
      const choreRequestId = await submitChoreRequest({
        familyId,
        childId,
        choreTemplateId: null,
        label: trimmedLabel,
        icon: 'other',
        minutes,
        hourlyRateCents: child.hourlyRateCents,
        note: note.trim() || undefined,
      });
      void requestChorePush(choreRequestId).catch(() => undefined);
      setLastSubmitted({ label: trimmedLabel, icon: 'other', minutes, amountCents: earnCents });
      setLabel('');
      setMinutes(15);
      setNote('');
      setView('sent');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory =
    filter === 'all' ? ledger.choreRequests : ledger.choreRequests.filter((c) => c.status === filter);
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedHistory = filteredHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeFilter = (f: FilterStatus) => {
    setFilter(f);
    setPage(1);
  };

  if (view === 'sent' && lastSubmitted) {
    return (
      <div className={styles.page}>
        <h1 className={styles.sentTitle}>{t('child.sent_to_parent')}</h1>
        <div className={styles.selectedCard}>
          <div className={styles.historyMain}>
            <div>{lastSubmitted.label}</div>
            <div className={styles.historyMeta}>
              {lastSubmitted.minutes} min · <MoneyAmount cents={lastSubmitted.amountCents} />
            </div>
          </div>
          <StatusBadge status="pending" />
        </div>
        <p className={styles.hint}>{t('child.garden_will_grow_note')}</p>
        <Button fullWidth onClick={() => navigate('/child/garden')}>
          {t('child.back_to_garden')}
        </Button>
        <button type="button" className={styles.linkButton} onClick={() => setView('history')}>
          {t('child.view_my_chores')}
        </button>
      </div>
    );
  }

  const mainTab: MainTab = view === 'history' ? 'history' : 'grid';

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{t('child.chores_title')}</h1>
        {pendingCount > 0 && (
          <span className={styles.pendingBadge}>{t('child.n_pending', { count: pendingCount })}</span>
        )}
      </div>

      <div className={styles.mainTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'grid'}
          className={[styles.mainTab, mainTab === 'grid' ? styles.mainTabActive : ''].join(' ')}
          onClick={() => setView('grid')}
        >
          {t('child.what_did_you_do')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'history'}
          className={[styles.mainTab, mainTab === 'history' ? styles.mainTabActive : ''].join(' ')}
          onClick={() => setView('history')}
        >
          {t('child.view_my_chores')}
        </button>
      </div>

      {mainTab === 'grid' && (
        <>
          <div className={styles.formRow}>
            <input
              type="text"
              className={styles.choreSelect}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('child.chore_label_placeholder')}
            />

            <div className={styles.stepperRow}>
              <button
                type="button"
                className={styles.stepperButton}
                onClick={() => setMinutes((m) => Math.max(5, m - 5))}
                aria-label="-5"
              >
                −
              </button>
              <span className={styles.stepperValue}>{minutes} min</span>
              <button
                type="button"
                className={styles.stepperButton}
                onClick={() => setMinutes((m) => m + 5)}
                aria-label="+5"
              >
                +
              </button>
            </div>
          </div>

          <p className={styles.earnLine}>
            {t('child.you_will_earn')}: <MoneyAmount cents={earnCents} />
          </p>

          <div>
            <label className={styles.hint} htmlFor="chore-note">
              {t('child.note_optional')}
            </label>
            <textarea
              id="chore-note"
              className={styles.noteInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('child.note_placeholder')}
            />
          </div>

          <Button fullWidth disabled={submitting || !label.trim()} onClick={handleSubmit}>
            {t('child.ask_parent_to_approve')}
          </Button>
        </>
      )}

      {mainTab === 'history' && (
        <>
          <div className={styles.filterRow}>
            {(['all', 'pending', 'approved', 'declined'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                type="button"
                className={[styles.filterTab, filter === f ? styles.filterTabActive : ''].join(' ')}
                onClick={() => changeFilter(f)}
              >
                {t(`child.filter_${f}`)}
              </button>
            ))}
          </div>

          {pagedHistory.length > 0 && (
            <div className={styles.listBox}>
              {pagedHistory.map((chore) => (
                <div key={chore.id} className={styles.listItem}>
                  <div className={styles.historyMain}>
                    <div>{chore.label}</div>
                    <div className={styles.historyMeta}>
                      {chore.minutes} min · <MoneyAmount cents={chore.amountCents} currencyCode={chore.currencyCode} />
                    </div>
                    {chore.status === 'declined' && chore.declineReason && (
                      <p className={styles.declineReason}>
                        {t('child.reason_prefix', { reason: chore.declineReason })}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={chore.status} />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="prev"
              >
                ‹
              </button>
              <span className={styles.pageLabel}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="next"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
