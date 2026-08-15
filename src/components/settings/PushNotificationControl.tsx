import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { disablePushNotifications, enablePushNotifications, getPushState, type PushState } from '../../lib/pushNotifications';

export const PushNotificationControl = ({ parentUid }: { parentUid: string }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<PushState>('default');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(
    () => getPushState(parentUid).then(setState).catch(() => setState('default')),
    [parentUid]
  );
  useEffect(() => { void refresh(); }, [refresh]);
  const enable = async () => { setBusy(true); try { setState(await enablePushNotifications(parentUid)); } finally { setBusy(false); } };
  const disable = async () => { setBusy(true); try { await disablePushNotifications(parentUid); await refresh(); } finally { setBusy(false); } };
  if (state === 'enabled') return <><p>{t('settings.push_enabled')}</p><Button variant="outline" disabled={busy} onClick={() => void disable()}>{t('settings.push_disable')}</Button></>;
  if (state === 'denied') return <p>{t('settings.push_blocked')}</p>;
  if (state === 'unsupported') return <p>{t('settings.push_unsupported')}</p>;
  if (state === 'ios-install') return <p>{t('settings.push_ios_install')}</p>;
  if (state === 'not-configured') return <p>{t('settings.push_not_configured')}</p>;
  return <Button disabled={busy} onClick={() => void enable()}>{t('settings.push_enable')}</Button>;
};
