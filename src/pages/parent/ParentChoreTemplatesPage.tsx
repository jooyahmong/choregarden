import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useChoreTemplates } from '../../hooks/useChoreTemplates';
import { ChoreIcon, type ChoreIconKey } from '../../components/icons/ChoreIcon';
import { Button } from '../../components/ui/Button';
import {
  createChoreTemplate,
  deleteChoreTemplate,
  reorderChoreTemplates,
  updateChoreTemplate,
} from '../../lib/choreTemplateActions';
import { resolveTemplateLabel } from '../../lib/choreLabel';
import styles from './ParentChoreTemplatesPage.module.css';

const ICON_CHOICES: ChoreIconKey[] = ['bed', 'dishes', 'toybox', 'trash', 'pet', 'laundry'];

export const ParentChoreTemplatesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const familyId = user?.familyId ?? null;
  const { templates } = useChoreTemplates(familyId, false);

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState<ChoreIconKey>('bed');

  const handleAdd = async () => {
    if (!familyId || !newLabel.trim()) return;
    await createChoreTemplate(familyId, newLabel.trim(), newIcon, templates.length);
    setNewLabel('');
    setNewIcon('bed');
    setAdding(false);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= templates.length) return;
    const reordered = [...templates];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderChoreTemplates(reordered.map((tpl) => tpl.id));
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
        <h1 className={styles.title}>{t('parent.chore_templates_title')}</h1>
      </div>

      {templates.map((template, index) => (
        <div key={template.id} className={styles.row}>
          <div className={styles.reorderCol}>
            <button type="button" className={styles.reorderButton} onClick={() => move(index, -1)} aria-label="up">
              ▲
            </button>
            <button type="button" className={styles.reorderButton} onClick={() => move(index, 1)} aria-label="down">
              ▼
            </button>
          </div>
          <ChoreIcon icon={template.icon} />
          <div className={styles.rowMain}>{resolveTemplateLabel(template, t)}</div>
          <label>
            <input
              type="checkbox"
              checked={template.active}
              onChange={(e) => updateChoreTemplate(template.id, { active: e.target.checked })}
            />{' '}
            {t('parent.active')}
          </label>
          <button type="button" onClick={() => deleteChoreTemplate(template.id)} aria-label={t('common.delete')}>
            ✕
          </button>
        </div>
      ))}

      {adding ? (
        <div className={styles.addForm}>
          <div className={styles.iconPicker}>
            {ICON_CHOICES.map((icon) => (
              <button
                key={icon}
                type="button"
                className={[styles.iconOption, newIcon === icon ? styles.iconOptionActive : ''].join(' ')}
                onClick={() => setNewIcon(icon)}
              >
                <ChoreIcon icon={icon} size={26} />
              </button>
            ))}
          </div>
          <div className={styles.addFormRow}>
            <input
              className={styles.labelInput}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t('parent.chore_templates_title')}
            />
            <Button onClick={handleAdd}>{t('common.add')}</Button>
          </div>
        </div>
      ) : (
        <Button fullWidth variant="outline" onClick={() => setAdding(true)}>
          + {t('parent.add_chore')}
        </Button>
      )}

      <p className={styles.note}>{t('parent.templates_note')}</p>
    </div>
  );
};
