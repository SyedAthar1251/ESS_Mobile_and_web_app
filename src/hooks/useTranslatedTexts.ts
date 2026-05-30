import { useState, useEffect, useRef, useCallback } from "react";
import {
  translateDynamic,
  translateBatch,
  shouldTranslate,
} from "../services/translation.service";

// ═══════════════════════════════════════════════════════════════
//  PUBLIC BATCH HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * React hook that translates a list of dynamic strings.
 *
 * Safe for use inside components:
 *  • No infinite re-renders — the effect only re-fires when `texts`
 *    or `lang` actually change (deep-compare via JSON.stringify).
 *  • Deduplicates requests via the service-level in-flight map.
 *  • Returns original texts while loading, then swaps in translations
 *    once the API responds.
 *
 * Usage:
 *   const translated = useTranslatedTexts(
 *     salaryDetails ? [salaryDetails.employee_name, salaryDetails.status] : [],
 *     language,
 *   );
 */
export const useTranslatedTexts = (
  texts: string[],
  lang: string,
): Record<string, string> => {
  const [result, setResult] = useState<Record<string, string>>({});
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    const effective = texts.filter(shouldTranslate);
    const key = JSON.stringify({ texts: effective, lang });

    // Deep-compare: skip if nothing changed
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    // English → identity
    if (lang === "en") {
      const identity: Record<string, string> = {};
      effective.forEach((t) => (identity[t] = t));
      setResult(identity);
      return;
    }

    if (effective.length === 0) {
      setResult({});
      return;
    }

    let cancelled = false;

    // Set originals immediately while loading
    const originals: Record<string, string> = {};
    effective.forEach((t) => (originals[t] = t));
    setResult(originals);

    translateBatch(effective, lang).then((map) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      effective.forEach((t) => {
        next[t] = map.get(t) ?? t;
      });
      setResult(next);
    });

    return () => {
      cancelled = true;
    };
  }, [texts, lang]);

  return result;
};

// ═══════════════════════════════════════════════════════════════
//  SINGLE-TEXT HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * Translate a single dynamic string. Returns the original while loading.
 */
export const useTranslatedText = (
  text: string,
  lang: string,
): string => {
  const [translated, setTranslated] = useState<string>(text);
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    const key = `${lang}|${text}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    if (lang === "en" || !shouldTranslate(text)) {
      setTranslated(text);
      return;
    }

    let cancelled = false;
    setTranslated(text);           // show original immediately

    translateDynamic(text, lang).then((result) => {
      if (!cancelled) setTranslated(result);
    });

    return () => {
      cancelled = true;
    };
  }, [text, lang]);

  return translated;
};
