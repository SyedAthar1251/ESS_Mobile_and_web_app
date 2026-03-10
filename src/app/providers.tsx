import { AuthProvider } from "../auth/AuthContext";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ThemeProvider } from "../store/ThemeContext";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default Providers;
