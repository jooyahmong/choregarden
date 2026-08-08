import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useFamilyChildren } from '../../hooks/useFamilyChildren';
import { MoneyAmount } from '../../components/ui/MoneyAmount';
import { Button } from '../../components/ui/Button';
import styles from './ParentChildrenPage.module.css';

export const ParentChildrenPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = user?.familyId ?? null;
  const { children } = useFamilyChildren(familyId);
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);

  const copyLoginInfo = async (childId: string, childName: string, pin: string) => {
    if (!family) return;
    const text = [
      `${t('common.app_name')} - ${window.location.origin}`,
      `${t('auth.family_code')}: ${family.familyCode}`,
      `${t('auth.child_pin')} (${childName}): ${pin}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedChildId(childId);
    setTimeout(() => setCopiedChildId(null), 2000);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('parent.children_title')}</h1>

      {family && (
        <div className={styles.codeBox}>
          <div>
            <div>{t('parent.family_code_label')}</div>
            <div className={styles.codeValue}>{family.familyCode}</div>
          </div>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => navigator.clipboard.writeText(family.familyCode)}
          >
            {t('parent.copy')}
          </button>
        </div>
      )}

      {children.map((child) => (
        <div key={child.id} className={styles.childRow}>
          <div className={styles.nameRateRow}>
            <span>{child.name}</span>
            <span className={styles.childMeta}>
              <MoneyAmount cents={child.hourlyRateCents} />/hr
            </span>
          </div>
          <div className={styles.actionsRow}>
            <Button
              variant="outline"
              fullWidth
              className={styles.smallActionButton}
              onClick={() => copyLoginInfo(child.id, child.name, child.pin)}
            >
              {copiedChildId === child.id ? t('parent.copied') : t('parent.copy_login_info')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              className={styles.smallActionButton}
              onClick={() => navigate(`/parent/children/${child.id}`)}
            >
              {t('common.edit')}
            </Button>
          </div>
        </div>
      ))}

      <Button fullWidth onClick={() => navigate('/parent/children/add')}>
        + {t('parent.add_child')}
      </Button>
    </div>
  );
};
