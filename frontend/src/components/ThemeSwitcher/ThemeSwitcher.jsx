import React, { useContext, useEffect } from 'react';
import ThemeContext, { icons } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext.jsx';
import styles from './ThemeSwitcher.module.css';

const ThemeSwitcher = () => {
    const { mode, toggleMode } = useContext(ThemeContext);
    const { setPreferredMode } = useUser();

    const handleToggle = () => {
        const next = mode === 'light' ? 'dark' : 'light';
        toggleMode();
        setPreferredMode(next);
    };
    
    const IconSun = icons.sun;
    const IconMoon = icons.moon;

    return (
    <button onClick={handleToggle} className={styles.floatingThemeBtn} aria-label="Toggle light/dark theme">
            {mode === 'light' ? <IconMoon width={18} height={18} /> : <IconSun width={18} height={18} />}
        </button>
    );
};

export default ThemeSwitcher;
