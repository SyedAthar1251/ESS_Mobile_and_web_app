import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/languages";

const LanguageSwitcher = () => {
  const { language, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = language === LANGUAGES.AR ? "AR" : "EN";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
          isOpen ? "bg-gray-700" : "hover:bg-gray-700"
        }`}
      >
        <span className="text-sm font-bold text-white">{currentLabel}</span>
        <svg
          className={`w-4 h-4 text-white transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-28 bg-gray-800 rounded-lg shadow-lg border border-gray-600 py-1 z-50">
          <button
            onClick={() => {
              changeLanguage(LANGUAGES.EN);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-center px-4 py-3 text-sm font-bold hover:bg-gray-700 ${
              language === LANGUAGES.EN ? "bg-gray-700 text-white" : "text-white"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => {
              changeLanguage(LANGUAGES.AR);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-center px-4 py-3 text-sm font-bold hover:bg-gray-700 ${
              language === LANGUAGES.AR ? "bg-gray-700 text-white" : "text-white"
            }`}
          >
            AR
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
