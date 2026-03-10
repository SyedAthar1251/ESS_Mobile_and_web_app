import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";

const SplashPage = () => {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user was previously logged in
    const wasLoggedIn = localStorage.getItem('ess_logged_in') === 'true';
    
    // Hide native splash screen when this component loads
    const hideSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.log('SplashScreen not available:', e);
      }
    };
    hideSplash();

    // Wait a bit then navigate
    const timer = setTimeout(() => {
      navigate(wasLoggedIn ? "/dashboard" : "/login", { replace: true });
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-white text-2xl font-bold"
      >
        AlphaX Workforce
      </motion.div>
    </div>
  );
};

export default SplashPage;
