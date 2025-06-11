import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'auto';

export interface UseThemeReturn {
    theme: Theme;
    effectiveTheme: 'dark' | 'light';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('observatory-theme') as Theme) || 'auto';
        }
        return 'auto';
    });

    const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('dark');

    // Listen for system theme changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Calculate effective theme
    const effectiveTheme = theme === 'auto' ? systemTheme : theme;

    // Apply theme to document
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [effectiveTheme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('observatory-theme', newTheme);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        if (theme === 'dark') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('auto');
        } else {
            setTheme('dark');
        }
    }, [theme, setTheme]);

    return {
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme
    };
} 