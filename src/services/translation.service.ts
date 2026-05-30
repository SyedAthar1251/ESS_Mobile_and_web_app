import api from "./api";
import { LANGUAGES } from "../i18n/languages";

export { LANGUAGES };

interface TranslationItem {
  original: string;
  translated: string;
}

interface BatchTranslateResponse {
  message?: TranslationItem[];
}

const CHUNK_SIZE = 5;
const API_TIMEOUT_MS = 15000;

const getUserCredentials = (): {
  companyUrl: string;
  apiKey: string;
  apiSecret: string;
} => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

const getAuthHeader = (apiKey: string, apiSecret: string) => ({
  Authorization: `token ${apiKey}:${apiSecret}`,
});

const getBaseUrl = (): string => {
  const { companyUrl } = getUserCredentials();
  return companyUrl.replace(/\/$/, "");
};

const translationCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

const buildCacheKey = (lang: string, text: string): string =>
  `${lang}|${text}`;

const NUMBER_RE = /^-?\d[\d,]*\.?\d*$/;
const CURRENCY_RE = /^[€$£¥₹A-Z]{1,3}\s*-?\d/;
const DATE_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//i;
const ID_RE = /^[A-Z]{2,6}-\d{4,}$/i;

export const shouldTranslate = (text: string): boolean => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (NUMBER_RE.test(trimmed)) return false;
  if (CURRENCY_RE.test(trimmed)) return false;
  if (DATE_RE.test(trimmed)) return false;
  if (EMAIL_RE.test(trimmed)) return false;
  if (URL_RE.test(trimmed)) return false;
  if (ID_RE.test(trimmed)) return false;
  return true;
};

const sanitizeTexts = (texts: string[]): string[] =>
  texts
    .filter(Boolean)
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const translationArrayToMap = (
  items: TranslationItem[],
): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const item of items) {
    if (item.original) {
      map[item.original] = item.translated ?? item.original;
    }
  }
  return map;
};

const sendTranslationRequest = async (
  texts: string[],
  lang: string,
): Promise<Record<string, string>> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();
  const url = `${cleanUrl}/api/method/employee_self_service.mobile.translation.translate_dynamic_text`;

  const payload = new URLSearchParams();
  payload.append("texts", JSON.stringify(texts));
  payload.append("target_language", lang);

  console.log("[Translate API] Request:", {
    url,
    textCount: texts.length,
    texts,
    lang,
    payload: payload.toString(),
  });

  const response = await api.post<BatchTranslateResponse>(
    url,
    payload,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeader(apiKey, apiSecret),
      },
    },
  );

  console.log("[Translate API] Raw response:", JSON.stringify(response?.data, null, 2));

  const message = response?.data?.message;
  console.log("[Translate API] Message field:", JSON.stringify(message, null, 2));

  if (!Array.isArray(message)) {
    console.warn("[Translate API] Expected message to be an array, got:", typeof message, message);
    return {};
  }

  const map = translationArrayToMap(message);
  console.log("[Translate API] Parsed map:", map);

  return map;
};

export const translateDynamic = async (
  text: string,
  lang: string = LANGUAGES.EN,
): Promise<string> => {
  if (lang === LANGUAGES.EN) {
    return text;
  }

  if (!shouldTranslate(text)) {
    console.log(
      `[Translate] SKIP — "${text}" (pattern match: number/currency/date/email/url/id)`,
    );
    return text;
  }

  const cacheKey = buildCacheKey(lang, text);

  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!;
    console.log(`[Translate] CACHE HIT — "${text}" → "${cached}"`);
    return cached;
  }

  if (inFlightRequests.has(cacheKey)) {
    console.log(`[Translate] IN-FLIGHT DEDUP — "${text}" (waiting…)`);
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = (async (): Promise<string> => {
    try {
      console.log(`[Translate] API CALL — "${text}" (lang: ${lang})`);

      const translations = await sendTranslationRequest([text], lang);
      const translated = translations[text] ?? text;

      translationCache.set(cacheKey, translated);
      console.log(`[Translate] API RESULT — "${text}" → "${translated}"`);

      return translated;
    } catch (error: any) {
      console.error(`[Translate] API ERROR — "${text}":`, {
        message: error?.message,
        response: error?.response?.data,
        stack: error?.stack,
      });
      return text;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const translateBatch = async (
  texts: string[],
  lang: string = LANGUAGES.EN,
): Promise<Map<string, string>> => {
  if (lang === LANGUAGES.EN) {
    const identity = new Map<string, string>();
    texts.forEach((t) => identity.set(t, t));
    return identity;
  }

  const cleanTexts = sanitizeTexts(texts);
  console.log(`[Translate Batch] Input: ${texts.length} → sanitized: ${cleanTexts.length}`);

  const result = new Map<string, string>();
  const uncached: string[] = [];

  for (const text of cleanTexts) {
    if (!shouldTranslate(text)) {
      result.set(text, text);
      continue;
    }
    const cacheKey = buildCacheKey(lang, text);
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey)!;
      result.set(text, cached);
      console.log(`[Translate Batch] CACHE HIT — "${text}" → "${cached}"`);
    } else {
      uncached.push(text);
    }
  }

  if (uncached.length === 0) {
    console.log("[Translate Batch] ALL CACHED — no API call needed");
    return result;
  }

  const chunks = chunkArray(uncached, CHUNK_SIZE);
  console.log(
    `[Translate Batch] ${uncached.length} texts → ${chunks.length} chunk(s) of max ${CHUNK_SIZE}`,
  );

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(
      `[Translate Batch] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} texts)`,
    );

    try {
      const translations = await sendTranslationRequest(chunk, lang);

      for (const original of chunk) {
        const translated = translations[original] ?? original;
        translationCache.set(buildCacheKey(lang, original), translated);
        result.set(original, translated);
        console.log(
          `[Translate Batch] RESULT — "${original}" → "${translated}"`,
        );
      }
    } catch (error: any) {
      console.error(
        `[Translate Batch] CHUNK ${i + 1}/${chunks.length} FAILED:`,
        {
          texts: chunk,
          message: error?.message,
          response: error?.response?.data,
        },
      );
      for (const original of chunk) {
        result.set(original, original);
      }
    }
  }

  return result;
};

export const translateObjectFields = async <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
  lang: string = LANGUAGES.EN,
): Promise<T> => {
  if (lang === LANGUAGES.EN) return obj;

  const values = fields
    .map((f) => obj[f])
    .filter((v) => typeof v === "string") as string[];

  if (values.length === 0) return obj;

  const translatedMap = await translateBatch(values, lang);

  const result = { ...obj };
  for (const field of fields) {
    const original = obj[field];
    if (typeof original === "string") {
      (result as any)[field] = translatedMap.get(original) ?? original;
    }
  }
  return result;
};

export const translateArrayField = async <T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  lang: string = LANGUAGES.EN,
): Promise<T[]> => {
  if (lang === LANGUAGES.EN) return items;

  const values = sanitizeTexts(
    items.map((item) => item[field]).filter((v) => v !== undefined && v !== null) as string[],
  );

  if (values.length === 0) return items;

  const translatedMap = await translateBatch(values, lang);

  return items.map((item) => {
    const original = item[field];
    if (typeof original === "string") {
      return { ...item, [field]: translatedMap.get(original) ?? original };
    }
    return item;
  });
};
