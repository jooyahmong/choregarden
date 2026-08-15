import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useFamilyChildren } from '../../hooks/useFamilyChildren';
import { useFamilyLedger } from '../../hooks/useFamilyLedger';
import { PayoutCard } from '../../components/parent/PayoutCard';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { dateKey } from '../../components/ui/MonthCalendar';
import { PeriodPickerModal } from '../../components/ui/PeriodPickerModal';
import { Button } from '../../components/ui/Button';
import { markPayoutPaid, declinePayoutRequest } from '../../lib/payoutActions';
import { sumAmountCents } from '../../lib/money';
import { getFiscalYearRange, getFiscalYearLabel, formatDate, localeForLanguage } from '../../utils/formatting';
import { DEFAULT_CURRENCY } from '../../utils/currencies';
import type { PayoutRequest } from '../../types/models';
import styles from './ParentMoneyPage.module.css';

type Period = 'day' | 'week' | 'month' | 'year' | 'fiscal_year';

export const ParentMoneyPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = user?.familyId ?? null;
  const { children } = useFamilyChildren(familyId);
  const ledger = useFamilyLedger(familyId);

  const [childFilter, setChildFilter] = useState<'all' | string>('all');
  const [period, setPeriod] = useState<Period>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [declineMode, setDeclineMode] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const locale = localeForLanguage(i18n.language);
  const childName = (childId: string) => children.find((c) => c.id === childId)?.name ?? '';

  const inScope = <T extends { childId: string }>(items: T[]) =>
    childFilter === 'all' ? items : items.filter((i) => i.childId === childFilter);

  const unpaidTotal = sumAmountCents(
    Object.entries(ledger.unpaidBalanceCentsByChild)
      .filter(([childId]) => childFilter === 'all' || childId === childFilter)
      .map(([, v]) => v)
  );
  const paidTotal = sumAmountCents(
    Object.entries(ledger.paidCentsByChild)
      .filter(([childId]) => childFilter === 'all' || childId === childFilter)
      .map(([, v]) => v)
  );
  const approvedChores = inScope(ledger.choreRequests.filter((c) => c.status === 'approved'));
  const lifetimeTotal = sumAmountCents(approvedChores.map((c) => c.amountCents));

  const requestedPayouts = inScope(ledger.payoutRequests.filter((p) => p.status === 'requested'));

  useEffect(() => {
    const requestId = searchParams.get('requestId');
    const payout = requestId ? ledger.payoutRequests.find((item) => item.id === requestId && item.status === 'requested') : null;
    if (payout) { setSelectedPayout(payout); setDeclineMode(false); setReason(''); setSearchParams({}, { replace: true }); }
  }, [ledger.payoutRequests, searchParams, setSearchParams]);

  const transactions = useMemo(() => {
    const choreTx = approvedChores
      .filter((c) => c.reviewedAt)
      .map((c) => ({
        id: `chore-${c.id}`,
        label: `${childName(c.childId)} · ${c.label}`,
        date: c.reviewedAt as Date,
        amountCents: c.amountCents,
        currencyCode: c.currencyCode,
      }));
    const payoutTx = inScope(ledger.payoutRequests.filter((p) => p.status === 'paid' && p.paidAt)).map((p) => ({
      id: `payout-${p.id}`,
      label: `${t('parent.mark_as_paid')} · ${childName(p.childId)}`,
      date: p.paidAt as Date,
      amountCents: -p.amountCents,
      currencyCode: p.currencyCode,
    }));
    return [...choreTx, ...payoutTx].sort((a, b) => b.date.getTime() - a.date.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedChores, ledger.payoutRequests, childFilter]);

  const anchor = selectedDate;
  let rangeStart: Date;
  let rangeEnd: Date;
  switch (period) {
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
  const markedDates = new Set(transactions.map((tx) => dateKey(tx.date)));

  const periodLabel = (() => {
    switch (period) {
      case 'day':
        return formatDate(selectedDate, 'long', locale);
      case 'week':
        return `${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(rangeStart)} – ${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(rangeEnd)}`;
      case 'year':
        return `${rangeStart.getFullYear()}`;
      case 'fiscal_year':
        return `${t('settings.financial_year')} ${getFiscalYearLabel(selectedDate, family?.fiscalYearStartMonth ?? 1)}`;
      case 'month':
      default:
        return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(rangeStart);
    }
  })();

  const openPayoutReview = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setDeclineMode(false);
    setReason('');
  };

  const handleMarkPaid = async () => {
    if (!selectedPayout) return;
    setSubmitting(true);
    try {
      await markPayoutPaid(selectedPayout.id, family?.currencyCode ?? DEFAULT_CURRENCY);
      setSelectedPayout(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclinePayout = async () => {
    if (!selectedPayout || !reason.trim()) return;
    setSubmitting(true);
    try {
      await declinePayoutRequest(selectedPayout.id, reason.trim());
      setSelectedPayout(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedPayout) {
    const availableForChild = ledger.unpaidBalanceCentsByChild[selectedPayout.childId] ?? 0;
    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => setSelectedPayout(null)}
            aria-label={t('common.back')}
          >
            ←
          </button>
          <h1 className={styles.title}>{t('parent.payout_request_title')}</h1>
        </div>
        <p>{childName(selectedPayout.childId)}</p>

        <div className={styles.reviewCard}>
          <div className={styles.row}>
            <span>{t('parent.requested', { name: childName(selectedPayout.childId) })}</span>
            <MoneyAmount cents={selectedPayout.amountCents} />
          </div>
          <div className={styles.row}>
            <span>{t('parent.available')}</span>
            <MoneyAmount cents={availableForChild} />
          </div>
        </div>

        <p className={styles.infoNote}>
          {t('parent.payout_you_pay_note', { name: childName(selectedPayout.childId) })}
        </p>

        {declineMode ? (
          <>
            <textarea
              className={styles.reasonInput}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('parent.reason_placeholder')}
            />
            <Button variant="danger" fullWidth disabled={submitting || !reason.trim()} onClick={handleDeclinePayout}>
              {t('parent.decline')}
            </Button>
            <Button variant="outline" fullWidth onClick={() => setDeclineMode(false)}>
              {t('common.cancel')}
            </Button>
          </>
        ) : (
          <>
            <Button fullWidth disabled={submitting} onClick={handleMarkPaid}>
              {t('parent.mark_as_paid')}
            </Button>
            <Button variant="danger" fullWidth onClick={() => setDeclineMode(true)}>
              {t('parent.decline')}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('parent.money_title')}</h1>

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

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>{t('parent.unpaid')}</p>
          <MoneyAmount cents={unpaidTotal} className={styles.summaryAmount} />
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>{t('parent.paid')}</p>
          <MoneyAmount cents={paidTotal} className={styles.summaryAmount} />
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>{t('parent.total')}</p>
          <MoneyAmount cents={lifetimeTotal} className={styles.summaryAmount} />
        </div>
      </div>

      {requestedPayouts.length > 0 && (
        <div>
          <p className={styles.sectionTitle}>{t('parent.payout_request_title')}</p>
          {requestedPayouts.map((payout) => (
            <PayoutCard
              key={payout.id}
              payout={payout}
              childName={childName(payout.childId)}
              onClick={() => openPayoutReview(payout)}
            />
          ))}
        </div>
      )}

      <DateRangeFilter
        options={[
          { value: 'day' as Period, label: t('child.filter_day') },
          { value: 'week' as Period, label: t('child.filter_week') },
          { value: 'month' as Period, label: t('child.filter_month') },
          { value: 'year' as Period, label: t('child.filter_year') },
          { value: 'fiscal_year' as Period, label: t('child.filter_fiscal_year') },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <button type="button" className={styles.periodSelectorButton} onClick={() => setPickerOpen(true)}>
        {periodLabel}
      </button>

      {pickerOpen && (
        <PeriodPickerModal
          period={period}
          selectedDate={selectedDate}
          calendarMonth={calendarMonth}
          markedDates={markedDates}
          fiscalYearStartMonth={family?.fiscalYearStartMonth ?? 1}
          locale={locale}
          onSelect={(date) => setSelectedDate(date)}
          onChangeMonth={(delta) =>
            setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
          }
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div>
        {periodTx.length === 0 && <p className={styles.empty}>{t('parent.no_transactions')}</p>}
        {periodTx.length > 0 && (
          <div className={styles.listBox}>
            {periodTx.map((tx) => (
              <div key={tx.id} className={styles.listItem}>
                <div>
                  <div className={styles.activityLabel}>{tx.label}</div>
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
    </div>
  );
};
