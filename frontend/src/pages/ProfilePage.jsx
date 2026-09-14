import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import ProfileSidebar from '../components/Profile/ProfileSidebar';
import ProfileContent from '../components/Profile/ProfileContent';
import styles from '../components/Profile/Profile.module.css';
import { useUser } from '../context/UserContext';
import { getProfile } from '../api/profileService';

const ProfilePage = () => {
    const { user: contextUser, setUser: setContextUser } = useUser();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { search } = useLocation();
    const navigate = useNavigate();
    
    const getTabFromSearch = (s) => {
        const params = new URLSearchParams(s);
        const tab = params.get('tab');
        const valid = ['profile', 'courses', 'billing', 'support', 'question-sets'];
        return valid.includes(tab) ? tab : 'profile';
    };
    
    const [activeTab, setActiveTab] = useState(getTabFromSearch(search));

    // Load user profile data
    useEffect(() => {
        let active = true;
        
        const loadProfile = async () => {
            try {
                setLoading(true);
                const profileData = await getProfile();
                if (active) {
                    setUser(profileData);
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
                // Fallback to context user if API fails
                if (active && contextUser) {
                    setUser({
                        id: contextUser.id,
                        first_name: contextUser.name?.split(' ')[0] || '',
                        last_name: contextUser.name?.split(' ').slice(1).join(' ') || '',
                        name: contextUser.name,
                        phone: '',
                        email: '',
                        city: '',
                        province: '',
                        school_name: '',
                        grade_id: null,
                        grade: null,
                    });
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadProfile();
        
        return () => { active = false; };
    }, [contextUser]);

    // Keep activeTab in sync when URL changes
    useEffect(() => {
        setActiveTab(getTabFromSearch(search));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleSave = (updatedUser) => {
        setUser(updatedUser);
        // Also update the global user context so header and other components see the new avatar
        if (setContextUser) {
            setContextUser(updatedUser);
        }
    };

    // When changing tabs inside the profile, reflect in the URL
    const handleSetActiveTab = (tab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(search);
        params.set('tab', tab);
        navigate({ search: `?${params.toString()}` }, { replace: true });
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="dashboard-container">
                    <div className={styles.profileContainer}>
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            در حال بارگذاری...
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Header />
                <div className="dashboard-container">
                    <div className={styles.profileContainer}>
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            خطا در بارگذاری اطلاعات کاربر
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="dashboard-container">
                <div className={styles.profileContainer}>
                    <ProfileSidebar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
                    <ProfileContent user={user} activeTab={activeTab} onUserChange={handleSave} />
                </div>
            </div>
        </>
    );
};

export default ProfilePage;
