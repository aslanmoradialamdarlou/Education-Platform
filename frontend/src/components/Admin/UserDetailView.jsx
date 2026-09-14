import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Activity, DollarSign, Wallet } from 'lucide-react';
import UserContent from './UserContent';
import UserActivityLog from './UserActivityLog';
import UserFinancialHistory from './UserFinancialHistory';
import UserWalletToken from './UserWalletToken';
import styles from './Admin.module.css';
import './adminBase.css';
import { fetchAdminUser } from '../../api/adminApi';

const UserDetailView = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [detail, setDetail] = useState(user || null);
    const [loading, setLoading] = useState(false);

    // Normalize/derive a couple of fields used in child tabs
    const normalizeDetail = (uLike) => {
        const u = uLike || {};
        const joinedAt = u.joined_at || u.joinAt || u.joinDateIso || u.created_at;
        const joinAtIso = joinedAt && !isNaN(Date.parse(joinedAt)) ? new Date(joinedAt).toISOString() : (u.joinAt || null);
        const joinDateFa = u.joinDate || (joinAtIso ? new Date(joinAtIso).toLocaleDateString('fa-IR') : undefined);
        // Tokens and wallet shapes vary across APIs; try common shapes with sensible fallbacks
        const tokens = u.tokens ?? u.tokenCount ?? u.token_count ?? (u.wallet?.tokens) ?? 0;
        const walletBalance = u.walletBalance ?? u.wallet_balance ?? (typeof u.wallet?.balance === 'number' ? u.wallet.balance : 0);
        const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
        const subActive = !!(u.subscription && (u.subscription.status === 'active')) || (u.hasSubscription === true);
        const subscriptionPlan = u.subscriptionPlan || (subActive ? 'golden' : 'none');
        const isActive = typeof u.is_active === 'boolean' ? u.is_active : (u.status ? u.status === 'active' : true);
        return {
            ...u,
            joinAt: joinAtIso || u.joinAt || null,
            joinDate: joinDateFa || u.joinDate || undefined,
            tokens,
            tokenCount: tokens,
            walletBalance,
            roles,
            role: u.role || (roles.includes('teacher') ? 'teacher' : (roles.includes('student') ? 'student' : 'student')),
            subscriptionPlan,
            status: isActive ? 'active' : 'suspended',
        };
    };

    useEffect(() => {
        if (!user?.id) { setDetail(user || null); return; }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const fresh = await fetchAdminUser(user.id);
                if (cancelled) return;
                const merged = normalizeDetail({ ...user, ...(fresh || {}) });
                setDetail(merged);
            } catch (e) {
                if (!cancelled) setDetail(normalizeDetail(user));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user?.id]);



    return (
        <div>
            <div className={styles.panelHeader}>
                <div className={styles.detailHeader}>
                    <button onClick={onBack} className="btn btn-icon" aria-label="بازگشت">
                        <ArrowRight />
                    </button>
                    <img 
                        src={detail?.avatarUrl || detail?.avatar || user?.avatarUrl || user?.avatar || `https://i.pravatar.cc/40?u=${detail?.email || user?.email || 'user'}`} 
                        alt={detail?.name || user?.name || ''} 
                        className={styles.detailAvatar}
                        style={{ objectFit: 'cover' }}
                    />
                    <h2 style={{ margin: 0 }}>
                        {detail?.name || user?.name || '—'}
                        {loading && <span className="spinner inline" style={{ marginInlineStart: 8 }} aria-label="در حال بروزرسانی">‎</span>}
                    </h2>
                </div>
            </div>

            {/* Tabs header (custom, no MUI) */}
            <div className="tabsHeader" role="tablist" aria-label="user detail tabs">
                <button
                    className={`tabBtn ${activeTab === 0 ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 0}
                    onClick={() => setActiveTab(0)}
                >
                    <ShieldCheck size={16} />
                    <span>مدیریت محتوا</span>
                </button>
                <button
                    className={`tabBtn ${activeTab === 1 ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 1}
                    onClick={() => setActiveTab(1)}
                >
                    <Activity size={16} />
                    <span>لاگ فعالیت</span>
                </button>
                <button
                    className={`tabBtn ${activeTab === 2 ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 2}
                    onClick={() => setActiveTab(2)}
                >
                    <DollarSign size={16} />
                    <span>تاریخچه مالی</span>
                </button>
                <button
                    className={`tabBtn ${activeTab === 3 ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 3}
                    onClick={() => setActiveTab(3)}
                >
                    <Wallet size={16} />
                    <span>توکن و کیف پول</span>
                </button>
            </div>

            <div className="tabContentViewport" style={{ paddingTop: '1.5rem' }}>
                <div className={(activeTab === 0 || activeTab === 1 || activeTab === 2 || activeTab === 3) ? "tabContentInner tabContentInner--fluid" : "tabContentInner"}>
                    {activeTab === 0 && <UserContent user={detail || user} />}
                    {activeTab === 1 && <UserActivityLog user={detail || user} />}
                    {activeTab === 2 && <UserFinancialHistory user={detail || user} />}
                    {activeTab === 3 && <UserWalletToken user={detail || user} />}
                </div>
            </div>
        </div>
    );
};

export default UserDetailView;
