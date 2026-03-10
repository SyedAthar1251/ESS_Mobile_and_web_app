import { useState, useEffect } from "react";
import Providers from "./providers";
import AppRoutes from "./routes";
import { useBackButton } from "../hooks/useBackButton";

const App = () => {
  const [isReady, setIsReady] = useState(false);
  
  // Initialize back button handler for mobile
  useBackButton();

  useEffect(() => {
    // Brief delay to ensure native splash screen is shown first
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <Providers>
      <AppRoutes />
    </Providers>
  );
};

export default App;
