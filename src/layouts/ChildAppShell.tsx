import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useChildLedger } from '../hooks/useChildLedger';
import { ChildResultsModal } from '../components/child/ChildResultsModal';
import { AppShell, type NavItem } from './AppShell';
import { GardenNavIcon, ChoresNavIcon, MoneyNavIcon, BookNavIcon } from '../components/icons/NavIcons';

const seenKey = (childId: string) => `mg_seen_chore_results_${childId}`;

const loadSeenIds = (childId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(seenKey(childId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

export const ChildAppShell = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const childId = user?.type === 'child' ? user.childId : null;
  const ledger = useChildLedger(childId);

  const [dismissed, setDismissed] = useState(false);
  const [seenIds] = useState(() => (childId ? loadSeenIds(childId) : new Set<string>()));

  const newChoreResults = ledger.choreRequests.filter(
    (c) => (c.status === 'approved' || c.status === 'declined') && !seenIds.has(`chore:${c.id}`)
  );
  const newPayoutResults = ledger.payoutRequests.filter(
    (p) => (p.status === 'paid' || p.status === 'declined') && !seenIds.has(`payout:${p.id}`)
  );
  const hasNewResults = newChoreResults.length > 0 || newPayoutResults.length > 0;

  const navItems: NavItem[] = [
    { to: '/child/garden', label: t('nav.garden'), icon: <GardenNavIcon /> },
    { to: '/child/chores', label: t('nav.chores'), icon: <ChoresNavIcon /> },
    { to: '/child/money', label: t('nav.money'), icon: <MoneyNavIcon /> },
    { to: '/child/book', label: t('nav.book'), icon: <BookNavIcon /> },
  ];

  const displayName = user?.type === 'child' ? user.name : '';

  const handleClose = () => {
    if (childId) {
      const merged = new Set(seenIds);
      newChoreResults.forEach((c) => merged.add(`chore:${c.id}`));
      newPayoutResults.forEach((p) => merged.add(`payout:${p.id}`));
      localStorage.setItem(seenKey(childId), JSON.stringify(Array.from(merged)));
    }
    setDismissed(true);
  };

  return (
    <>
      <AppShell navItems={navItems} displayName={displayName} />
      {hasNewResults && !dismissed && (
        <ChildResultsModal chores={newChoreResults} payouts={newPayoutResults} onClose={handleClose} />
      )}
    </>
  );
};
