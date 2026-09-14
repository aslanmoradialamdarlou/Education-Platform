import React from 'react';
import styles from './Profile.module.css';

const ProfileHeader = ({ user, onEditClick }) => {
    // The 'user' prop is expected here. If it's undefined, the next line will crash.
    return (
        <div className={styles.profileHeader}>
            <div className={styles.headerInfo}>
                <img src={user.avatar} alt="آواتار کاربر" className={styles.avatar} />
                <div>
                    <h1 className={styles.userName}>{user.firstName} {user.lastName}</h1>
                    <p className={styles.userGrade}>دانش آموز پایه {user.grade}</p>
                </div>
            </div>
            <button className={styles.editProfileBtn} onClick={onEditClick}>
                ویرایش پروفایل
            </button>
        </div>
    );
};

export default ProfileHeader;
