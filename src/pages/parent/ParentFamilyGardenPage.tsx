import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFamilyChildren } from '../../hooks/useFamilyChildren';
import { useFamilyLedger } from '../../hooks/useFamilyLedger';
import { GrowingFlower } from '../../components/icons/GrowingFlower';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { flowerThresholdCents } from '../../lib/money';
import groundImg from '../../assets/ground.svg';
import styles from './ParentFamilyGardenPage.module.css';

export const ParentFamilyGardenPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const familyId = user?.familyId ?? null;

  const { children } = useFamilyChildren(familyId);
  const ledger = useFamilyLedger(familyId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCountByChild = (childId: string) =>
    ledger.choreRequests.filter((c) => c.childId === childId && c.status === 'pending').length;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('parent.family_garden_title')}</h1>

      {children.length === 0 && <p className={styles.empty}>{t('parent.no_children_yet')}</p>}

      <div className={styles.grid}>
        {children.map((child) => {
          const progress = flowerThresholdCents(child.hourlyRateCents) > 0
            ? child.flowerProgressCents / flowerThresholdCents(child.hourlyRateCents)
            : 0;
          const unpaid = ledger.unpaidBalanceCentsByChild[child.id] ?? 0;
          const pending = pendingCountByChild(child.id);
          const expanded = expandedId === child.id;

          return (
            <div
              key={child.id}
              className={styles.plot}
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(expanded ? null : child.id)}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedId(expanded ? null : child.id)}
            >
              <div className={styles.groundWrap}>
                <div className={styles.flowerLayer}>
                  <GrowingFlower type={child.currentFlowerType} progress={progress} size={72} />
                </div>
                <img src={groundImg} alt="" className={styles.ground} />
              </div>
              <div className={styles.name}>{child.name}</div>
              <div className={styles.balance}>
                {t('child.growing_label')}: <MoneyAmount cents={unpaid} />
              </div>
              {pending > 0 && (
                <button
                  type="button"
                  className={styles.pendingChip}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/parent/chores', { state: { childId: child.id } });
                  }}
                >
                  {t('parent.n_waiting', { count: pending })}
                </button>
              )}

              {expanded && (
                <div className={styles.detail}>
                  <span>
                    {t('auth.hourly_rate')}: <MoneyAmount cents={child.hourlyRateCents} />/hr · {t('parent.unpaid')}:{' '}
                    <MoneyAmount cents={unpaid} />
                  </span>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/parent/children/${child.id}`);
                    }}
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
