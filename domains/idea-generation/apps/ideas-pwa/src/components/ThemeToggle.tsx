import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, toggleTheme, systemPreference } = useTheme();

  const isDark = theme === 'dark';
  const isSystemDark = systemPreference === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-200 ease-in-out
        ${isDark 
          ? 'bg-gray-800 text-gray-100 border border-gray-700 hover:bg-gray-700' 
          : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}
        ${className}
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <svg
          className={`
            absolute w-4 h-4 transition-all duration-300 ease-in-out
            ${isDark 
              ? 'opacity-0 scale-0 rotate-90' 
              : 'opacity-100 scale-100 rotate-0'
            }
          `}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>

        {/* Moon Icon */}
        <svg
          className={`
            absolute w-4 h-4 transition-all duration-300 ease-in-out
            ${isDark 
              ? 'opacity-100 scale-100 rotate-0' 
              : 'opacity-0 scale-0 -rotate-90'
            }
          `}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>

      {showLabel && (
        <span className="text-sm font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}

      {/* System preference indicator */}
      {theme === systemPreference && (
        <div 
          className={`
            w-1.5 h-1.5 rounded-full
            ${isDark ? 'bg-blue-400' : 'bg-blue-600'}
          `}
          title="Following system preference"
        />
      )}
    </button>
  );
};