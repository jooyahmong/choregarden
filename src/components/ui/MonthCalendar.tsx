import styles from './MonthCalendar.module.css';

interface MonthCalendarProps {
  /** Any date within the month to display. */
  viewMonth: Date;
  selectedDate: Date | null;
  /** 'YYYY-MM-DD' keys for days that have at least one transaction. */
  markedDates: Set<string>;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (delta: -1 | 1) => void;
  locale: string;
}

export const dateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (a: Date, b: Date): boolean => dateKey(a) === dateKey(b);

export const MonthCalendar = ({
  viewMonth,
  selectedDate,
  markedDates,
  onSelectDate,
  onChangeMonth,
  locale,
}: MonthCalendarProps) => {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const ref = new Date(2024, 0, 7 + i); // a known Sunday-start week
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(ref);
  });

  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(firstOfMonth);

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button type="button" className={styles.navButton} onClick={() => onChangeMonth(-1)} aria-label="prev">
          ‹
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button type="button" className={styles.navButton} onClick={() => onChangeMonth(1)} aria-label="next">
          ›
        </button>
      </div>

      <div className={styles.weekdayRow}>
        {weekdayLabels.map((label, i) => (
          <span key={i} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((date, i) =>
          date ? (
            <button
              key={i}
              type="button"
              className={[
                styles.day,
                isSameDay(date, today) ? styles.today : '',
                selectedDate && isSameDay(date, selectedDate) ? styles.selected : '',
              ].join(' ')}
              onClick={() => onSelectDate(date)}
            >
              {date.getDate()}
              {markedDates.has(dateKey(date)) && <span className={styles.dot} />}
            </button>
          ) : (
            <span key={i} className={styles.emptyCell} />
          )
        )}
      </div>
    </div>
  );
};
