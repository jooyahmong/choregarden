import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChild } from '../../hooks/useChild';
import { useFamily } from '../../contexts/FamilyContext';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { updateChildSettings, resetChildPin } from '../../lib/childActions';
import type { PayoutRule } from '../../types/models';
import styles from './ParentChildDetailPage.module.css';

const PAYOUT_RULES: PayoutRule[] = ['anytime', 'weekly_friday', 'on_bloom', 'at_amount'];

export const ParentChildDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const { child } = useChild(childId ?? null);
  const { family } = useFamily();

  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [payoutRule, setPayoutRule] = useState<PayoutRule>('anytime');
  const [payoutThreshold, setPayoutThreshold] = useState('');
  const [pinResetOpen, setPinResetOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (child) {
      setName(child.name);
      setRate((child.hourlyRateCents / 100).toString());
      setPayoutRule(child.payoutRule);
      setPayoutThreshold(child.payoutThresholdCents > 0 ? (child.payoutThresholdCents / 100).toString() : '');
    }
  }, [child]);

  if (!child) return null;

  const thresholdValue = Number(payoutThreshold);
  const thresholdValid = payoutRule !== 'at_amount' || (Number.isFinite(thresholdValue) && thresholdValue > 0);

  const handleSave = async () => {
    const rateValue = Number(rate);
    if (!name.trim() || !Number.isFinite(rateValue) || rateValue <= 0 || !thresholdValid) return;
    setSaving(true);
    try {
      await updateChildSettings(child.id, {
        name: name.trim(),
        hourlyRateCents: Math.round(rateValue * 100),
        payoutRule,
        payoutThresholdCents: payoutRule === 'at_amount' ? Math.round(thresholdValue * 100) : 0,
      });
      navigate('/parent/children');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async () => {
    if (newPin.length !== 4) return;
    await resetChildPin(child.id, newPin);
    setPinResetOpen(false);
    setNewPin('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/parent/children')}
          aria-label={t('common.back')}
        >
          ←
        </button>
        <h1 className={styles.title}>{t('parent.child_settings_title', { name: child.name })}</h1>
      </div>

      <Field label={t('auth.child_name')} value={name} onChange={setName} required />

      <div>
        <div className={styles.rateRow}>
          <Field label={t('auth.hourly_rate')} type="number" value={rate} onChange={setRate} min="0" step="0.01" />
          <span>{family?.currencyCode}</span>
        </div>
        <p className={styles.note}>{t('parent.rate_change_note')}</p>
      </div>

      <div>
        <p>{t('parent.payout_requests')}</p>
        <div className={styles.radioGroup}>
          {PAYOUT_RULES.map((rule) => (
            <label key={rule} className={styles.radioOption}>
              <input
                type="radio"
                checked={payoutRule === rule}
                onChange={() => setPayoutRule(rule)}
              />
              {t(`parent.rule_${rule}`)}
            </label>
          ))}
        </div>
        {payoutRule === 'at_amount' && (
          <div className={styles.rateRow}>
            <Field
              label={t('parent.payout_threshold_label')}
              type="number"
              value={payoutThreshold}
              onChange={setPayoutThreshold}
              min="0"
              step="0.01"
              error={!thresholdValid ? t('common.error') : undefined}
            />
            <span>{family?.currencyCode}</span>
          </div>
        )}
      </div>

      <div>
        <p>{t('auth.child_pin')}</p>
        {pinResetOpen ? (
          <div className={styles.pinRow}>
            <Field
              label={t('parent.new_pin')}
              type="pin"
              value={newPin}
              onChange={(v) => setNewPin(v.replace(/\D/g, ''))}
            />
            <Button onClick={handleResetPin}>{t('common.save')}</Button>
            <Button variant="outline" onClick={() => setPinResetOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setPinResetOpen(true)}>
            {t('parent.reset_pin')}
          </Button>
        )}
      </div>

      <Button fullWidth disabled={saving || !name.trim() || !thresholdValid} onClick={handleSave}>
        {t('parent.save_changes')}
      </Button>
    </div>
  );
};
