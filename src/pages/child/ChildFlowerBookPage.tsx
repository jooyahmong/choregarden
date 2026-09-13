import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useChild } from '../../hooks/useChild';
import { useChildLedger } from '../../hooks/useChildLedger';
import { FlowerIcon } from '../../components/icons/FlowerIcon';
import { GrowingFlower } from '../../components/icons/GrowingFlower';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { flowerThresholdCents } from '../../lib/money';
import type { FlowerType } from '../../types/models';
import styles from './ChildFlowerBookPage.module.css';

type Filter = 'all' | FlowerType;

const PAGE_SIZE = 12;

export const ChildFlowerBookPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const childId = user?.type === 'child' ? user.childId : null;
  const { child } = useChild(childId);
  const ledger = useChildLedger(childId);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const filtered =
    filter === 'all' ? ledger.flowerEvents : ledger.flowerEvents.filter((f) => f.flowerType === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedFlowers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const isLastPage = currentPage === totalPages;

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };

  const progress =
    child && child.hourlyRateCents > 0
      ? child.flowerProgressCents / flowerThresholdCents(child.hourlyRateCents)
      : 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('child.flower_book_title')}</h1>
      <p className={styles.subtitle}>{t('child.flower_book_subtitle')}</p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{ledger.flowerEvents.length}</div>
          <div className={styles.cellLabel}>{t('child.flowers_count')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            <MoneyAmount cents={ledger.lifetimeEarnedCents} />
          </div>
          <div className={styles.cellLabel}>{t('child.earned_label')}</div>
        </div>
      </div>

      <div className={styles.filterRow}>
        {(['all', 'tulip', 'sunflower', 'daisy', 'lavender'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={[styles.filterTab, filter === f ? styles.filterTabActive : ''].join(' ')}
            onClick={() => changeFilter(f)}
          >
            {f === 'all' ? t('child.filter_all') : t(`flowers.${f}`)}
          </button>
        ))}
      </div>

      <div className={styles.flipViewport}>
        <div
          key={`${filter}-${currentPage}`}
          className={[styles.grid, direction === 'next' ? styles.flipNext : styles.flipPrev].join(' ')}
        >
          {pagedFlowers.map((flower) => (
            <div key={flower.id} className={styles.cell}>
              <FlowerIcon type={flower.flowerType} size={48} />
            </div>
          ))}
          {filter === 'all' && child && isLastPage && (
            <div className={[styles.cell, styles.growingCell].join(' ')}>
              <GrowingFlower type={child.currentFlowerType} progress={progress} size={48} />
              <span className={styles.cellLabel}>{t('child.growing_badge')}</span>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={currentPage <= 1}
            onClick={() => {
              setDirection('prev');
              setPage((p) => Math.max(1, p - 1));
            }}
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
            onClick={() => {
              setDirection('next');
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            aria-label="next"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};
