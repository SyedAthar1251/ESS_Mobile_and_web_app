import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import AlphaXLogo from "../../components/AlphaXLogo";

const SplashPage = () => {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const wasLoggedIn = localStorage.getItem('ess_logged_in') === 'true';
    const target = wasLoggedIn ? "/dashboard" : "/login";
    
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
      navigate(target, { replace: true });
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #3E6FB0, #1D4E86)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 390 844"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="splashBlur1">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="splashBlur2">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="splashBlur3">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <g filter="url(#splashBlur1)" opacity="0.12">
          <path fill="white">
            <animate
              attributeName="d"
              dur="9s"
              repeatCount="indefinite"
              values="M340,20 C380,10 410,55 395,105 C380,155 340,165 308,138 C275,112 278,70 305,45 C318,32 330,25 340,20Z;M352,15 C395,5 418,52 402,106 C386,158 342,170 310,142 C278,114 282,68 310,42 C324,28 338,20 352,15Z;M340,20 C380,10 410,55 395,105 C380,155 340,165 308,138 C275,112 278,70 305,45 C318,32 330,25 340,20Z"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
            />
          </path>
        </g>
        <g filter="url(#splashBlur2)" opacity="0.10">
          <path fill="white">
            <animate
              attributeName="d"
              dur="11s"
              repeatCount="indefinite"
              values="M30,700 C5,665 18,628 55,615 C92,602 132,630 126,668 C120,706 82,730 50,724 C28,720 38,716 30,700Z;M18,715 C-8,678 8,636 48,620 C88,604 133,634 126,674 C118,714 76,740 44,734 C20,728 30,724 18,715Z;M30,700 C5,665 18,628 55,615 C92,602 132,630 126,668 C120,706 82,730 50,724 C28,720 38,716 30,700Z"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
            />
          </path>
        </g>
        <g filter="url(#splashBlur3)" opacity="0.07">
          <path fill="white">
            <animate
              attributeName="d"
              dur="7s"
              repeatCount="indefinite"
              values="M320,380 C345,360 368,378 362,408 C356,438 328,450 308,434 C288,418 294,390 312,376 C318,370 316,382 320,380Z;M328,372 C355,352 376,372 369,404 C362,436 332,450 310,432 C288,414 296,384 316,370 C323,364 322,374 328,372Z;M320,380 C345,360 368,378 362,408 C356,438 328,450 308,434 C288,418 294,390 312,376 C318,370 316,382 320,380Z"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
            />
          </path>
        </g>
      </svg>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <AlphaXLogo size={100} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{ textAlign: "center" }}
        >
          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "white",
              margin: "20px 0 0",
              letterSpacing: "0.3px",
            }}
          >
            AlphaX Workforce
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              margin: "5px 0 0",
              letterSpacing: "2px",
            }}
          >
            EMPLOYEE SELF SERVICE
          </p>
        </motion.div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 44,
          zIndex: 1,
          display: "flex",
          gap: 8,
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.22,
              ease: "easeInOut",
            }}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "white",
              display: "inline-block",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashPage;
