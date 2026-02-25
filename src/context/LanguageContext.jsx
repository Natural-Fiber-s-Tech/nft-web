import React, { useEffect, useMemo, useState, useCallback, createContext } from "react";
import { messages } from "../config/i18n";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const getInitial = () => {
    // 1) user choice
    const stored =
      typeof window !== "undefined" && localStorage.getItem("lang");
    if (stored && ["es", "en"].includes(stored)) return stored;
    // 2) browser preference
    const navLang =
      typeof navigator !== "undefined" &&
      (navigator.language || navigator.userLanguage);
    if (navLang && String(navLang).toLowerCase().startsWith("en")) return "en";
    return "es";
  };

  const [language, setLanguage] = useState(getInitial);

  useEffect(() => {
    try {
      localStorage.setItem("lang", language);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("lang", language);
      }
    } catch (err) {
      console.warn("LanguageContext: failed to persist or set document lang", err);
    }
  }, [language]);

  const toggleLanguage = useCallback((lang) => {
    if (["es", "en"].includes(lang)) setLanguage(lang);
  }, []);

  const t = useMemo(() => {
    const dict = messages[language] || messages.es || {};
    return (key, vars) => {
      const template = key
        .split(".")
        .reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), dict);
      const base = template ?? key;
      if (!vars) return base;
      return Object.keys(vars).reduce(
        (s, name) => s.replace(new RegExp(`{${name}}`, "g"), vars[name]),
        base
      );
    };
  }, [language]);

  const value = useMemo(() => ({ language, toggleLanguage, t }), [language, toggleLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook moved to src/context/hooks/useLanguage.js to satisfy Fast Refresh lint rule.
