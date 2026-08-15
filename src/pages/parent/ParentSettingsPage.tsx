import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useFamilyLedger } from '../../hooks/useFamilyLedger';
import { LanguageSelector } from '../../components/LanguageSelector/LanguageSelector';
import { CurrencySelector } from '../../components/settings/CurrencySelector';
import { FiscalYearSelector } from '../../components/settings/FiscalYearSelector';
import { Button } from '../../components/ui/Button';
import { LegalModal, type LegalDocKey } from '../../components/legal/LegalModal';
import { PushNotificationControl } from '../../components/settings/PushNotificationControl';
import {
  updateFamilyCurrency,
  updateFamilyFiscalYearStartMonth,
  updateFamilyName,
  updateFamilyNotificationPref,
} from '../../lib/familyActions';
import type { CurrencyCode } from '../../utils/currencies';
import styles from './ParentSettingsPage.module.css';

export const ParentSettingsPage = () => {
  const { t } = useTranslation();
  const { user, signOutCurrent } = useAuth();
  const { family } = useFamily();
  const familyId = user?.familyId ?? null;
  const ledger = useFamilyLedger(familyId);
  const [openDoc, setOpenDoc] = useState<LegalDocKey | null>(null);
  const [familyNameInput, setFamilyNameInput] = useState('');

  useEffect(() => {
    if (family) setFamilyNameInput(family.name);
  }, [family?.name]);

  if (!family || user?.type !== 'parent') return null;

  const hasExistingData =
    ledger.choreRequests.some((c) => c.status === 'approved') ||
    ledger.payoutRequests.some((p) => p.status === 'paid');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.title')}</h1>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.account')}</p>
        <label className={styles.fieldLabel} htmlFor="family-name">
          {t('settings.family_name')}
        </label>
        <div className={styles.editRow}>
          <input
            id="family-name"
            className={styles.textInput}
            value={familyNameInput}
            onChange={(e) => setFamilyNameInput(e.target.value)}
          />
          <Button
            variant="outline"
            disabled={!familyNameInput.trim() || familyNameInput.trim() === family.name}
            onClick={() => updateFamilyName(family.id, familyNameInput.trim())}
          >
            {t('common.save')}
          </Button>
        </div>
        <div className={styles.infoRow}>
          <span>{t('settings.parent_email')}</span>
          <span>{user.email}</span>
        </div>
        <div className={styles.infoRow}>
          <span>{t('parent.family_code_label')}</span>
          <span>{family.familyCode}</span>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.language')}</p>
        <LanguageSelector />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.currency')}</p>
        <CurrencySelector
          value={family.currencyCode as CurrencyCode}
          onChange={(code) => updateFamilyCurrency(family.id, code)}
          hasExistingData={hasExistingData}
        />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.financial_year')}</p>
        <FiscalYearSelector
          value={family.fiscalYearStartMonth}
          onChange={(month) => updateFamilyFiscalYearStartMonth(family.id, month)}
        />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.notifications')}</p>
        <label className={styles.toggleRow}>
          {t('settings.chore_requests_toggle')}
          <input
            type="checkbox"
            checked={family.notifyChoreRequests}
            onChange={(e) => updateFamilyNotificationPref(family.id, 'notifyChoreRequests', e.target.checked)}
          />
        </label>
        <PushNotificationControl parentUid={user.uid} />
        <label className={styles.toggleRow}>
          {t('settings.payout_requests_toggle')}
          <input
            type="checkbox"
            checked={family.notifyPayoutRequests}
            onChange={(e) => updateFamilyNotificationPref(family.id, 'notifyPayoutRequests', e.target.checked)}
          />
        </label>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('settings.help')}</p>
        <button type="button" className={styles.linkRow} onClick={() => setOpenDoc('privacy')}>
          {t('common.privacy')}
        </button>
        <button type="button" className={styles.linkRow} onClick={() => setOpenDoc('terms')}>
          {t('common.terms')}
        </button>
      </div>

      <Button variant="danger" fullWidth onClick={() => signOutCurrent()}>
        {t('parent.sign_out')}
      </Button>

      {openDoc && <LegalModal doc={openDoc} onClose={() => setOpenDoc(null)} />}
    </div>
  );
};
