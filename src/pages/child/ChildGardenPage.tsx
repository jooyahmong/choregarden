import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useChild } from '../../hooks/useChild';
import { useChildLedger } from '../../hooks/useChildLedger';
import { GardenPlot } from '../../components/garden/GardenPlot';
import { FlowerProgress } from '../../components/garden/FlowerProgress';
import { FlowerIcon } from '../../components/icons/FlowerIcon';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { flowerThresholdCents } from '../../lib/money';
import { setCurrentFlower } from '../../lib/childActions';
import { formatCurrency, localeForLanguage } from '../../utils/formatting';
import { DEFAULT_CURRENCY, type CurrencyCode } from '../../utils/currencies';
import type { FlowerType } from '../../types/models';
import styles from './ChildGardenPage.module.css';

const FLOWER_TYPES: FlowerType[] = ['tulip', 'sunflower', 'daisy', 'lavender'];

export const ChildGardenPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { family } = useFamily();
  const childId = user?.type === 'child' ? user.childId : null;
  const { child, loading } = useChild(childId);
  const ledger = useChildLedger(childId);
  const [showLockedPopup, setShowLockedPopup] = useState(false);

  if (loading || !child) return <Spinner />;

  const threshold = flowerThresholdCents(child.hourlyRateCents);
  const progress = threshold > 0 ? child.flowerProgressCents / threshold : 0;
  const pendingCount = ledger.choreRequests.filter((c) => c.status === 'pending').length;

  const locale = localeForLanguage(i18n.language);
  const currency = (family?.currencyCode as CurrencyCode) ?? DEFAULT_CURRENCY;
  let payoutLockedReason: string | null = null;
  if (child.payoutRule === 'weekly_friday' && new Date().getDay() !== 5) {
    payoutLockedReason = t('parent.payout_locked_weekly_friday');
  } else if (child.payoutRule === 'on_bloom') {
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('child.my_garden')}</h1>

      <div className={styles.gardenColumn}>
        <GardenPlot
          currentFlowerType={child.currentFlowerType}
          progress={progress}
          completedFlowers={ledger.flowerEvents}
        />

        <FlowerProgress progressCents={child.flowerProgressCents} thresholdCents={threshold} />

        <div>
          <p className={styles.selectorLabel}>{t('child.next_flower')}</p>
          <div className={styles.selectorRow}>
            {FLOWER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={[
                  styles.flowerOption,
                  child.currentFlowerType === type ? styles.flowerSelected : '',
                ].join(' ')}
                aria-pressed={child.currentFlowerType === type}
                onClick={() => setCurrentFlower(child.id, type)}
              >
                <FlowerIcon type={type} size={44} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.sideColumn}>
        {pendingCount > 0 && (
          <p className={styles.pendingCard}>
            {t('child.n_pending', { count: pendingCount })} — {t('child.pending_chore_status')}
          </p>
        )}

        <div className={styles.balanceCard}>
          <p className={styles.balanceLabel}>{t('child.growing_label')}</p>
          <MoneyAmount cents={ledger.unpaidBalanceCents} className={styles.balanceAmount} />
          <Button
            fullWidth
            onClick={() => (payoutLockedReason ? setShowLockedPopup(true) : navigate('/child/money'))}
          >
            {t('child.request_payout')}
          </Button>
        </div>
      </div>

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
    </div>
  );
};
