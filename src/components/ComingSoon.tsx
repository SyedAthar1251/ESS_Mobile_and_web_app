import { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../store/ThemeContext";
import { motion } from "framer-motion";

interface ComingSoonProps {
  children: ReactNode;
  title?: string;
  isOpen?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

const ComingSoon = ({ children, title, isOpen = true, showCloseButton = false, onClose }: ComingSoonProps) => {
  const { language, t } = useLanguage();
  const { themeColors } = useTheme();

  const isRTL = language === "ar";

  // If isOpen is false, just render children without the overlay
  if (!isOpen) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Actual Page Content - Blurred */}
      <div className="filter blur-md pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Coming Soon Banner Overlay - Fixed but non-blocking so header remains interactive */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
        onClick={showCloseButton ? onClose : undefined}
      >
        <div 
          className="rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center border-2 pointer-events-auto"
          style={{ 
            borderColor: themeColors.primary,
            backgroundColor: 'rgba(255, 255, 255, 0.98)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600 p-1`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

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
            <div className="flex justify-center">
              <img 
                src="/icon/comingsoon.png" 
                alt="Coming Soon" 
                className="w-24 h-24 object-contain"
              />
            </div>
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
