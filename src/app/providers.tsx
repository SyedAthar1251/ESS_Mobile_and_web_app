import { AuthProvider } from "../auth/AuthContext";
import { LanguageProvider } from "../i18n/LanguageContext";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
};

export default Providers;
