import React from 'react';
import { User, Book, Receipt, Headset, FolderPlus } from 'lucide-react';
import styles from './Profile.module.css';

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'profile', label: 'پروفایل من', icon: User },
        { id: 'courses', label: 'درس های من', icon: Book },
        { id: 'question-sets', label: 'مجموعه سوالات من', icon: FolderPlus },
        { id: 'billing', label: 'فاکتور های مالی', icon: Receipt },
        { id: 'support', label: 'تیکت و پشتیبانی', icon: Headset },
    ];

    return (
        <div className={styles.tabBar} role="tablist" aria-label="Profile sections">
            <div className={styles.tabList}>
                {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            role="tab"
                            aria-selected={isActive}
                            className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfileSidebar;
