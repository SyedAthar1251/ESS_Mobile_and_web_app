import { useEffect, useState } from "react";

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const toArabic = (value: string) =>
  value.replace(/\d/g, (d) => arabicDigits[Number(d)]);

const useLiveClock = (lang: string) => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const t = now.toLocaleTimeString("en-US");
      setTime(lang === "ar" ? toArabic(t) : t);
    }, 1000);

    return () => clearInterval(timer);
  }, [lang]);

  return time;
};

export default useLiveClock;
