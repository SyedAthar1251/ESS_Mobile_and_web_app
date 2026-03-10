import { createContext, useContext, useEffect, useState } from "react";

/* =============================================================================
   THEME CONFIGURATION
   =============================================================================
   This file defines all available themes for the application.
   
   Available Themes:
   1. modern-purple - Original purple/indigo gradient theme
   2. corporate-blue - ServiceNow-inspired navy/teal professional theme  
   3. neon-green - AI/Cyberpunk theme with neon green accents and glass effects
   
   To add a new theme:
   1. Add a new entry to the ThemeName type
   2. Add theme colors to themeConfigs object
   3. Add CSS variables in global.css for the new theme
   4. Update ThemeSelector component if needed
   ============================================================================= */

export type ThemeName = "modern-purple" | "corporate-blue" | "neon-green" | "light";

/* Theme color configuration - defines colors for each theme */
type ThemeColors = {
  primary: string;        // Main primary color
  primaryLight: string;   // Lighter variant
  primaryDark: string;    // Darker variant
  accent: string;         // Accent/secondary color
  accentLight: string;    // Lighter accent
  background: string;      // Page background (solid color or gradient)
  backgroundSecondary: string; // Card/surface background
  text: string;           // Primary text
  textSecondary: string;  // Secondary text
  border: string;         // Border color
  /* Theme-specific */
  gradient?: string;       // Page/sidebar gradient background
  cardBg?: string;        // Card background color
  glowBorder?: string;    // Glow border effect
  glowShadow?: string;    // Glow shadow effect
  sidebarText?: string;    // Sidebar text color
  sidebarActiveBg?: string; // Sidebar active item background
  sidebarActiveText?: string; // Sidebar active text color
};

/* Theme configurations - add new themes here */
const themeConfigs: Record<ThemeName, ThemeColors> = {
  /* Theme 1: Modern Purple (Default) */
  "modern-purple": {
    primary: "#4f46e5",
    primaryLight: "#818cf8",
    primaryDark: "#312e81",
    accent: "#a855f7",
    accentLight: "#c084fc",
    /* Gradient background for dark effect */
    gradient: "linear-gradient(180deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)",
    background: "#f3f4f6",
    backgroundSecondary: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    sidebarText: "#9CA3AF",  // Gray for non-selected sidebar text
    sidebarActiveBg: "#4f46e5",
    sidebarActiveText: "#ffffff",
  },
  
  /* Theme 2: Corporate Blue (ServiceNow-inspired) */
  "corporate-blue": {
    primary: "#0c2045",
    primaryLight: "#1a2b4a",
    primaryDark: "#061020",
    accent: "#00d4ff",
    accentLight: "#5ce1ff",
    /* Gradient background for dark effect */
    gradient: "linear-gradient(180deg, #061020 0%, #0c2045 50%, #1a2b4a 100%)",
    background: "#f8f9fa",
    backgroundSecondary: "#ffffff",
    text: "#1a1a1a",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    sidebarText: "#9CA3AF",  // Gray for non-selected sidebar text
    sidebarActiveBg: "#0c2045",
    sidebarActiveText: "#ffffff",
  },
  
  /* Theme 3: Neon Green (AI/Cyberpunk with glass effects)
     Background: Linear gradient from left (#1C4E57) → (#1F5E5A) → (#267C63) → right (#2ED573)
     Cards: #59E063
     Border: 2px solid rgba(255,255,255,0.25)
     Shadow: 0 8px 20px rgba(0,0,0,0.35), 0 0 0 3px rgba(255,255,255,0.08)
  */
  "neon-green": {
    primary: "#1C4E57",
    primaryLight: "#1F5E5A",
    primaryDark: "#267C63",
    accent: "#2ED573",
    accentLight: "#59E063",
    /* Page gradient background */
    gradient: "linear-gradient(90deg, #1C4E57 0%, #1F5E5A 35%, #267C63 70%, #2ED573 100%)",
    /* Solid background for fallback */
    background: "#1C4E57",
    backgroundSecondary: "#59E063", // Card bg color
    text: "#0B2F3A",
    textSecondary: "#1C4E57",
    border: "rgba(0,0,0,0.1)",
    glowBorder: "2px solid rgba(0,0,0,0.1)",
    glowShadow: "0 8px 20px rgba(0,0,0,0.15), 0 0 0 3px rgba(0,0,0,0.08)",
    cardBg: "#59E063",
    sidebarText: "#2BE33B",  // Bright green for neon theme
    sidebarActiveBg: "rgba(255,255,255,0.15)",
    sidebarActiveText: "#FFFFFF",
  },
  
  /* Theme 4: Light Theme - Clean white/gray with blue accents */
  "light": {
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
    primaryDark: "#1d4ed8",
    accent: "#0ea5e9",
    accentLight: "#38bdf8",
    /* Light gradient for subtle effect */
    gradient: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
    background: "#f8fafc",
    backgroundSecondary: "#ffffff",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    sidebarText: "#475569",
    sidebarActiveBg: "#3b82f6",
    sidebarActiveText: "#ffffff",
  },
};

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeColors: ThemeColors;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

/* ThemeProvider - wraps the app and provides theme state */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Load saved theme from localStorage or default to light
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem("ess_theme") as ThemeName;
    return savedTheme && themeConfigs[savedTheme] ? savedTheme : "light";
  });

  const themeColors = themeConfigs[theme];

  // Apply theme colors to CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for Tailwind
    root.style.setProperty("--color-primary", themeColors.primary);
    root.style.setProperty("--color-primary-light", themeColors.primaryLight);
    root.style.setProperty("--color-primary-dark", themeColors.primaryDark);
    root.style.setProperty("--color-accent", themeColors.accent);
    root.style.setProperty("--color-accent-light", themeColors.accentLight);
    root.style.setProperty("--color-background", themeColors.background);
    root.style.setProperty("--color-background-secondary", themeColors.backgroundSecondary);
    root.style.setProperty("--color-text", themeColors.text);
    root.style.setProperty("--color-text-secondary", themeColors.textSecondary);
    root.style.setProperty("--color-border", themeColors.border);
    
    // Set data attribute for Tailwind selectors
    root.setAttribute("data-theme", theme);
  }, [theme, themeColors]);

  // Save theme preference to localStorage
  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("ess_theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* Hook to use theme in any component */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
