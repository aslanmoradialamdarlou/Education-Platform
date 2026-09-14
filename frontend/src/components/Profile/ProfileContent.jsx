import React, { useState, useEffect, useRef } from 'react';
import QuestionSetCard from './QuestionSetCard';
import MyCourses from './MyCourses';
import Billing from './Billing';
import Support from './Support';
import QuestionSets from './QuestionSets';
import styles from './Profile.module.css';
import { updateProfile, uploadAvatar } from '../../api/profileService';
import { Camera } from 'lucide-react';

const ProfileContent = ({ user, activeTab, onUserChange }) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState(user);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Update formData when user prop changes
    useEffect(() => {
        // Extract grade_id from grade object if needed
        const formattedUser = {
            ...user,
            grade_id: user.grade_id || user.grade?.id || null
        };
        setFormData(formattedUser);
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convert grade_id to number
        const processedValue = name === 'grade_id' ? (value ? Number(value) : null) : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleEdit = () => {
        setEditMode(true);
        setError(null);
        setSuccess(false);
    };

    const handleApply = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            // Prepare data for API
            const updateData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                email: formData.email,
                city: formData.city,
                province: formData.province,
                school_name: formData.school_name,
                grade_id: formData.grade_id ? Number(formData.grade_id) : null,
            };

            const updatedUser = await updateProfile(updateData);
            
            setEditMode(false);
            setSuccess(true);
            if (onUserChange) onUserChange(updatedUser);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err?.response?.data?.message || 'خطا در به‌روزرسانی اطلاعات');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset formData with proper grade_id extraction
        const formattedUser = {
            ...user,
            grade_id: user.grade_id || user.grade?.id || null
        };
        setFormData(formattedUser);
        setEditMode(false);
        setError(null);
        setSuccess(false);
        setAvatarPreview(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('لطفاً یک فایل تصویری انتخاب کنید');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('حجم تصویر نباید بیشتر از 2 مگابایت باشد');
            return;
        }

        try {
            setUploadingAvatar(true);
            setError(null);

            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload to server
            const updatedUser = await uploadAvatar(file);
            
            if (onUserChange) onUserChange(updatedUser);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setAvatarPreview(null); // Clear preview after success message fades
            }, 3000);
        } catch (err) {
            console.error('Failed to upload avatar:', err);
            setError(err?.response?.data?.message || 'خطا در آپلود تصویر');
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <>
                        <section className={styles.contentSection}>
                            <div className={styles.profileHeader}>
                                <div className={styles.headerInfo}>
                                    <div className={styles.avatarContainer}>
                                        <img 
                                            src={avatarPreview || user.avatar || `https://i.pravatar.cc/150?u=${user.id || 'default'}`} 
                                            alt="آواتار کاربر" 
                                            className={styles.avatar} 
                                        />
                                        <button 
                                            type="button"
                                            className={styles.avatarUploadBtn}
                                            onClick={handleAvatarClick}
                                            disabled={uploadingAvatar}
                                            title="تغییر تصویر پروفایل"
                                        >
                                            <Camera size={18} />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <h1 className={styles.userName}>
                                            {formData.first_name || formData.last_name 
                                                ? `${formData.first_name || ''} ${formData.last_name || ''}`.trim()
                                                : formData.name || 'کاربر'}
                                        </h1>
                                        <p className={styles.userGrade}>
                                            {formData.grade?.name 
                                                ? `دانش آموز پایه ${formData.grade.name}`
                                                : 'دانش آموز'}
                                        </p>
                                    </div>
                                </div>
                                {!editMode ? (
                                    <button className={styles.editProfileBtn} onClick={handleEdit}>
                                        ویرایش اطلاعات
                                    </button>
                                ) : (
                                    <div style={{display:'flex',gap:'.5rem'}}>
                                        <button 
                                            className={styles.editProfileBtn} 
                                            style={{background:'#eee',color:'#222'}} 
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            انصراف
                                        </button>
                                        <button 
                                            className={styles.editProfileBtn} 
                                            onClick={handleApply}
                                            disabled={saving}
                                        >
                                            {saving ? 'در حال ذخیره...' : 'اعمال'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {error && (
                                <div style={{
                                    padding: '12px 16px',
                                    marginBottom: '16px',
                                    backgroundColor: '#fee',
                                    color: '#c33',
                                    borderRadius: '8px',
                                    border: '1px solid #fcc'
                                }}>
                                    {error}
                                </div>
                            )}
                            
                            {success && (
                                <div style={{
                                    padding: '12px 16px',
                                    marginBottom: '16px',
                                    backgroundColor: '#efe',
                                    color: '#363',
                                    borderRadius: '8px',
                                    border: '1px solid #cfc'
                                }}>
                                    اطلاعات با موفقیت به‌روزرسانی شد
                                </div>
                            )}
                            
                            <form className={styles.infoGrid} onSubmit={e => e.preventDefault()}>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="first_name">نام</label>
                                    <input 
                                        id="first_name" 
                                        name="first_name" 
                                        type="text" 
                                        value={formData.first_name || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="last_name">نام خانوادگی</label>
                                    <input 
                                        id="last_name" 
                                        name="last_name" 
                                        type="text" 
                                        value={formData.last_name || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="grade_id">پایه تحصیلی</label>
                                    <select 
                                        id="grade_id" 
                                        name="grade_id" 
                                        value={formData.grade_id || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode}
                                    >
                                        <option value="">انتخاب کنید</option>
                                        <option value="1">هفتم</option>
                                        <option value="2">هشتم</option>
                                        <option value="3">نهم</option>
                                    </select>
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="phone">شماره تلفن</label>
                                    <input 
                                        id="phone" 
                                        name="phone" 
                                        type="tel" 
                                        value={formData.phone || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="province">استان</label>
                                    <input 
                                        id="province" 
                                        name="province" 
                                        type="text" 
                                        value={formData.province || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="city">شهر</label>
                                    <input 
                                        id="city" 
                                        name="city" 
                                        type="text" 
                                        value={formData.city || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="school_name">نام مدرسه</label>
                                    <input 
                                        id="school_name" 
                                        name="school_name" 
                                        type="text" 
                                        value={formData.school_name || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                                <div className={styles.profileInputGroup}>
                                    <label htmlFor="email">ایمیل</label>
                                    <input 
                                        id="email" 
                                        name="email" 
                                        type="email" 
                                        value={formData.email || ''} 
                                        onChange={handleChange} 
                                        disabled={!editMode} 
                                    />
                                </div>
                            </form>
                        </section>
                        <section className={styles.contentSection}>
                            <h3 className={styles.sectionTitle}>مجموعه سوالات من</h3>
                            <div className={styles.questionSetList}>
                                {user.questionSets && user.questionSets.length > 0 ? (
                                    user.questionSets.map(set => (
                                        <QuestionSetCard key={set.id} title={set.title} questionCount={set.count} />
                                    ))
                                ) : (
                                    <p style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                        هنوز مجموعه سوالی ایجاد نکرده‌اید
                                    </p>
                                )}
                            </div>
                        </section>
                    </>
                );
            case 'courses':
                return <MyCourses />;
            case 'question-sets':
                return <QuestionSets />;
            case 'billing':
                return <Billing />;
            case 'support':
                return <Support />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.profileContent}>
            {renderTabContent()}
        </div>
    );
};

export default ProfileContent;
