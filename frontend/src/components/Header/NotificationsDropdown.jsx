import React, { useRef, useEffect, useCallback } from 'react';
import { Bell, Book, Crown, Headset, Info, CheckCircle } from 'lucide-react';
import styles from './Header.module.css';

/* Notification item type reference
{
  id: string,
  type: 'subscription' | 'handout' | 'question' | 'system' | 'support',
  title: string,
  message: string,
  createdAt: string (ISO),
  read: boolean,
  link?: { href: string, label?: string }
}
*/

const typeIconMap = {
  subscription: Crown,
  handout: Book,
  question: Info,
  system: Info,
  support: Headset,
  default: Bell,
};

function relativeTime(iso) {
  try {
    const d = new Date(iso).getTime();
    const now = Date.now();
    let diff = Math.max(0, now - d);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'لحظاتی قبل';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} روز پیش`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} هفته پیش`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ماه پیش`;
    const years = Math.floor(days / 365);
    return `${years} سال پیش`;
  } catch {
    return '';
  }
}

const NotificationsDropdown = ({
  notifications = [],
  onClose,
  anchorRef,
  markAllRead,
  markRead,
  onItemClick,
}) => {
  const panelRef = useRef(null);

  // Close on outside click / ESC
  useEffect(() => {
    const handleClick = (e) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return; // clicking the bell shouldn't close before toggle handler runs
      onClose?.();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, anchorRef]);

  const handleItem = useCallback((n) => {
    if (!n.read) markRead?.(n.id);
    if (n.link?.href) onItemClick?.(n);
  }, [markRead, onItemClick]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div ref={panelRef} className={styles.notificationsDropdown} role="menu" aria-label="اعلان‌ها">
      <div className={styles.notificationsHeader}>
        <span>اعلان‌ها</span>
        <div className={styles.notificationsHeaderActions}>
          {unreadCount > 0 && (
            <button className={styles.linkBtn} onClick={markAllRead}>علامت خوانده شد همه</button>
          )}
          <button className={styles.iconQuietBtn} aria-label="بستن" onClick={onClose}>×</button>
        </div>
      </div>
      <div className={styles.notificationsList}>
        {notifications.length === 0 && (
          <div className={styles.notificationsEmpty}>اعلانی وجود ندارد.</div>
        )}
        {notifications.map(n => {
          const Icon = typeIconMap[n.type] || typeIconMap.default;
          return (
            <div
              key={n.id}
              className={`${styles.notificationItem} ${!n.read ? styles.unread : ''}`}
              tabIndex={0}
              role="menuitem"
              onClick={() => handleItem(n)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItem(n); } }}
            >
              <div className={styles.notificationIconWrap} aria-hidden>
                <Icon size={16} />
                {!n.read && <span className={styles.unreadDot} />}
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationTitleRow}>
                  <span className={styles.notificationTitle}>{n.title}</span>
                </div>
                <div className={styles.notificationMessage}>{n.message}</div>
                <div className={styles.notificationMeta}>{relativeTime(n.createdAt)}</div>
              </div>
              {n.read && <CheckCircle size={14} className={styles.readCheck} aria-label="خوانده شده" />}
            </div>
          );
        })}
      </div>
      <div className={styles.notificationsFooter}>
        <button className={styles.linkBtn} onClick={() => alert('صفحه همه اعلان‌ها (آینده)')}>نمایش همه</button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
