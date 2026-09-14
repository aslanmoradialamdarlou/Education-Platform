import React, { useState, useEffect, useLayoutEffect, createContext, useRef } from 'react';

// --- THEME CONFIGURATION ---
// Centralized configuration for grade-based themes and light/dark modes.
export const themes = {
  7: {
    light: {
      primary: 'pink-500',
      secondary: 'pink-600',
      accent: 'pink-100',
      text: 'pink-900',
      bg: 'pink-50',
      heroBg: 'https://placehold.co/1200x600/FFE4E6/A22C4B?text=Grade+7+Hero',
      cardBg: 'bg-white/50',
      cardBorder: 'border-pink-200',
      cardText: 'text-pink-900',
    },
    dark: {
      primary: 'pink-400',
      secondary: 'pink-500',
      accent: 'pink-900',
      text: 'pink-100',
      bg: 'gray-900',
      heroBg: 'https://placehold.co/1200x600/4A040C/F472B6?text=Grade+7+Hero',
      cardBg: 'bg-gray-800/40',
      cardBorder: 'border-pink-500/50',
      cardText: 'text-pink-100',
    }
  },
  8: {
    light: {
      primary: 'blue-500',
      secondary: 'blue-600',
      accent: 'blue-100',
      text: 'blue-900',
      bg: 'blue-50',
      heroBg: 'https://placehold.co/1200x600/E0F2FE/0C4A6E?text=Grade+8+Hero',
      cardBg: 'bg-white/50',
      cardBorder: 'border-blue-200',
      cardText: 'text-blue-900',
    },
    dark: {
      primary: 'blue-400',
      secondary: 'blue-500',
      accent: 'blue-900',
      text: 'blue-100',
      bg: 'gray-900',
      heroBg: 'https://placehold.co/1200x600/082f49/7DD3FC?text=Grade+8+Hero',
      cardBg: 'bg-gray-800/40',
      cardBorder: 'border-blue-500/50',
      cardText: 'text-blue-100',
    }
  },
  9: {
    light: {
      primary: 'green-500',
      secondary: 'green-600',
      accent: 'green-100',
      text: 'green-900',
      bg: 'green-50',
      heroBg: 'https://placehold.co/1200x600/D1FAE5/065F46?text=Grade+9+Hero',
      cardBg: 'bg-white/50',
      cardBorder: 'border-green-200',
      cardText: 'text-green-900',
    },
    dark: {
      primary: 'green-400',
      secondary: 'green-500',
      accent: 'green-900',
      text: 'green-100',
      bg: 'gray-900',
      heroBg: 'https://placehold.co/1200x600/052e16/6EE7B7?text=Grade+9+Hero',
      cardBg: 'bg-gray-800/40',
      cardBorder: 'border-green-500/50',
      cardText: 'text-green-100',
    }
  }
};

// --- ICONS (Self-contained SVGs) ---
export const icons = {
  logo: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
    </svg>
  ),
  search: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  notification: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  profile: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  sun: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  chevronLeft: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// --- THEME CONTEXT ---
// Provides theme and grade information to all components.
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Access user preferred mode early
  let userPreferredMode = 'light';
  try {
    // Read from sessionStorage (tab-specific) instead of localStorage
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem('app_user') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.preferredMode === 'dark' || parsed.preferredMode === 'light')) {
        userPreferredMode = parsed.preferredMode;
      }
    }
  } catch(_) {}
  const [grade, setGrade] = useState(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('app-grade') : null;
    const g = stored ? parseInt(stored, 10) : 8;
    return [7,8,9].includes(g) ? g : 8;
  }); // Default to Grade 8
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    // Prefer explicit user preference if present
    if (userPreferredMode === 'dark' || userPreferredMode === 'light') return userPreferredMode;
    const stored = window.localStorage.getItem('app-mode');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light';
  }); // 'light' or 'dark'
  const didMountRef = useRef(false);

  const changeGrade = (direction) => {
    setGrade(prevGrade => {
      if (direction === 'next') {
        return prevGrade === 9 ? 7 : prevGrade + 1;
      }
      if (direction === 'prev') {
        return prevGrade === 7 ? 9 : prevGrade - 1;
      }
      return prevGrade;
    });
  };

  const toggleMode = () => { setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light')); };

  // Apply theme immediately after render but before paint where possible to avoid flashes on grade/mode change.
  useLayoutEffect(() => {
    const body = window.document.body;
    body.dataset.grade = String(grade);
    if (mode === 'dark') body.classList.add('dark-mode');
    else body.classList.remove('dark-mode');
  }, [grade, mode]);

  // Persist selections
  useEffect(() => { try { window.localStorage.setItem('app-grade', String(grade)); } catch(_){} }, [grade]);
  useEffect(() => { try { window.localStorage.setItem('app-mode', mode); } catch(_){} }, [mode]);

  // (Optional) future sync with UserContext preferredMode if ThemeProvider wraps UserProvider

  const currentTheme = themes[grade][mode];

  const value = { grade, changeGrade, mode, toggleMode, currentTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
