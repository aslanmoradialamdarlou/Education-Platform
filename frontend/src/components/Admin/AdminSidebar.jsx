import React from 'react';
import { LayoutDashboard, Users, FileText, Video, BookOpen, Tag, Settings, LifeBuoy, X, Newspaper, FileQuestion } from 'lucide-react';
import styles from './Admin.module.css';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';

const AdminSidebar = ({ activeTab, onNavigate, onClose }) => {
    const menuItems = [
        { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
        { id: 'users', label: 'کاربران', icon: Users },
        { id: 'handouts', label: 'جزوه‌ها', icon: FileText },
        { id: 'sample-questions', label: 'نمونه سوالات', icon: FileQuestion },
        { id: 'videos', label: 'ویدیوها', icon: Video },
        { id: 'questions', label: 'بانک سوالات', icon: BookOpen },
        { id: 'blog', label: 'وبلاگ', icon: Newspaper },
    { id: 'discounts', label: 'کدهای تخفیف', icon: Tag },
    { id: 'tickets', label: 'مدیریت تیکت‌ها', icon: LifeBuoy },
        { id: 'settings', label: 'تنظیمات', icon: Settings },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <span>Elmino Admin</span>
                {onClose && (
                    <button
                        type="button"
                        className={styles.closeSidebarBtn}
                        aria-label="بستن منو"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
            <nav className={styles.sidebarNav}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`${styles.navLink} ${activeTab === item.id ? styles.active : ''}`}
                        onClick={() => onNavigate(item.id)}
                        aria-label={item.label}
                        title={item.label}
                    >
                        <item.icon size={16} />
                        <span className={styles.navText}>{item.label}</span>
                    </button>
                ))}
            </nav>
            <hr className={styles.divider} />
            <div className={styles.sidebarBelowNav}>
                <ThemeSwitcher />
            </div>
        </aside>
    );
};

export default AdminSidebar;
