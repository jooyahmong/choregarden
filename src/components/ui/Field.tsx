import { useId, useState, type InputHTMLAttributes } from 'react';
import styles from './Field.module.css';

type FieldType = 'text' | 'email' | 'password' | 'number' | 'pin';

interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  label: string;
  type?: FieldType;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    {!open && <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
  </svg>
);

export const Field = ({
  label,
  type = 'text',
  value,
  onChange,
  hint,
  error,
  id,
  ...rest
}: FieldProps) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [revealed, setRevealed] = useState(false);

  const isMaskable = type === 'password' || type === 'pin';
  const isPin = type === 'pin';
  // PINs use CSS-based masking instead of type="password" so browsers don't
  // treat a 4-digit child PIN as a real account credential worth offering to save.
  const resolvedType = isPin ? 'text' : isMaskable ? (revealed ? 'text' : 'password') : type;

  return (
    <div className={styles.group}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.inputRow}>
        <input
          // Some WebKit builds cache glyph masking per-character and only
          // repaint the most recently typed digit when `-webkit-text-security`
          // is toggled off/on via a class change, leaving stale masked/unmasked
          // digits behind. Remounting the node on toggle forces a clean repaint.
          key={isPin ? String(revealed) : undefined}
          id={inputId}
          className={[
            styles.input,
            isMaskable ? styles.hasToggle : '',
            isPin && !revealed ? styles.pinMasked : '',
          ].join(' ')}
          type={resolvedType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={isPin ? 'numeric' : rest.inputMode}
          maxLength={isPin ? 4 : rest.maxLength}
          autoComplete={isPin ? 'off' : rest.autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />
        {isMaskable && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? 'Hide' : 'Show'}
          >
            <EyeIcon open={revealed} />
          </button>
        )}
      </div>
      {hint && !error && (
        <span className={styles.hint} id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.error} id={`${inputId}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
