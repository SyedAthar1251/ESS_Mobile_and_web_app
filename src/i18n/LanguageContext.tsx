import { createContext, useContext, useEffect, useState } from "react";
import i18n from "i18next";
import { LANGUAGES } from "./languages";

type LanguageContextType = {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguage] = useState(LANGUAGES.EN);

  useEffect(() => {
    const savedLang = localStorage.getItem("ess_language") || LANGUAGES.EN;
    setLanguage(savedLang);
    i18n.changeLanguage(savedLang);
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("ess_language", lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === LANGUAGES.AR ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const t = (key: string) => {
    return i18n.t(key);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};
