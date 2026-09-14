import React, { useState } from 'react';
import { Phone, Lock, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormInput from '../Forms/FormInput';
import styles from './Login.module.css';
import { useUser } from '../../context/UserContext';

const LoginWithPassword = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/home';

    const { login } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
                // Perform normal login via backend and redirect based on server-verified role
                const usr = await login({ phone, password });
                const isAdmin = (() => {
                    if (!usr) return false;
                    if (usr.role && String(usr.role).toLowerCase() === 'admin') return true;
                    const roles = usr.roles || [];
                    const names = Array.isArray(roles) ? roles.map(r => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map(n => String(n).toLowerCase()) : [];
                    return names.some(n => n.includes('admin'));
                })();
                if (isAdmin) {
                    navigate('/admin', { replace: true });
                    return;
                }
                const safeNext = (next && next.startsWith('/admin')) ? '/home' : next;
                navigate(safeNext || '/home', { replace: true });
        } catch (err) {
            setError(err?.message || 'LOGIN_FAILED');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <FormInput 
                id="phone" 
                label="شماره موبایل" 
                type="tel" 
                placeholder="09123456789" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                icon={Phone} 
            />
            <FormInput
                id="password"
                label="رمز عبور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                placeholder="xxxxxxxx"
            />
            <a href="#" className={styles.forgotPassword}>رمز عبور خود را فراموش کرده‌اید؟</a>
            <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'در حال ورود...' : 'ورود'}</button>
            {error && <div className={styles.error}>{error}</div>}
        </form>
    );
};

export default LoginWithPassword;
