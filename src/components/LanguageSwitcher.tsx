import { useLanguage } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/languages";

const LanguageSwitcher = () => {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-1">
      <button
        onClick={() => changeLanguage(LANGUAGES.EN)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === LANGUAGES.EN
            ? "bg-indigo-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage(LANGUAGES.AR)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === LANGUAGES.AR
            ? "bg-indigo-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        عرب
      </button>
    </div>
  );
};

export default LanguageSwitcher;
