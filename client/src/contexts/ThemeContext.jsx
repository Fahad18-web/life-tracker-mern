import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_THEME,
  DEFAULT_PRESET,
  isValidMode,
  isValidPreset
} from '../config/themePresets';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

function applyToDom(mode, preset) {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-accent', preset);
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('lt_theme');
    return isValidMode(saved) ? saved : DEFAULT_THEME;
  });

  const [preset, setPresetState] = useState(() => {
    const saved = localStorage.getItem('lt_theme_preset');
    return isValidPreset(saved) ? saved : DEFAULT_PRESET;
  });

  // Apply immediately (avoid flash)
  useEffect(() => {
    applyToDom(theme, preset);
  }, []);

  useEffect(() => {
    applyToDom(theme, preset);
    localStorage.setItem('lt_theme', theme);
    localStorage.setItem('lt_theme_preset', preset);
  }, [theme, preset]);

  const setTheme = useCallback((mode) => {
    if (isValidMode(mode)) setThemeState(mode);
  }, []);

  const setPreset = useCallback((id) => {
    if (isValidPreset(id)) setPresetState(id);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /** Sync from server preferences (login / profile load) */
  const applyFromPreferences = useCallback((preferences = {}) => {
    if (isValidMode(preferences.theme)) {
      setThemeState(preferences.theme);
    }
    if (isValidPreset(preferences.themePreset)) {
      setPresetState(preferences.themePreset);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        preset,
        setTheme,
        setPreset,
        toggleTheme,
        applyFromPreferences
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};