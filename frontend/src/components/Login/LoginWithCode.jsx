import React, { useState } from 'react';
import { Phone, KeyRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormInput from '../Forms/FormInput';
import styles from './Login.module.css';
import { useUser } from '../../context/UserContext';
import { loginStart, loginWithOtp } from '../../api/authService';

const LoginWithCode = () => {
    const [identifier, setIdentifier] = useState('');
    const [code, setCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cooldown, setCooldown] = useState(0); // seconds remaining until resend allowed
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/home';

    const { setUser } = useUser();

    const handleSendCode = async () => {
        setError(null);
        // prevent double clicks
        if (loading || cooldown > 0) return;
        setLoading(true);
        try {
            // Use server's loginStart which only allows existing users
            const res = await loginStart({ phone: identifier });
            // server usually returns { data: { ttl } } or top-level data with ttl; our helper returns that object
            const ttl = res?.data?.ttl ?? res?.ttl ?? res?.data?.data?.ttl ?? null;
            if (ttl) setCooldown(Number(ttl));
            setIsCodeSent(true);
        } catch (err) {
            const serverMsg = err?.response?.data?.message || err?.message;
            // Map some known server codes to Persian friendly messages
            let friendly = serverMsg;
            if (err?.status === 404 || err?.code === 'USER_NOT_FOUND') friendly = 'شماره ثبت نشده است. لطفاً ابتدا ثبت نام کنید.';
            if (err?.status === 429) friendly = 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید.';
            setError(friendly || 'خطا در ارسال کد');
            // If server returned ttl in error (rate-limited), honor it
            const ttl = err?.ttl ?? err?.response?.data?.data?.ttl ?? null;
            if (ttl) setCooldown(Number(ttl));
        } finally {
            setLoading(false);
        }
    };

    // countdown effect for cooldown seconds
    React.useEffect(() => {
        if (!cooldown) return undefined;
        const id = setInterval(() => {
            setCooldown(s => {
                if (s <= 1) {
                    clearInterval(id);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; // prevent double-submit
        setError(null);
        setLoading(true);
        try {
            // Use explicit OTP login so payload is clear and server validation
            // messages are preserved. loginWithOtp returns { accessToken, user }
            const res = await loginWithOtp({ phone: identifier, otp: code });
            const usr = res?.user;
            // Ensure admin detection is robust: check normalized role and roles array case-insensitively
            const isAdmin = (() => {
                if (!usr) return false;
                if (usr.role && String(usr.role).toLowerCase() === 'admin') return true;
                const roles = usr.roles || [];
                const names = Array.isArray(roles) ? roles.map(r => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map(n => String(n).toLowerCase()) : [];
                return names.some(n => n.includes('admin'));
            })();
            try { setUser(u => ({ ...u, ...usr })); } catch (e) { void e; }
            if (isAdmin) {
                navigate('/admin', { replace: true });
                return;
            }
            // If a normal user tried to open /admin and got redirected to login,
            // do NOT send them back to /admin after login; go home instead.
            const safeNext = (next && next.startsWith('/admin')) ? '/home' : next;
            navigate(safeNext || '/home', { replace: true });
        } catch (err) {
            const serverData = err?.response?.data;
            const serverMsg = serverData?.message || err?.message;
            // Map some server validation codes to friendly Persian messages
            let friendly = serverMsg;
            if (serverData?.code === 'INVALID_OTP') friendly = 'کد وارد شده اشتباه است یا منقضی شده.';
            if (serverData?.code === 'OTP_EXPIRED') friendly = 'کد منقضی شده است. لطفاً دوباره درخواست دهید.';
            setError(friendly || 'LOGIN_FAILED');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <FormInput id="identifier" label="تلفن" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="۰۹۱۲..." onlyDigits maxLength={11} inputMode="numeric" icon={Phone} readOnly={isCodeSent} disabled={loading && !isCodeSent} />
            {isCodeSent && (
                 <FormInput
                    id="code"
                    label="کد تایید"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onlyDigits
                    maxLength={6}
                    icon={KeyRound}
                    placeholder="XXXXXX"
                />
            )}
            
            {isCodeSent ? (
                <>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'در حال ورود...' : 'ورود'}</button>
                    <div style={{ marginTop: 8 }}>
                        {cooldown > 0 ? (
                            <button type="button" className={styles.resendBtn} disabled>
                                ارسال مجدد ({cooldown}s)
                            </button>
                        ) : (
                            <button type="button" className={styles.resendBtn} onClick={handleSendCode} disabled={loading}>
                                ارسال مجدد
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <button type="button" onClick={handleSendCode} className={styles.submitBtn} disabled={loading || cooldown > 0}>
                    {loading ? 'در حال ارسال...' : 'ارسال کد'}
                </button>
            )}
            {error && <div className={styles.error}>{error}</div>}
        </form>
    );
};

export default LoginWithCode;
