import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { FlowerIcon } from '../../components/icons/FlowerIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { db } from '../../lib/firebase';
import type { FlowerType } from '../../types/models';
import formStyles from '../auth/AuthForm.module.css';
import styles from './AddChildPage.module.css';

const FLOWER_TYPES: FlowerType[] = ['tulip', 'sunflower', 'daisy', 'lavender'];

export const AddChildPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { family } = useFamily();

  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [pin, setPin] = useState('');
  const [flower, setFlower] = useState<FlowerType>('tulip');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const familyId = user?.familyId;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const rateValue = Number(rate);
    if (!name.trim() || !Number.isFinite(rateValue) || rateValue <= 0 || pin.length !== 4) {
      setError(t('common.error'));
      return;
    }
    if (!familyId) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'children'), {
        familyId,
        name: name.trim(),
        hourlyRateCents: Math.round(rateValue * 100),
        pin,
        currentFlowerType: flower,
        flowerProgressCents: 0,
        payoutRule: 'anytime',
        payoutThresholdCents: 0,
        active: true,
        createdAt: Timestamp.now(),
      });
      navigate('/parent/garden', { replace: true });
    } catch {
      setError(t('common.error'));
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <h1 className={formStyles.title}>{t('auth.add_child_title')}</h1>

        {family && (
          <div className={styles.codeBox}>
            <p className={styles.codeLabel}>{t('auth.family_code')}</p>
            <p className={styles.codeValue}>{family.familyCode}</p>
          </div>
        )}

        <Field
          label={t('auth.child_name')}
          value={name}
          onChange={setName}
          placeholder={t('auth.child_name_placeholder')}
          required
        />

        <div className={styles.rateRow}>
          <Field
            label={t('auth.hourly_rate')}
            type="number"
            value={rate}
            onChange={setRate}
            min="0"
            step="0.01"
            required
          />
          <span>{family?.currencyCode}</span>
        </div>

        <Field
          label={t('auth.child_pin')}
          type="pin"
          value={pin}
          onChange={(value) => setPin(value.replace(/\D/g, ''))}
          hint={t('auth.child_pin_hint')}
          required
        />

        <div>
          <label>{t('auth.first_flower')}</label>
          <div className={styles.flowerGrid}>
            {FLOWER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={[styles.flowerOption, flower === type ? styles.flowerSelected : ''].join(
                  ' '
                )}
                aria-pressed={flower === type}
                onClick={() => setFlower(type)}
              >
                <FlowerIcon type={type} size={40} />
              </button>
            ))}
          </div>
        </div>

        {error && <p className={formStyles.formError}>{error}</p>}

        <Button type="submit" fullWidth disabled={submitting}>
          {t('auth.add_child_button', { name: name || '' })}
        </Button>

        <Button variant="ghost" fullWidth onClick={() => navigate('/parent/garden')}>
          {t('auth.ill_do_later')}
        </Button>
      </form>
    </div>
  );
};
