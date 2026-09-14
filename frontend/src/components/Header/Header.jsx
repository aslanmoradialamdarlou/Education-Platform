import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Book, Receipt, Headset, LogOut, Crown, Ticket } from 'lucide-react';
import styles from './Header.module.css';
import MobileSearch from '../MobileSearch/MobileSearch';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import { useUser } from '../../context/UserContext.jsx';
import NotificationsDropdown from './NotificationsDropdown';

const Header = ({ guestMode = false, next: nextFromProps }) => {
    const { user, logout } = useUser();
    const navigate = useNavigate();
    
    // Determine if user is actually a guest (not authenticated)
    const isGuestUser = !user?.id || user?.role === 'guest';
    // Use the determined guest status (prioritize actual user state over prop)
    const effectiveGuestMode = guestMode || isGuestUser;
    
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [isDrawerNotifOpen, setDrawerNotifOpen] = useState(true);
    const dropdownRef = useRef(null);
    const notificationsBtnRef = useRef(null);
    const [notifications, setNotifications] = useState(() => [
        { id: 'n1', type: 'subscription', title: 'تمدید اشتراک', message: 'اشتراک شما ۵ روز دیگر به پایان می‌رسد.', createdAt: new Date(Date.now()-1000*60*60).toISOString(), read: false },
        { id: 'n2', type: 'handout', title: 'جزوه جدید', message: 'جزوه فصل ۳ پایه هشتم منتشر شد.', createdAt: new Date(Date.now()-1000*60*35).toISOString(), read: false },
        { id: 'n3', type: 'question', title: 'سوال پیشنهادی', message: '۳ سوال جدید مطابق علایق شما.', createdAt: new Date(Date.now()-1000*60*60*5).toISOString(), read: true },
    ]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDrawer = () => setDrawerOpen(v => !v);
    const { pathname, search } = useLocation();
    const next = encodeURIComponent(nextFromProps ?? (pathname + (search || '')));


    const unreadCount = notifications.filter(n => !n.read).length;
    const markAllRead = () => setNotifications(prev => prev.map(n => ({...n, read:true})));
    const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read:true} : n));
    const [nowTs, setNowTs] = useState(Date.now());
    useEffect(() => {
        if (!user?.hasSubscription || !user?.subscriptionExpiry) return;
        const id = setInterval(() => setNowTs(Date.now()), 1000);
        return () => clearInterval(id);
    }, [user?.hasSubscription, user?.subscriptionExpiry]);
    const formatRemaining = (expiryIso, now = nowTs) => {
        if (!expiryIso) return { label: 'نامشخص', percent: 0 };
        const expiry = new Date(expiryIso).getTime();
        const total = 30 * 24 * 60 * 60 * 1000; // assume 30-day subscription window for progress
        const remaining = Math.max(0, expiry - now);
        const percent = Math.round((remaining / total) * 100);
        const days = Math.floor(remaining / (24*60*60*1000));
        const hours = Math.floor((remaining % (24*60*60*1000)) / (60*60*1000));
        return { label: `${days} روز ${hours} ساعت`, percent: Math.min(100, Math.max(0, percent)) };
    };

    const userName = user?.name || 'کاربر';
    const roleLabel = (r) => {
        if (!r) return 'کاربر';
        const map = {
            student: 'دانش‌آموز',
            teacher: 'معلم',
            admin: 'مدیر',
            parent: 'والد',
            guest: 'مهمان',
            moderator: 'ناظر',
            editor: 'ویرایشگر',
            user: 'کاربر',
        };
        const key = String(r).toLowerCase();
        return map[key] || r; // fallback to original if already localized or unknown
    };
    const tokens = user?.tokenCount ?? 0;

    return (
        <>
            <header className={styles.siteHeader}>
                <div className={styles.headerContainer}>
                    {/* Left - hamburger on mobile, logo on desktop */}
                    <div className={styles.leftRow}>
                        <button className={`${styles.iconBtn} ${styles.mobileOnly}`} aria-label="Open menu" onClick={toggleDrawer}>
                            <Menu size={20} />
                        </button>
                        <Link to="/home" className={styles.logoMobile} aria-label="Elmino">
                            <span className={styles.logoText}>Elmino</span>
                        </Link>
                    </div>

                    {/* Center - search on desktop */}
                    {!effectiveGuestMode && (
                        <div className={styles.centerRow}>
                            <div className={styles.desktopSearchBar} role="search">
                                <input type="text" placeholder="جست و جو در تمام مطالب..." aria-label="Search" />
                                <Search className={styles.searchIcon} size={18} />
                            </div>
                        </div>
                    )}

                    {/* Right - actions */}
                    <div className={styles.headerRight}>
                        {!effectiveGuestMode && (
                            <button className={`${styles.iconBtn} ${styles.mobileOnly}`} aria-label="Open search" onClick={() => setMobileSearchOpen(true)}>
                                <Search size={20} />
                            </button>
                        )}

                        {!effectiveGuestMode && (
                            <div className={styles.progressWrapper}>
                                {user?.hasSubscription ? (
                                    <div className={styles.progressPopoverWrapper}>
                                        <svg className={styles.progressCircle} viewBox="0 0 36 36" width="40" height="40" aria-hidden>
                                            <path className={styles.circleTrack} d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" strokeWidth="3" fill="none" />
                                            <path className={styles.circleBar} d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" strokeWidth="3" fill="none" strokeDasharray={`${formatRemaining(user.subscriptionExpiry, nowTs).percent} 100`} />
                                        </svg>
                                        <div className={styles.progressLabel} title={formatRemaining(user.subscriptionExpiry, nowTs).label}>{formatRemaining(user.subscriptionExpiry, nowTs).label}</div>
                                        <div className={styles.tokenInline} title={`${tokens} توکن`}>
                                            <Ticket size={14} />
                                            <span>{tokens.toLocaleString('fa-IR')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <Link to="/subscription" className={styles.subscriptionBtn} aria-label="خرید اشتراک">
                                        <Crown size={18} />
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Theme switcher should appear in both modes on desktop */}
                        <ThemeSwitcher />
                        {effectiveGuestMode ? (
                            <nav className={styles.guestActions} aria-label="Guest">
                                <Link to={`/login?next=${next}`} className={styles.loginBtn}>ورود</Link>
                                <Link to={`/signup?next=${next}`} className={styles.registerBtn}>ثبت نام رایگان</Link>
                            </nav>
                        ) : (
                            <>
                                <div className={`${styles.profileDropdown} ${isDropdownOpen ? styles.open : ''}`} ref={dropdownRef}>
                                    <div className={styles.userProfile} onClick={() => setDropdownOpen(v => !v)} aria-haspopup="true" aria-expanded={isDropdownOpen}>
                                        {user?.avatar ? <img src={user.avatar} alt="آواتار" /> : <div className={styles.avatarPlaceholder}><User size={18} /></div>}
                                        <div className={styles.userInfo}>
                                            <h4 className={styles.userNameDesktop}>{userName}</h4>
                                            <ChevronDown className={styles.chevronIcon} size={16} />
                                        </div>
                                    </div>
                                    <div className={styles.dropdownMenu} role="menu">
                                        <Link to="/profile?tab=profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}><User size={16}/> پروفایل من</Link>
                                        <Link to="/profile?tab=courses" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}><Book size={16}/> درس های من</Link>
                                        <Link to="/profile?tab=billing" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}><Receipt size={16}/> حساب و فاکتورها</Link>
                                        <Link to="/profile?tab=support" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}><Headset size={16}/> پشتیبانی</Link>
                                        <div className={styles.dropdownDivider}></div>
                                        <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={() => { setDropdownOpen(false); logout(); navigate('/login'); }}><LogOut size={16}/> خروج</button>
                                    </div>
                                </div>
                                <button ref={notificationsBtnRef} className={styles.headerIconBtn} aria-label="اعلان‌ها" onClick={() => setNotificationsOpen(v => !v)}>
                                    <Bell size={18} />
                                    {unreadCount > 0 && <span className={styles.notifBadge} aria-label={`${unreadCount} اعلان خوانده نشده`}>{unreadCount}</span>}
                                </button>
                                {isNotificationsOpen && (
                                    <NotificationsDropdown
                                        notifications={notifications}
                                        onClose={() => setNotificationsOpen(false)}
                                        anchorRef={notificationsBtnRef}
                                        markAllRead={markAllRead}
                                        markRead={markRead}
                                        onItemClick={(n)=>{ /* future navigation */ setNotificationsOpen(false); }}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Drawer + Backdrop (both modes) */}
            <div className={`${styles.drawerBackdrop} ${isDrawerOpen ? styles.open : ''}`} onClick={() => setDrawerOpen(false)} />
            <nav className={`${styles.mobileDrawer} ${isDrawerOpen ? styles.open : ''}`} aria-hidden={!isDrawerOpen}>
                {effectiveGuestMode ? (
                    <>
                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerProfile}>
                                <div className={styles.avatarPlaceholder}><User size={20} /></div>
                                <div>
                                    <div className={styles.drawerName}>خوش آمدید</div>
                                    <div className={styles.userRole}>مهمان</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.drawerThemeSwitcher}><ThemeSwitcher /></div>
                        <ul className={styles.drawerNav}>
                            <li><Link to="/blogs" className={styles.drawerLink}><Book size={18}/> وبلاگ</Link></li>
                            <li><Link to="/videos" className={styles.drawerLink}><Book size={18}/> ویدیوها</Link></li>
                            <li><Link to="/handouts" className={styles.drawerLink}><Book size={18}/> جزوه‌ها</Link></li>
                            <li><Link to="/questions" className={styles.drawerLink}><Book size={18}/> بانک سوال</Link></li>
                        </ul>
                        <div className={styles.drawerActions}>
                            <Link to={`/login?next=${next}`} className={styles.loginBtn}>ورود</Link>
                            <Link to={`/signup?next=${next}`} className={styles.registerBtn}>ثبت نام</Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerProfile}>
                                {user?.avatar ? <img src={user.avatar} alt="آواتار" /> : <div className={styles.avatarPlaceholder}><User size={20} /></div>}
                                <div>
                                    <div className={styles.drawerName}>{userName}</div>
                                    <div className={styles.userRole}>{roleLabel(user?.role)}</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.drawerThemeSwitcher}><ThemeSwitcher /></div>
                                                <ul className={styles.drawerNav}>
                            <li><Link to="/profile?tab=profile" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}><User size={18}/> پروفایل</Link></li>
                            <li><Link to="/profile?tab=courses" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}><Book size={18}/> درس های من</Link></li>
                            <li><Link to="/profile?tab=billing" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}><Receipt size={18}/> مالی</Link></li>
                            <li><Link to="/profile?tab=support" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}><Headset size={18}/> پشتیبانی</Link></li>
                        </ul>
                                                {/* Subscription status inside drawer */}
                                                                        {!effectiveGuestMode && (
                                                                            <div className={styles.drawerSubStatus}>
                                                                                {user?.hasSubscription ? (
                                                                                    <div className={styles.progressPopoverWrapper}>
                                                                                        <svg className={styles.progressCircle} viewBox="0 0 36 36" width="40" height="40" aria-hidden>
                                                                                            <path className={styles.circleTrack} d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" strokeWidth="3" fill="none" />
                                                                                            <path className={styles.circleBar} d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" strokeWidth="3" fill="none" strokeDasharray={`${formatRemaining(user.subscriptionExpiry, nowTs).percent} 100`} />
                                                                                        </svg>
                                                                                        <div className={styles.progressLabel} title={formatRemaining(user.subscriptionExpiry, nowTs).label}>{formatRemaining(user.subscriptionExpiry, nowTs).label}</div>
                                                                                        <div className={styles.tokenInline} title={`${tokens} توکن`}>
                                                                                            <Ticket size={14} />
                                                                                            <span>{tokens.toLocaleString('fa-IR')}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <Link to="/subscription" className={styles.subscriptionBtn} aria-label="خرید اشتراک">
                                                                                        <Crown size={18} />
                                                                                    </Link>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Notifications inside drawer - collapsible */}
                                                                        <div className={styles.drawerNotifications}>
                                                                            <button className={styles.drawerNotifHeader} onClick={() => setDrawerNotifOpen(v => !v)} aria-expanded={isDrawerNotifOpen} aria-controls="drawer-notifs">
                                                                                <div className={styles.drawerNotifHeaderLeft}>
                                                                                    <Bell size={18} />
                                                                                    <span>اعلان‌ها</span>
                                                                                    {unreadCount > 0 && <span className={styles.notifBadgeSmall}>{unreadCount}</span>}
                                                                                </div>
                                                                                <ChevronDown className={`${styles.chevronIcon} ${isDrawerNotifOpen ? styles.rotate : ''}`} size={16} />
                                                                            </button>
                                                                            <div id="drawer-notifs" className={`${styles.collapsible} ${isDrawerNotifOpen ? styles.open : ''}`}>
                                                                                <div className={styles.notificationsHeaderActions} style={{ padding: '.4rem .85rem' }}>
                                                                                    {unreadCount > 0 && (
                                                                                        <button className={styles.linkBtn} onClick={markAllRead}>علامت خوانده شد همه</button>
                                                                                    )}
                                                                                </div>
                                                                                <div className={styles.notificationsList}>
                                                                                    {notifications.length === 0 && (
                                                                                        <div className={styles.notificationsEmpty}>اعلانی وجود ندارد.</div>
                                                                                    )}
                                                                                    {notifications.map(n => (
                                                                                        <div
                                                                                            key={n.id}
                                                                                            className={`${styles.notificationItem} ${!n.read ? styles.unread : ''}`}
                                                                                            tabIndex={0}
                                                                                            role="menuitem"
                                                                                            onClick={() => markRead(n.id)}
                                                                                        >
                                                                                            <div className={styles.notificationIconWrap} aria-hidden>
                                                                                                <Bell size={16} />
                                                                                                {!n.read && <span className={styles.unreadDot} />}
                                                                                            </div>
                                                                                            <div className={styles.notificationContent}>
                                                                                                <div className={styles.notificationTitleRow}>
                                                                                                    <span className={styles.notificationTitle}>{n.title}</span>
                                                                                                </div>
                                                                                                <div className={styles.notificationMessage}>{n.message}</div>
                                                                                                <div className={styles.notificationMeta}>{new Date(n.createdAt).toLocaleTimeString('fa-IR')}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                <div className={styles.notificationsFooter}>
                                                                                    <button className={styles.linkBtn} onClick={() => alert('صفحه همه اعلان‌ها (آینده)')}>نمایش همه</button>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                {/* token pill removed here because it's shown inline with remaining time above */}
                        <div className={styles.drawerFooter}>
                            <button className={styles.logoutBtn} onClick={() => { logout(); setDrawerOpen(false); navigate('/login'); }}><LogOut size={16}/> خروج</button>
                        </div>
                    </>
                )}
            </nav>
            {!effectiveGuestMode && isMobileSearchOpen && <MobileSearch onClose={() => setMobileSearchOpen(false)} />}
        </>
    );
};

export default Header;
