import React, { useState } from 'react';
import { Ticket, Wallet, Plus, Minus } from 'lucide-react';
import styles from './Admin.module.css';
import WalletStyles from './UserWalletToken.module.css';
import { adjustUserWallet, topupUserTokens } from '../../api/adminApi';

const UserWalletToken = ({ user }) => {
    const [tokenInput, setTokenInput] = useState('');
    const [walletInput, setWalletInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [state, setState] = useState({ tokens: user.tokenCount ?? user.tokens ?? 0, wallet: user.walletBalance ?? 0 });

    const handleTokens = async (sign) => {
        const val = parseInt(tokenInput, 10);
        if (!user?.id || !Number.isFinite(val) || val <= 0) return;
        setBusy(true); setMsg(null);
        try {
            // Only support top-up (positive) via API; negative flow would require a separate endpoint
            if (sign < 0) {
                setMsg('کاهش توکن فعلاً نیاز به API جدا دارد.');
            } else {
                const res = await topupUserTokens(user.id, val);
                const remain = res?.remain ?? (state.tokens + val);
                setState(s => ({ ...s, tokens: remain }));
                setMsg('توکن افزوده شد.');
            }
        } catch (e) {
            setMsg(e?.response?.data?.message || e?.message || 'خطا در بروزرسانی توکن');
        } finally {
            setBusy(false);
        }
    };

    const handleWallet = async (sign) => {
        const raw = parseInt(walletInput, 10);
        if (!user?.id || !Number.isFinite(raw) || raw <= 0) return;
        const amount = Math.abs(raw);
        const type = sign < 0 ? 'withdraw' : 'deposit';
        setBusy(true); setMsg(null);
        try {
            const res = await adjustUserWallet(user.id, { type, amount });
            const bal = res?.balance ?? (sign < 0 ? state.wallet - amount : state.wallet + amount);
            setState(s => ({ ...s, wallet: bal }));
            setMsg('کیف پول بروزرسانی شد.');
        } catch (e) {
            setMsg(e?.response?.data?.message || e?.message || 'خطا در بروزرسانی کیف پول');
        } finally {
            setBusy(false);
        }
    };
    return (
        <div>
            <div className={styles.detailTabHeader}>
                <h3 className="title-md" style={{ margin: 0 }}>مدیریت توکن و کیف پول</h3>
            </div>
            <div className={WalletStyles.walletGrid}>
                {/* Token Management Card */}
                <div className={styles.detailCard}>
                    <div className={styles.cardTitle}>
                        <Ticket />
                        <span>مدیریت توکن</span>
                    </div>
                    <div className={styles.cardContent}>
                        <div>موجودی فعلی: <strong>{(state.tokens).toLocaleString('fa-IR')}</strong> توکن</div>
                        <div className={`${styles.actionInputGroup} ${WalletStyles.walletRowNoWrap}`}>
                            <div className={WalletStyles.inputWrap} >
                                <span className="searchIcon"><Ticket size={16} /></span>
                                <input type="number" placeholder="تعداد" className="pillInput" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} />
                            </div>
                            <div className={WalletStyles.buttonGroup}>
                                <button disabled={busy} className={`${WalletStyles.btn} ${WalletStyles.btnPrimary}`} onClick={() => handleTokens(+1)}><Plus size={16} /> افزودن</button>
                                <button disabled className={`${WalletStyles.btn} ${WalletStyles.btnOutlineDanger}`} title="نیاز به API جدا"> <Minus size={16} /> کسر کردن</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wallet Management Card */}
                <div className={styles.detailCard}>
                    <div className={styles.cardTitle}>
                        <Wallet />
                        <span>مدیریت کیف پول</span>
                    </div>
                    <div className={styles.cardContent}>
                        <div>موجودی فعلی: <strong>{(state.wallet).toLocaleString('fa-IR')}</strong> تومان</div>
                        <div className={`${styles.actionInputGroup} ${WalletStyles.walletRowNoWrap}`}>
                            <div className={WalletStyles.inputWrap} >
                                <span className="searchIcon"><Wallet size={16} /></span>
                                <input type="number" placeholder="مبلغ (تومان)" className="pillInput" value={walletInput} onChange={(e) => setWalletInput(e.target.value)} />
                            </div>
                            <div className={WalletStyles.buttonGroup}>
                                <button disabled={busy} className={`${WalletStyles.btn} ${WalletStyles.btnPrimary}`} onClick={() => handleWallet(+1)}><Plus size={16} /> افزایش موجودی</button>
                                <button disabled={busy} className={`${WalletStyles.btn} ${WalletStyles.btnOutlineDanger}`} onClick={() => handleWallet(-1)}><Minus size={16} /> کسر کردن</button>
                            </div>
                        </div>
                        {msg && <div className="text-sm" style={{ marginTop: '.5rem', color: 'var(--text-secondary)' }}>{msg}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserWalletToken;
