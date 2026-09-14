import React, { useContext } from 'react';
import ThemeContext, { icons } from '../context/ThemeContext';

const ThemeSwitcher = () => {
    const { mode, toggleMode, currentTheme } = useContext(ThemeContext);
    const IconSun = icons.sun;
    const IconMoon = icons.moon;

    return (
        <button
            onClick={toggleMode}
            className={`
                fixed bottom-5 left-5 z-50 
                p-3 rounded-full 
                bg-${currentTheme.secondary} text-white 
                shadow-lg
                hover:bg-${currentTheme.primary}
                transition-all duration-300 transform hover:scale-110
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${currentTheme.primary}
                dark:bg-${currentTheme.accent} dark:text-${currentTheme.primary}
            `}
            aria-label="Toggle light and dark mode"
        >
            {mode === 'light' ? <IconMoon className="h-6 w-6" /> : <IconSun className="h-6 w-6" />}
        </button>
    );
};

export default ThemeSwitcher;
