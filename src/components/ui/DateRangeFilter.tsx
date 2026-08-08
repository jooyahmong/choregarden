import styles from './DateRangeFilter.module.css';

interface DateRangeFilterProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function DateRangeFilter<T extends string>({ options, value, onChange }: DateRangeFilterProps<T>) {
  return (
    <div className={styles.row}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[styles.tab, value === option.value ? styles.active : ''].join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
