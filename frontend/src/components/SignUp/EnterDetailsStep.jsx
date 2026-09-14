import React, { useState } from 'react';
import { User, Lock, MapPin, Hash, Building, Phone } from 'lucide-react';
import FormInput from '../Forms/FormInput';
import styles from './SignUp.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { registerComplete, registerCompleteReal } from '../../api/authService';
import { useUser } from '../../context/UserContext';
import { IranProvinces } from '../../data/iranLocations';

const EnterDetailsStep = ({ phoneNumber, otp, onDetailsSubmit }) => {
    const [formData, setFormData] = useState({
        // First/Last removed per design; add optional email
        firstName: '',
        lastName: '',
        email: '',
        state: 'تهران',
        city: '',
        grade: '7',
        schoolName: '',
        password: '',
    });

    const [serverError, setServerError] = useState(null);
    const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleStateChange = (e) => {
        const newState = e.target.value;
        setFormData(prev => ({ ...prev, state: newState, city: '' }));
    };

    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/home';

    const { setUser } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        if (!otp) {
            setServerError('کد تایید وارد نشده است');
            return;
        }

        // Basic required field checks
        if (!formData.state || !formData.city) {
            setServerError('استان و شهر را انتخاب کنید');
            return;
        }
        if (!/^\d{1,2}$/.test(formData.grade)) {
            setServerError('پایه تحصیلی معتبر نیست');
            return;
        }
        if (!/^.{6,}$/.test(formData.password)) {
            setServerError('رمز عبور باید حداقل ۶ کاراکتر باشد');
            return;
        }

        const phoneToSend = phoneNumber || (() => { try { return sessionStorage.getItem('signup_phone'); } catch (e) { return null; } })();

        const payload = {
            phone: phoneToSend,
            otp,
            password: formData.password,
            // include names if provided
            first_name: formData.firstName || undefined,
            last_name: formData.lastName || undefined,
            email: formData.email || undefined,
            province: formData.state,
            city: formData.city,
            school_name: formData.schoolName,
        };

        try {
            setIsSubmittingLocal(true);
            const res = await registerCompleteReal(payload);
            if (res?.user) {
                try { setUser(u => ({ ...u, ...res.user })); } catch {}
            }
            onDetailsSubmit({ email: formData.email });
            try { sessionStorage.removeItem('signup_phone'); } catch (e) {}
            navigate(next, { replace: true });
        } catch (err) {
            try {
                const resp = err?.response;
                if (resp && resp.data) {
                    const data = resp.data;
                    if (data.errors) {
                        const messages = Object.keys(data.errors).map(k => data.errors[k].join(' ')).join('\n');
                        setServerError(messages);
                        return;
                    }
                    if (data.message) {
                        setServerError(data.message);
                        return;
                    }
                }
            } catch (e) {
                // ignore parsing errors
            }
            console.error(err);
            setServerError(err?.message || 'REGISTER_FAILED');
        } finally {
            setIsSubmittingLocal(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
             <p className={styles.stepInstruction}>
                فقط یک مرحله دیگر باقی مانده است! اطلاعات خود را تکمیل کنید.
            </p>
            {/* <div className={styles.formGrid}>
                <FormInput id="firstName" name="firstName" label="نام" type="text" placeholder="علی" value={formData.firstName} onChange={handleChange} icon={User} />
                <FormInput id="lastName" name="lastName" label="نام خانوادگی" type="text" placeholder="رضایی" value={formData.lastName} onChange={handleChange} icon={User} />
            </div> */}
            <div className={styles.formGrid}>
                <FormInput id="firstName" name="firstName" label="نام" type="text" placeholder="علی" value={formData.firstName} onChange={handleChange} icon={User} />
                <FormInput id="lastName" name="lastName" label="نام خانوادگی" type="text" placeholder="رضایی" value={formData.lastName} onChange={handleChange} icon={User} />
            </div>
            <div className={styles.formGrid}>
                <div className={styles.fullWidth}>
                    <div className={styles.formGroup}>
                        <label>شماره تلفن مورد استفاده</label>
                        <div className={styles.inputWrapper}>
                            <Phone className={styles.inputIcon} size={20} />
                            <input type="text" readOnly value={phoneNumber || (() => { try { return sessionStorage.getItem('signup_phone'); } catch (e) { return ''; } })()} className={styles.selectInput} />
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.formGrid}>
                <div className={styles.fullWidth}>
                    <FormInput id="email" name="email" label="ایمیل (اختیاری)" type="email" placeholder="example@example.com" value={formData.email} onChange={handleChange} icon={User} required={false} />
                </div>
            </div>
            <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <label htmlFor="state">استان</label>
                    <div className={styles.inputWrapper}>
                        <MapPin className={styles.inputIcon} size={20} />
                        <select id="state" name="state" value={formData.state} onChange={handleStateChange} className={styles.selectInput}>
                            {Object.keys(IranProvinces).map(province => (
                                <option key={province} value={province}>{province}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="city">شهر</label>
                    <div className={styles.inputWrapper}>
                        <MapPin className={styles.inputIcon} size={20} />
                        <select id="city" name="city" value={formData.city} onChange={handleChange} className={styles.selectInput} disabled={!formData.state}>
                            <option value="">انتخاب شهر</option>
                            {formData.state && IranProvinces[formData.state].map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <label htmlFor="grade">پایه تحصیلی</label>
                    <div className={styles.inputWrapper}>
                        <Hash className={styles.inputIcon} size={20} />
                        <select id="grade" name="grade" value={formData.grade} onChange={handleChange} className={styles.selectInput}>
                            <option value="7">هفتم</option>
                            <option value="8">هشتم</option>
                            <option value="9">نهم</option>
                        </select>
                    </div>
                </div>
                <FormInput id="schoolName" name="schoolName" label="نام مدرسه" type="text" placeholder="دبیرستان البرز" value={formData.schoolName} onChange={handleChange} icon={Building} />
            </div>
            <div className={styles.formGrid}>
                <FormInput id="password" name="password" label="رمز عبور" type="password" placeholder="********" value={formData.password} onChange={handleChange} icon={Lock} />
            </div>
            {serverError && <div className={styles.serverError}>{serverError}</div>}
            <button type="submit" className={`${styles.submitBtn} ${isSubmittingLocal ? styles.loading : ''}`} disabled={!otp || isSubmittingLocal}>
                {isSubmittingLocal ? 'در حال ثبت...' : 'تکمیل ثبت‌نام'}
            </button>
        </form>
    );
};

export default EnterDetailsStep;
