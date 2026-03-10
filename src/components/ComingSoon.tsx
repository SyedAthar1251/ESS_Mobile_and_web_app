import { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../store/ThemeContext";
import { motion } from "framer-motion";

interface ComingSoonProps {
  children: ReactNode;
  title?: string;
}

const ComingSoon = ({ children, title }: ComingSoonProps) => {
  const { language, t } = useLanguage();
  const { themeColors } = useTheme();

  const isRTL = language === "ar";

  return (
    <div className="relative">
      {/* Actual Page Content - Blurred */}
      <div className="filter blur-md pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Coming Soon Banner Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        <div 
          className="rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center border-2"
          style={{ 
            borderColor: themeColors.primary,
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {/* Model Name / Feature Title */}
          <div 
            className="text-sm font-medium mb-3 pb-2 border-b"
            style={{ 
              color: themeColors.textSecondary,
              borderColor: themeColors.primary + '30'
            }}
          >
            {title || (isRTL ? "القسم" : "Module")}
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center mb-4">
            <div 
              className="h-px flex-1"
              style={{ backgroundColor: themeColors.primary + '30' }}
            />
          </div>

          {/* Coming Soon Icon & Text */}
          <div className="space-y-3">
            <div className="text-4xl">🚧</div>
            <h2 
              className="text-xl font-bold"
              style={{ color: themeColors.text }}
            >
              {isRTL ? "قريباً" : "Coming Soon"}
            </h2>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>
              {isRTL 
                ? "ستكون هذه الميزة متاحة في التحديث القادم" 
                : "This feature will be available in next update."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
