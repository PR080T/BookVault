import { useState, useEffect } from 'react';
import { RiSunLine, RiMoonLine } from 'react-icons/ri';

function DarkModeToggle({ className = "", size = "md" }) {
    const [isDark, setIsDark] = useState(false);

    // Check for saved theme preference or default to light mode
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12"
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5", 
        lg: "w-6 h-6"
    };

    return (
        <button
            onClick={toggleDarkMode}
            className={`${sizeClasses[size]} ${className} relative inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm hover:shadow-md group`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <div className="relative">
                {isDark ? (
                    <RiSunLine className={`${iconSizes[size]} text-amber-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`} />
                ) : (
                    <RiMoonLine className={`${iconSizes[size]} text-slate-600 dark:text-slate-400 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12`} />
                )}
            </div>
        </button>
    );
}

export default DarkModeToggle;