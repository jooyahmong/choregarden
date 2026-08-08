import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { MonthCalendar } from './MonthCalendar';
import { getFiscalYearLabel } from '../../utils/formatting';
import styles from './PeriodPickerModal.module.css';

export type Period = 'day' | 'week' | 'month' | 'year' | 'fiscal_year';

interface PeriodPickerModalProps {
  period: Period;
  selectedDate: Date;
  calendarMonth: Date;
  markedDates: Set<string>;
  fiscalYearStartMonth: number;
  locale: string;
  onSelect: (date: Date) => void;
  onChangeMonth: (delta: -1 | 1) => void;
  onClose: () => void;
}

const mondayOf = (date: Date): Date => {
  const weekday = date.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const PeriodPickerModal = ({
  period,
  selectedDate,
  calendarMonth,
  markedDates,
  fiscalYearStartMonth,
  locale,
  onSelect,
  onChangeMonth,
  onClose,
}: PeriodPickerModalProps) => {
  const { t } = useTranslation();

  if (period === 'day') {
    return (
      <Modal title={t('child.filter_day')} onClose={onClose}>
        <MonthCalendar
          viewMonth={calendarMonth}
          selectedDate={selectedDate}
          markedDates={markedDates}
          onSelectDate={(date) => {
            onSelect(date);
            onClose();
          }}
          onChangeMonth={onChangeMonth}
          locale={locale}
        />
      </Modal>
    );
  }

  if (period === 'week') {
    const thisMonday = mondayOf(new Date());
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - i * 7);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      return { start, end };
    });
    const selectedMonday = mondayOf(selectedDate);

    return (
      <Modal title={t('child.filter_week')} onClose={onClose}>
        <div className={styles.list}>
          {weeks.map(({ start, end }) => (
            <button
              key={start.toISOString()}
              type="button"
              className={[styles.row, isSameDay(start, selectedMonday) ? styles.rowActive : ''].join(' ')}
              onClick={() => {
                onSelect(start);
                onClose();
              }}
            >
              {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(start)}
              {' – '}
              {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  if (period === 'month') {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1));

    return (
      <Modal title={t('child.filter_month')} onClose={onClose}>
        <div className={styles.list}>
          {months.map((m) => (
            <button
              key={m.toISOString()}
              type="button"
              className={[
                styles.row,
                m.getFullYear() === selectedDate.getFullYear() && m.getMonth() === selectedDate.getMonth()
                  ? styles.rowActive
                  : '',
              ].join(' ')}
              onClick={() => {
                onSelect(m);
                onClose();
              }}
            >
              {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(m)}
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  if (period === 'year') {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

    return (
      <Modal title={t('child.filter_year')} onClose={onClose}>
        <div className={styles.list}>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={[styles.row, y === selectedDate.getFullYear() ? styles.rowActive : ''].join(' ')}
              onClick={() => {
                onSelect(new Date(y, selectedDate.getMonth(), 1));
                onClose();
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  // fiscal_year
  const now = new Date();
  const currentLabel = getFiscalYearLabel(now, fiscalYearStartMonth);
  const selectedLabel = getFiscalYearLabel(selectedDate, fiscalYearStartMonth);
  const labels = Array.from({ length: 6 }, (_, i) => currentLabel - i);

  return (
    <Modal title={t('child.filter_fiscal_year')} onClose={onClose}>
      <div className={styles.list}>
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            className={[styles.row, label === selectedLabel ? styles.rowActive : ''].join(' ')}
            onClick={() => {
              // Any date that falls inside that fiscal year works as the anchor.
              const anchorMonth = fiscalYearStartMonth === 1 ? 0 : fiscalYearStartMonth - 1;
              const anchorYear = fiscalYearStartMonth === 1 ? label : label - 1;
              onSelect(new Date(anchorYear, anchorMonth, 15));
              onClose();
            }}
          >
            {t('settings.financial_year')} {label}
          </button>
        ))}
      </div>
    </Modal>
  );
};
