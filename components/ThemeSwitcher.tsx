
import React, { memo } from 'react';
import { SunIcon, MoonIcon } from './Icons.tsx';

type Theme = 'light' | 'dark';

interface ThemeSwitcherProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = memo(({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const iconClasses = 'absolute w-6 h-6 transition-all duration-300 ease-in-out';

    return (
        <button
            onClick={toggleTheme}
            className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-slate-200/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-bg-primary transition-colors duration-300"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {/* Sun Icon */}
            <SunIcon
                className={`${iconClasses} text-yellow-500 ${
                    theme === 'light'
                        ? 'transform scale-100 opacity-100 rotate-0'
                        : 'transform scale-0 opacity-0 -rotate-90'
                }`}
            />
            {/* Moon Icon */}
            <MoonIcon
                className={`${iconClasses} text-slate-300 ${
                    theme === 'dark'
                        ? 'transform scale-100 opacity-100 rotate-0'
                        : 'transform scale-0 opacity-0 rotate-90'
                }`}
            />
        </button>
    );
});
