import React, { useEffect, useState, useCallback, useMemo, createContext } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitial = () => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("nft-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    // fallback to system preference
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  };

  const [darkMode, setDarkMode] = useState(getInitial);

  const toggleDarkMode = useCallback(() => setDarkMode((v) => !v), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nft-theme", darkMode ? "dark" : "light");
    }
  }, [darkMode]);

  const value = useMemo(
    () => ({ darkMode, toggleDarkMode }),
    [darkMode, toggleDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={`${darkMode ? "dark" : ""} app-theme`}>{children}</div>
    </ThemeContext.Provider>
  );
};

// Hook moved to src/context/hooks/useTheme.js to satisfy Fast Refresh lint rule.
