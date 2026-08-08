import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector/LanguageSelector';
import logo from '../assets/logo.png';
import styles from './AppShell.module.css';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NavList = ({ items, className }: { items: NavItem[]; className?: string }) => (
  <nav className={className}>
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
        }
      >
        {item.icon}
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

export const AppShell = ({ navItems, displayName }: { navItems: NavItem[]; displayName: string }) => {
  const { t } = useTranslation();
  const { signOutCurrent } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={navItems[0].to} className={styles.brandLink}>
            <img src={logo} alt={t('common.app_name')} className={styles.brandLogo} />
          </Link>
          <div className={styles.userMenuWrap}>
            <button
              type="button"
              className={styles.userButton}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
            >
              {displayName} ▾
            </button>
            {menuOpen && (
              <div className={styles.menu}>
                <LanguageSelector />
                <button
                  type="button"
                  className={styles.userButton}
                  onClick={() => signOutCurrent()}
                >
                  {t('parent.sign_out')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <div className={styles.bottomNavBar}>
        <NavList items={navItems} className={styles.bottomNav} />
      </div>
    </div>
  );
};
