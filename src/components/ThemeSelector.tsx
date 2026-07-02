import { useTheme, ThemeName } from "../store/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

/* =============================================================================
   THEME SELECTOR COMPONENT
   =============================================================================
   This component displays available themes and allows users to switch between them.
   Each theme has a preview showing its color scheme.
   
   Available Themes:
   1. Modern Purple - Original indigo/purple gradient
   2. Corporate Blue - ServiceNow-inspired navy/teal
   3. Neon Green - AI/Cyberpunk with neon accents and glass effects
   ============================================================================= */

const ThemeSelector = () => {
  const { theme, setTheme, themeColors } = useTheme();
  const { t } = useLanguage();

  /* Theme definitions with preview colors */
  const themes: { id: ThemeName; name: string; description: string; preview: string }[] = [
    {
      id: "modern-purple",
      name: "Modern Purple",
      description: "Vibrant purple & indigo gradient",
      preview: "linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)",
    },
    {
      id: "corporate-blue",
      name: "Corporate Blue",
      description: "Professional navy & teal (ServiceNow)",
      preview: "linear-gradient(135deg, #0c2045 0%, #00d4ff 100%)",
    },
    {
      id: "neon-green",
      name: "Neon Green",
      description: "AI/Cyberpunk with glass effects",
      preview: "linear-gradient(135deg, #0B2F3A 0%, #59E063 100%)",
    },
    {
      id: "light",
      name: "Light",
      description: "Clean white with blue accents",
      preview: "linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)",
    },
  ];

  const themeTileColors: Record<ThemeName, { bg: string; border: string; selectedBg: string }> = {
    "modern-purple": {
      bg: "rgba(79, 70, 229, 0.06)",
      border: "rgba(79, 70, 229, 0.25)",
      selectedBg: "rgba(79, 70, 229, 0.12)",
    },
    "corporate-blue": {
      bg: "rgba(12, 32, 69, 0.05)",
      border: "rgba(12, 32, 69, 0.22)",
      selectedBg: "rgba(12, 32, 69, 0.10)",
    },
    "neon-green": {
      bg: "rgba(46, 213, 115, 0.07)",
      border: "rgba(46, 213, 115, 0.30)",
      selectedBg: "rgba(46, 213, 115, 0.14)",
    },
    "light": {
      bg: "rgba(59, 130, 246, 0.06)",
      border: "rgba(59, 130, 246, 0.25)",
      selectedBg: "rgba(59, 130, 246, 0.12)",
    },
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium" style={{ color: themeColors.text }}>
        {t("selectTheme") || "Select Theme"}
      </label>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((themeOption) => {
          const colors = themeTileColors[themeOption.id];
          const isSelected = theme === themeOption.id;
          return (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className="relative p-3 rounded-2xl border-2 transition-all duration-200"
              style={{
                backgroundColor: isSelected ? colors.selectedBg : colors.bg,
                borderColor: isSelected ? colors.border : "transparent",
                boxShadow: isSelected ? `0 4px 12px ${colors.border}` : "none",
              }}
            >
              {/* Theme Preview */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: themeOption.preview }}
                >
                  {themeOption.id === "modern-purple" ? (
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  ) : themeOption.id === "corporate-blue" ? (
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : themeOption.id === "light" ? (
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: isSelected ? "#2C2F36" : themeColors.textSecondary }}
                >
                  {themeOption.name}
                </span>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.border }}
                >
                  <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
