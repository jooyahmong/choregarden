import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useFamilyChildren } from '../hooks/useFamilyChildren';
import { useFamilyLedger } from '../hooks/useFamilyLedger';
import { syncPushRegistration } from '../lib/pushNotifications';
import { ParentRequestBanner, type ParentRequestNotice } from '../components/parent/ParentRequestBanner';
import { AppShell, type NavItem } from './AppShell';
import {
  GardenNavIcon,
  ChoresNavIcon,
  MoneyNavIcon,
  ChildrenNavIcon,
  SettingsNavIcon,
} from '../components/icons/NavIcons';

export const ParentAppShell = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = user?.familyId ?? null;
  const { children, loading: childrenLoading } = useFamilyChildren(familyId);
  const ledger = useFamilyLedger(familyId);

  const [notices, setNotices] = useState<ParentRequestNotice[]>([]);
  const knownRequestIds = useRef(new Set<string>());
  const initialized = useRef(false);
  const directRequestId = new URLSearchParams(location.search).get('requestId');

  const childNameById = useMemo(
    () => Object.fromEntries(children.map((c) => [c.id, c.name])),
    [children]
  );

  useEffect(() => {
    if (user?.type === 'parent') void syncPushRegistration(user.uid).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (ledger.loading || childrenLoading) return;
    const pending: ParentRequestNotice[] = [
      ...ledger.choreRequests.filter((request) => request.status === 'pending').map((request) => ({ type: 'chore' as const, request, childName: childNameById[request.childId] ?? '' })),
      ...ledger.payoutRequests.filter((request) => request.status === 'requested').map((request) => ({ type: 'payout' as const, request, childName: childNameById[request.childId] ?? '' })),
    ];
    if (!initialized.current) {
      pending.forEach((notice) => knownRequestIds.current.add(`${notice.type}:${notice.request.id}`));
      initialized.current = true;
      return;
    }
    const newNotices = pending.filter((notice) => {
      const key = `${notice.type}:${notice.request.id}`;
      if (knownRequestIds.current.has(key)) return false;
      knownRequestIds.current.add(key);
      return notice.request.id !== directRequestId;
    });
    if (newNotices.length) setNotices((current) => [...current, ...newNotices]);
  }, [childNameById, childrenLoading, directRequestId, ledger.choreRequests, ledger.loading, ledger.payoutRequests]);

  useEffect(() => {
    if (directRequestId) setNotices((current) => current.filter((notice) => notice.request.id !== directRequestId));
  }, [directRequestId]);

  const currentNotice = notices[0];
  const dismissNotice = () => setNotices((current) => current.slice(1));
  const viewNotice = () => {
    if (!currentNotice) return;
    navigate(currentNotice.type === 'chore' ? `/parent/chores?requestId=${encodeURIComponent(currentNotice.request.id)}` : `/parent/money?requestId=${encodeURIComponent(currentNotice.request.id)}`);
    dismissNotice();
  };

  const navItems: NavItem[] = [
    { to: '/parent/garden', label: t('nav.garden'), icon: <GardenNavIcon /> },
    { to: '/parent/chores', label: t('nav.approvals'), icon: <ChoresNavIcon /> },
    { to: '/parent/money', label: t('nav.money'), icon: <MoneyNavIcon /> },
    { to: '/parent/children', label: t('nav.children'), icon: <ChildrenNavIcon /> },
    { to: '/parent/settings', label: t('nav.settings'), icon: <SettingsNavIcon /> },
  ];

  const displayName = family?.name || (user?.type === 'parent' ? user.email : '');

  return (
    <>
      <AppShell navItems={navItems} displayName={displayName} />
      {currentNotice && <ParentRequestBanner notice={currentNotice} onView={viewNotice} onClose={dismissNotice} />}
    </>
  );
};
