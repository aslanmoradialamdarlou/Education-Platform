import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { useUser } from '../context/UserContext';
import { Menu } from 'lucide-react';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminDashboard from '../components/Admin/AdminDashboard';
import UserManagement from '../components/Admin/UserManagement';
import UserDetailView from '../components/Admin/UserDetailView';
import AdminVideos from '../components/Admin/AdminVideos';
import AdminHandouts from '../components/Admin/AdminHandouts';
import AdminSampleQuestions from '../components/Admin/AdminSampleQuestions';
import AdminQuestions from '../components/Admin/AdminQuestions';
import AdminSettings from '../components/Admin/AdminSettings';
import AdminBlogs from '../components/Admin/AdminBlogs';
import AdminTickets from '../components/Admin/AdminTickets';
import AdminDiscounts from '../components/Admin/AdminDiscounts';
import styles from '../components/Admin/Admin.module.css';
import ThemeContext from '../context/ThemeContext';

// Mock data kept only for deep-linking fallback when opening a specific user by query params
const MOCK_USERS = Array.from({ length: 0 }, () => ({}));

const AdminPage = () => {
    // Ensure only admin users can stay on this page; otherwise redirect to home.
    // This is a client-side guard and should be backed by server-side authorization on the API.
    // Use the stored user role from local UserContext (if available) to perform a quick redirect.
    // The server must enforce admin-only access for all admin APIs.
    // ...existing code...
    const navigate = useNavigate();
    const { user, booting } = useUser();
    // ...existing code continues below
    const location = useLocation();
    const { tab } = useParams();
    const validTabs = new Set(['dashboard','users','videos','handouts','sample-questions','questions','settings','tickets','discounts','blog']);
    const activeTab = validTabs.has(tab) ? (tab || 'dashboard') : 'dashboard';
    const [selectedUser, setSelectedUser] = useState(null);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const { mode } = useContext(ThemeContext); // use global theme mode

    // Stable theming: no page-specific body dataset adjustments

    // Redirect invalid tab to canonical dashboard once (no loop)
    useEffect(() => {
        if (tab && !validTabs.has(tab)) {
            navigate('/admin', { replace: true });
        }
    }, [tab, navigate]);

    // Client-side guard: if we don't have an admin user, bounce to login with next param.
    useEffect(() => {
        // Wait until auth bootstrap completes to avoid bouncing while we are still loading the current user.
        if (booting) return;
        // If user is loaded and not admin, redirect away.
        if (user && user.role && user.role !== 'admin') {
            const target = tab ? `/admin/${tab}` : '/admin';
            const qs = location.search || '';
            navigate(`/login?next=${encodeURIComponent(target + qs)}`, { replace: true });
        }
    }, [user, booting, navigate, tab, location.search]);

    const theme = useMemo(() => {
        // Resolve CSS variable to a real color for MUI (avoid passing var())
        const resolveCssVar = (name, fallback) => {
            if (typeof window === 'undefined') return fallback;
            const val = getComputedStyle(document.body).getPropertyValue(name).trim();
            // Accept hex/rgb/hsl/color()
            const ok = val && (/^#/.test(val) || val.startsWith('rgb') || val.startsWith('hsl') || val.startsWith('color('));
            return ok ? val : fallback;
        };
        const primaryMain = resolveCssVar('--accent-primary-solid', '#0d6efd');
        // Use fixed, consistent palettes to prevent drift when toggling
        const light = {
            textPrimary: '#212529',
            textSecondary: '#6c757d',
            bgMain: '#f3f7fd',
            bgContent: '#fefefe',
            border: '#dee2e6',
        };
        const dark = {
            textPrimary: '#e9ecef',
            textSecondary: '#adb5bd',
            bgMain: '#11151a',
            bgContent: '#1c232e',
            border: '#343a40',
        };
    const pal = mode === 'dark' ? dark : light;

        return createTheme({
        direction: 'rtl',
        typography: { fontFamily: 'Vazirmatn, sans-serif' },
        palette: {
            mode: mode === 'dark' ? 'dark' : 'light',
            primary: { main: primaryMain },
            background: { default: pal.bgMain, paper: pal.bgContent },
            text: { primary: pal.textPrimary, secondary: pal.textSecondary },
            divider: pal.border,
            action: { active: pal.textSecondary }
        }
    });
    }, [mode]);

    // Close detail view if we switch away from Users tab
    useEffect(() => {
        if (activeTab !== 'users' && selectedUser) {
            setSelectedUser(null);
        }
    }, [activeTab, selectedUser]);

    // Deep-link: open a user directly in detail view when coming from other tabs (e.g., Tickets)
    useEffect(() => {
        // Only handle when we are on users tab and no detail is already open
        if (activeTab !== 'users' || selectedUser) return;
        const params = new URLSearchParams(location.search);
        const email = params.get('openUserEmail');
        const id = params.get('openUserId');
        const name = params.get('openUserName');
        if (!email && !id && !name) return;
        // Try to find an existing user from mock list by email or id, else create a minimal user
        let target = null;
        if (email) target = MOCK_USERS.find(u => u.email === email) || null;
        if (!target && id) target = MOCK_USERS.find(u => String(u.id) === String(id)) || null;
        if (!target) {
            target = {
                id: id || `u-${Math.random().toString(36).slice(2,8)}`,
                name: name || email || 'کاربر',
                email: email || `${(name||'user').replace(/\s+/g,'').toLowerCase()}@example.com`,
                role: 'student',
                grade: '8',
                hasSubscription: false,
            };
        }
        setSelectedUser(target);
        // Clean query params to avoid re-trigger loop
        params.delete('openUserEmail');
        params.delete('openUserId');
        params.delete('openUserName');
        const base = `/admin/${activeTab}`;
        const qs = params.toString();
        navigate(qs ? `${base}?${qs}` : base, { replace: true });
    }, [activeTab, location.search, navigate, selectedUser]);

    const renderContent = () => {
        if (selectedUser) {
            return <UserDetailView user={selectedUser} onBack={() => setSelectedUser(null)} />;
        }
        switch (activeTab) {
            case 'dashboard':
                return <AdminDashboard onQuickNavigate={(t) => navigate(t.startsWith('dashboard') ? '/admin' : `/admin/${t}`)} />;
            case 'users':
                return <UserManagement onUserSelect={setSelectedUser} />;
            case 'videos':
                return <AdminVideos />;
            case 'handouts':
                return <AdminHandouts />;
            case 'sample-questions':
                return <AdminSampleQuestions />;
            case 'questions':
                return <AdminQuestions />;
            case 'settings':
                return <AdminSettings />;
            case 'tickets':
                return <AdminTickets onQuickNavigate={(t) => navigate(t.startsWith('dashboard') ? '/admin' : `/admin/${t}`)} />;
            case 'discounts':
                return <AdminDiscounts />;
            case 'blog':
                return <AdminBlogs />;
            default:
                return <div>محتوای این بخش به زودی اضافه خواهد شد.</div>;
        }
    };

    return (
        <MUIThemeProvider theme={theme}>
            <div className={styles.adminLayout}>
                <div
                    id="admin-sidebar"
                    className={`${styles.sidebarWrapper} ${isMobileSidebarOpen ? styles.open : ''}`}
                    role={isMobileSidebarOpen ? 'dialog' : undefined}
                    aria-modal={isMobileSidebarOpen || undefined}
                    aria-label={isMobileSidebarOpen ? 'منوی مدیریت' : undefined}
                >
                    <AdminSidebar
                        activeTab={activeTab}
                        onNavigate={(t) => {
                            // Navigate and ensure any open user detail view is closed
                            navigate(t === 'dashboard' ? '/admin' : `/admin/${t}`);
                            setSelectedUser(null);
                            setMobileSidebarOpen(false);
                        }}
                        onClose={isMobileSidebarOpen ? () => setMobileSidebarOpen(false) : undefined}
                    />
                </div>
                {isMobileSidebarOpen && <div className={styles.mobileBackdrop} onClick={() => setMobileSidebarOpen(false)}></div>}
                <main className={styles.mainContent}>
                    {!isMobileSidebarOpen && (
                        <button
                            className={styles.mobileMenuBtn}
                            onClick={() => setMobileSidebarOpen(true)}
                            aria-label="باز کردن منوی مدیریت"
                            aria-controls="admin-sidebar"
                            aria-expanded={false}
                        >
                            <Menu size={22} />
                        </button>
                    )}
                    {renderContent()}
                    {/* Floating theme switcher across admin */}
                </main>
            </div>
    </MUIThemeProvider>
    );
};

export default AdminPage;
