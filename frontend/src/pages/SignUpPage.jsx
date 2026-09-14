import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EnterPhoneStep from '../components/SignUp/EnterPhoneStep';
import EnterCodeStep from '../components/SignUp/EnterCodeStep';
import EnterDetailsStep from '../components/SignUp/EnterDetailsStep';
import styles from '../components/SignUp/SignUp.module.css';
import { registerStartPhone, registerComplete, checkIdentifier } from '../api/authService';
import { useUser } from '../context/UserContext';

const SignUpPage = () => {
    const [step, setStep] = useState('phone'); // 'phone', 'code', 'details'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSentAt, setOtpSentAt] = useState(null);

    useEffect(() => {
    // Stable theme; do not alter body dataset
    }, []);

    const [blockedUntil, setBlockedUntil] = useState(null);
    const [phoneError, setPhoneError] = useState(null);
    const [codeError, setCodeError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhoneSubmit = async (phone) => {
        if (blockedUntil && Date.now() < blockedUntil) {
            alert('در حال حاضر امکان ارسال کد وجود ندارد. لطفاً کمی بعد تلاش کنید.');
            return;
        }
        setPhoneError(null);
        try {
                setIsSubmitting(true);
                // Prevent duplicate signup: check if phone already exists
                const check = await checkIdentifier({ phone });
                if (check?.data?.exists) {
                    setPhoneError('این شماره قبلاً ثبت شده است. اگر حساب دارید وارد شوید.');
                    return;
                }
                const res = await registerStartPhone({ identifier: phone });
                setPhoneNumber(phone);
            try { sessionStorage.setItem('signup_phone', phone); } catch (e) {}
            setOtpSentAt(Date.now());
            setStep('code');
            // if server returned ttl, set local block
            const ttl = res?.data?.ttl ?? res?.ttl ?? null;
            if (ttl) setBlockedUntil(Date.now() + Number(ttl) * 1000);
        } catch (e) {
            const msg = e?.message || 'ارسال کد تایید با خطا مواجه شد';
            setPhoneError(msg);
            if (e?.status === 429) {
                const ttl = e?.ttl ?? 60;
                setBlockedUntil(Date.now() + Number(ttl) * 1000);
            }
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const { setUser } = useUser();

    const handleCodeSubmit = async (code) => {
        // Do not consume the OTP here. Keep it and advance to the details step so
        // the final registerComplete call can verify and consume the code.
        setCodeError(null);
        setOtp(code);
        setStep('details');
    };

    const handleDetailsSubmit = (details) => {
        // Details are submitted inside EnterDetailsStep where registerComplete is called
    };

    const renderStep = () => {
        switch (step) {
            case 'phone':
                return <EnterPhoneStep onPhoneSubmit={handlePhoneSubmit} disabled={blockedUntil && Date.now() < blockedUntil} errorMessage={phoneError} isSubmitting={isSubmitting} />;
            case 'code':
                return <EnterCodeStep phoneNumber={phoneNumber} otpSentAt={otpSentAt} isSubmitting={isSubmitting} onResend={async () => {
                    try {
                        await registerStartPhone({ identifier: phoneNumber });
                        setOtpSentAt(Date.now());
                    } catch (e) {
                        alert('ارسال مجدد با خطا مواجه شد');
                    }
                }} onCodeSubmit={handleCodeSubmit} />;
            case 'details':
                return <EnterDetailsStep phoneNumber={phoneNumber} otp={otp} onDetailsSubmit={handleDetailsSubmit} />;
            default:
                return <EnterPhoneStep onPhoneSubmit={handlePhoneSubmit} />;
        }
    };

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/';

    return (
        <div className={styles.signUpPage}>
            <div className={styles.signUpBox}>
                <h1 className={styles.logo}>Elmino</h1>
                <h2 className={styles.title}>ایجاد حساب کاربری جدید</h2>
                {renderStep()}
                <div className={styles.loginLink}>
                    حساب کاربری دارید؟{' '}
                    <Link to={`/login?next=${encodeURIComponent(next)}`}>وارد شوید</Link>
                </div>
                <div className={styles.guestLink}>
                    <Link to={next}>ادامه به عنوان مهمان</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
