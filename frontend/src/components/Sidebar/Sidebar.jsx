import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import { Book, Receipt, Headset, Ticket, Bell, LogOut, ChevronDown } from 'lucide-react';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    className={`${styles.navItem} ${active ? styles.active : ''}`}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
  >
    <span className={styles.label}>{label}</span>
    <Icon className={styles.icon} size={18} />
  </button>
);

const Sidebar = ({ user = {}, active = 'courses', onNavigate = () => {}, onLogout = () => {} }) => {
  const [manageOpen, setManageOpen] = useState(true);
  const tokens = user?.tokenCount ?? 0;

  return (
    <aside className={styles.sidebar} aria-label="User sidebar">
      <div className={styles.profileSection}>
        <div className={styles.profileRow}>
          <div className={styles.avatarWrap}>
            {user?.avatar ? (
              <img src={user.avatar} alt="آواتار" className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}></div>
            )}
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.name}>{user?.name || 'کاربر'}</div>
            <div className={styles.userRole}>{user?.role || 'کاربر'}</div>
          </div>

          <div className={styles.themeToggle}>
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <nav className={styles.navSection}>
        <div className={styles.categoryHead}>
          <span className={styles.categoryTitle}>مدیریت</span>
          <button className={styles.collapseBtn} onClick={() => setManageOpen(v => !v)} aria-expanded={manageOpen}>
            <ChevronDown size={16} className={`${styles.collapseIcon} ${manageOpen ? styles.open : ''}`} />
          </button>
        </div>

        {manageOpen && (
          <div className={styles.group}>
            <NavItem icon={Book} label="دوره‌های من" active={active === 'courses'} onClick={() => onNavigate('courses')} />
            <NavItem icon={Receipt} label="مالی" active={active === 'billing'} onClick={() => onNavigate('billing')} />
            <NavItem icon={Headset} label="پشتیبانی" active={active === 'support'} onClick={() => onNavigate('support')} />
          </div>
        )}
      </nav>

      <div className={styles.flexGrow} />

      <div className={styles.bottomSection}>
        <div className={styles.tokenPill}>
          <Bell className={styles.pillIcon} size={16} />
          <div className={styles.pillValue}>{tokens.toLocaleString('fa-IR')}</div>
          <Ticket className={styles.pillIcon} size={16} />
        </div>

        <button className={styles.logoutBtn} onClick={onLogout}>
          <span className={styles.logoutLabel}>خروج</span>
          <LogOut className={styles.logoutIcon} size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
