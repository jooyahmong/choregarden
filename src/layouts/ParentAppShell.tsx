import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useFamilyChildren } from '../hooks/useFamilyChildren';
import { useFamilyLedger } from '../hooks/useFamilyLedger';
import { PendingRequestsModal } from '../components/parent/PendingRequestsModal';
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
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = user?.familyId ?? null;
  const { children } = useFamilyChildren(familyId);
  const ledger = useFamilyLedger(familyId);

  // Shown once per app load/login — dismissing it just hides it for the rest
  // of this session, it doesn't mark the underlying requests as seen.
  const [dismissed, setDismissed] = useState(false);

  const pendingChores = ledger.choreRequests.filter((c) => c.status === 'pending');
  const pendingPayouts = ledger.payoutRequests.filter((p) => p.status === 'requested');
  const hasPending = pendingChores.length > 0 || pendingPayouts.length > 0;

  const childNameById = useMemo(
    () => Object.fromEntries(children.map((c) => [c.id, c.name])),
    [children]
  );

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
      {hasPending && !dismissed && (
        <PendingRequestsModal
          choreRequests={pendingChores}
          payoutRequests={pendingPayouts}
          childNameById={childNameById}
          onClose={() => setDismissed(true)}
        />
      )}
    </>
  );
};
