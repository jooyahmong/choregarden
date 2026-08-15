import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { disablePushNotifications, enablePushNotifications, getPushState, type PushKind, type PushState } from '../../lib/pushNotifications';
import styles from '../../pages/parent/ParentSettingsPage.module.css';

export const PushNotificationControl = ({ parentUid, kind, disabled, onBusyChange }: { parentUid: string; kind: PushKind; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<PushState>('default');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => getPushState(parentUid, kind).then(setState).catch(() => setState('error')), [kind, parentUid]);
  useEffect(() => { void refresh(); }, [refresh]);
  const checked = state === 'enabled';
  const statusKey = state === 'denied' ? 'push_blocked' : state === 'unsupported' ? 'push_unsupported' : state === 'ios-install' ? 'push_ios_install' : state === 'not-configured' ? 'push_not_configured' : state === 'error' ? 'push_error' : busy ? 'push_processing' : '';
  const toggle = async () => { setBusy(true); onBusyChange?.(true); try { if (checked) { await disablePushNotifications(parentUid, kind); await refresh(); } else setState(await enablePushNotifications(parentUid, kind)); } finally { setBusy(false); onBusyChange?.(false); } };
  const label = kind === 'chore' ? t('settings.chore_requests_toggle') : t('settings.payout_requests_toggle');
  return <><div className={styles.toggleRow}><span>{label}</span><button type="button" role="switch" aria-checked={checked} aria-label={label} aria-describedby={statusKey ? `${kind}-push-status` : undefined} className={styles.switch} onClick={() => void toggle()} disabled={disabled || busy || state === 'denied' || state === 'unsupported' || state === 'ios-install' || state === 'not-configured'}><span className={styles.switchThumb} /></button></div>{statusKey && <p id={`${kind}-push-status`} className={styles.pushStatus}>{t(`settings.${statusKey}`)}</p>}</>;
};
