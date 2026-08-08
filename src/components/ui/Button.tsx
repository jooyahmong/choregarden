import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={[styles.button, styles[variant], fullWidth ? styles.fullWidth : '', className]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  />
);
