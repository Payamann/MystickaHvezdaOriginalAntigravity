/**
 * THEME MANAGER
 * Handles dark mode toggle and theme persistence
 * Prevents flash of unstyled theme on page load
 */

const THEME_LOCAL_STORAGE_KEY = 'mh_theme_preference';
const DARK_MODE_CLASS = 'dark-mode';

class ThemeManager {
    static async init() {
        // Apply theme immediately before page renders to prevent flash
        this.applyThemeFromStorage();

        // Load user preferences from backend async
        if (this.isAuthenticated()) {
            setImmediate(() => {
                this.fetchAndApplyUserPreferences().catch(error => {
                    console.warn('[THEME] Failed to load preferences from backend:', error);
                });
            });
        }
    }

    static applyThemeFromStorage() {
        // Check localStorage
        const saved = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

        if (saved === 'dark') {
            document.documentElement.classList.add(DARK_MODE_CLASS);
            return;
        } else if (saved === 'light') {
            document.documentElement.classList.remove(DARK_MODE_CLASS);
            return;
        }

        // Fall back to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add(DARK_MODE_CLASS);
        } else {
            document.documentElement.classList.remove(DARK_MODE_CLASS);
        }
    }

    static async toggleDarkMode() {
        const isDark = document.documentElement.classList.contains(DARK_MODE_CLASS);
        const newTheme = isDark ? 'light' : 'dark';

        this.setTheme(newTheme);

        // Save to localStorage immediately
        localStorage.setItem(THEME_LOCAL_STORAGE_KEY, newTheme);

        // Save to backend if authenticated
        if (this.isAuthenticated()) {
            try {
                await this.updateUserPreferences({
                    dark_mode_enabled: newTheme === 'dark'
                });
            } catch (error) {
                console.error('[THEME] Failed to save preference:', error);
            }
        }

        // Track in GA
        if (typeof gtag !== 'undefined') {
            gtag('event', 'dark_mode_toggle', {
                'enabled': newTheme === 'dark'
            });
        }

        return newTheme;
    }

    static setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add(DARK_MODE_CLASS);
        } else if (theme === 'light') {
            document.documentElement.classList.remove(DARK_MODE_CLASS);
        }
    }

    static isDarkMode() {
        return document.documentElement.classList.contains(DARK_MODE_CLASS);
    }

    static isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }

    static async fetchUserPreferences() {
        const response = await fetch('/api/preferences', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch preferences: ${response.status}`);
        }

        return await response.json();
    }

    static async fetchAndApplyUserPreferences() {
        try {
            const prefs = await this.fetchUserPreferences();
            if (prefs.dark_mode_enabled !== undefined) {
                this.setTheme(prefs.dark_mode_enabled ? 'dark' : 'light');
                localStorage.setItem(THEME_LOCAL_STORAGE_KEY, prefs.dark_mode_enabled ? 'dark' : 'light');
            }
        } catch (error) {
            console.warn('[THEME] Failed to load preferences from backend:', error);
        }
    }

    static async updateUserPreferences(data) {
        const response = await fetch('/api/preferences', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Failed to update preferences: ${response.status}`);
        }

        return await response.json();
    }
}

// Apply theme before page renders (inline in <head>)
if (typeof document !== 'undefined') {
    ThemeManager.applyThemeFromStorage();
}

export default ThemeManager;
