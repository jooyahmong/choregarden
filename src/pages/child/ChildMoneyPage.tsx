import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useChild } from '../../hooks/useChild';
import { useChildLedger } from '../../hooks/useChildLedger';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { Button } from '../../components/ui/Button';
import { MonthCalendar, dateKey } from '../../components/ui/MonthCalendar';
import { requestPayout } from '../../lib/payoutActions';
import { requestPayoutPush } from '../../lib/pushNotifications';
import { flowerThresholdCents } from '../../lib/money';
import { getFiscalYearRange, formatDate, formatCurrency, localeForLanguage } from '../../utils/formatting';
import { DEFAULT_CURRENCY, type CurrencyCode } from '../../utils/currencies';
import styles from './ChildMoneyPage.module.css';

type View = 'overview' | 'request';
type HistoryFilter = 'day' | 'week' | 'month' | 'year' | 'fiscal_year';

interface Transaction {
  id: string;
  label: string;
  date: Date;
  amountCents: number;
  currencyCode: string | null;
}

export const ChildMoneyPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { family } = useFamily();
  const childId = user?.type === 'child' ? user.childId : null;
  const familyId = user?.familyId ?? null;
  const ledger = useChildLedger(childId);
  const { child } = useChild(childId);

  const [view, setView] = useState<View>('overview');
  const [amountMode, setAmountMode] = useState<'all' | 'custom'>('all');
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showLockedPopup, setShowLockedPopup] = useState(false);

  const locale = localeForLanguage(i18n.language);
  const currency = (family?.currencyCode as CurrencyCode) ?? DEFAULT_CURRENCY;
  const paidCents = ledger.payoutRequests
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amountCents, 0);

  let payoutLockedReason: string | null = null;
  if (child) {
    if (child.payoutRule === 'weekly_friday' && new Date().getDay() !== 5) {
      payoutLockedReason = t('parent.payout_locked_weekly_friday');
    } else if (child.payoutRule === 'on_bloom') {
      const threshold = flowerThresholdCents(child.hourlyRateCents);
      if (threshold <= 0 || ledger.unpaidBalanceCents < threshold) {
        payoutLockedReason = t('parent.payout_locked_on_bloom');
      }
    } else if (child.payoutRule === 'at_amount') {
      if (ledger.unpaidBalanceCents < child.payoutThresholdCents) {
        payoutLockedReason = t('parent.payout_locked_at_amount', {
          amount: formatCurrency(child.payoutThresholdCents, currency, locale),
        });
      }
    }
  }

  const transactions: Transaction[] = useMemo(() => {
    const choreTx: Transaction[] = ledger.choreRequests
      .filter((c) => c.status === 'approved' && c.reviewedAt)
      .map((c) => ({
        id: `chore-${c.id}`,
        label: c.label,
        date: c.reviewedAt as Date,
        amountCents: c.amountCents,
        currencyCode: c.currencyCode,
      }));
    const payoutTx: Transaction[] = ledger.payoutRequests
      .filter((p) => p.status === 'paid' && p.paidAt)
      .map((p) => ({
        id: `payout-${p.id}`,
        label: t('parent.mark_as_paid'),
        date: p.paidAt as Date,
        amountCents: -p.amountCents,
        currencyCode: p.currencyCode,
      }));
    return [...choreTx, ...payoutTx].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [ledger.choreRequests, ledger.payoutRequests, t]);

  const handleRequestPayout = async () => {
    if (!familyId || !childId) return;
    const amountCents =
      amountMode === 'all'
        ? ledger.unpaidBalanceCents
        : Math.round(Number(customAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > ledger.unpaidBalanceCents) return;

    setSubmitting(true);
    try {
      const payoutRequestId = await requestPayout(familyId, childId, amountCents);
      await requestPayoutPush(payoutRequestId).catch(() => undefined);
      setView('overview');
      setCustomAmount('');
      setAmountMode('all');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'request') {
    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button type="button" className={styles.backButton} onClick={() => setView('overview')} aria-label={t('common.back')}>
            ←
          </button>
          <h1 className={styles.title}>{t('child.request_payout_title')}</h1>
        </div>

        <div className={styles.availableCard}>
          <p className={styles.summaryLabel}>{t('child.available')}</p>
          <MoneyAmount cents={ledger.unpaidBalanceCents} className={styles.summaryAmount} />
        </div>

        <p className={styles.sectionTitle}>{t('child.choose_amount')}</p>
        <label className={styles.amountOption}>
          <input type="radio" checked={amountMode === 'all'} onChange={() => setAmountMode('all')} />
          <span>{t('child.amount_all')}</span>
          <MoneyAmount cents={ledger.unpaidBalanceCents} />
        </label>
        <label className={styles.amountOption}>
          <input type="radio" checked={amountMode === 'custom'} onChange={() => setAmountMode('custom')} />
          <span>{t('child.amount_custom')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.amountInput}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            disabled={amountMode !== 'custom'}
          />
        </label>

        <p className={styles.hint}>{t('child.payout_note')}</p>

        <Button fullWidth disabled={submitting} onClick={handleRequestPayout}>
          {t('child.send_payout_request')}
        </Button>
        <Button variant="outline" fullWidth onClick={() => setView('overview')}>
          {t('common.cancel')}
        </Button>
      </div>
    );
  }

  const anchor = selectedDate;
  let rangeStart: Date;
  let rangeEnd: Date;
  switch (historyFilter) {
    case 'day':
      rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
      rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 23, 59, 59, 999);
      break;
    case 'week': {
      const weekday = anchor.getDay();
      const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
      const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + diffToMonday);
      rangeStart = monday;
      rangeEnd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
      break;
    }
    case 'year':
      rangeStart = new Date(anchor.getFullYear(), 0, 1);
      rangeEnd = new Date(anchor.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'fiscal_year': {
      const fy = getFiscalYearRange(family?.fiscalYearStartMonth ?? 1, anchor);
      rangeStart = fy.startDate;
      rangeEnd = fy.endDate;
      break;
    }
    case 'month':
    default:
      rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const periodTx = transactions.filter((tx) => tx.date >= rangeStart && tx.date <= rangeEnd);
  const periodTotal = periodTx.reduce((sum, tx) => sum + tx.amountCents, 0);
  const markedDates = new Set(transactions.map((tx) => dateKey(tx.date)));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('child.money_title')}</h1>

      <div className={styles.summaryRow}>
        <div className={[styles.summaryCard, styles.growingCard].join(' ')}>
          <p className={styles.summaryLabel}>{t('child.growing_label')}</p>
          <MoneyAmount cents={ledger.unpaidBalanceCents} className={styles.summaryAmount} />
        </div>
        <div className={[styles.summaryCard, styles.paidCard].join(' ')}>
          <p className={styles.summaryLabel}>{t('child.paid_label')}</p>
          <MoneyAmount cents={paidCents} className={styles.summaryAmount} />
        </div>
      </div>

      <p className={styles.totalRow}>
        {t('child.total_earned')}: <MoneyAmount cents={ledger.lifetimeEarnedCents} />
      </p>

      <Button
        fullWidth
        onClick={() => (payoutLockedReason ? setShowLockedPopup(true) : setView('request'))}
      >
        {t('child.request_payout')}
      </Button>

      {showLockedPopup && payoutLockedReason && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.dialog}>
            <p className={styles.dialogText}>{payoutLockedReason}</p>
            <Button fullWidth onClick={() => setShowLockedPopup(false)}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      )}

      <p className={styles.sectionTitle}>{t('child.view_my_chores')}</p>

      <div className={styles.filterRow}>
        {(['day', 'week', 'month', 'year', 'fiscal_year'] as HistoryFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={[styles.filterTab, historyFilter === f ? styles.filterTabActive : ''].join(' ')}
            onClick={() => setHistoryFilter(f)}
          >
            {t(`child.filter_${f}`)}
          </button>
        ))}
      </div>

      <MonthCalendar
        viewMonth={calendarMonth}
        selectedDate={selectedDate}
        markedDates={markedDates}
        onSelectDate={(date) => setSelectedDate(date)}
        onChangeMonth={(delta) =>
          setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
        }
        locale={locale}
      />

      <p className={styles.hint}>
        {t('child.period_total')}: <MoneyAmount cents={periodTotal} />
      </p>

      {periodTx.length === 0 && <p className={styles.hint}>{t('parent.no_transactions')}</p>}

      {periodTx.length > 0 && (
        <div className={styles.listBox}>
          {periodTx.map((tx) => (
            <div key={tx.id} className={styles.listItem}>
              <div>
                <div>{tx.label}</div>
                <div className={styles.activityMeta}>{formatDate(tx.date, 'long', locale)}</div>
              </div>
              <MoneyAmount
                cents={tx.amountCents}
                currencyCode={tx.currencyCode}
                className={tx.amountCents >= 0 ? styles.positive : styles.negative}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
