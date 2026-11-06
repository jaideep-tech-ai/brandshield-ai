"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/brandshield/utils";

// ─── BrandShield AI — bilingual runtime (English ⇄ हिन्दी) ───────────────────
//
// Views never hardcode UI copy. They call `t("ns.key")` from `useLang()`.
// Each feature registers its own dictionary file via `registerDict()` so that
// parallel workstreams never edit the same file:
//
//   const dict = { en: { title: "Scanner" }, hi: { title: "स्कैनर" } };
//   registerDict("scanner", dict);
//
// Lookup order: current language → English → the raw key (never blank UI).

export type Lang = "en" | "hi";
export const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: "en", label: "English", native: "EN" },
  { value: "hi", label: "Hindi", native: "हिंदी" },
];

type Dict = Record<string, string>;
type BiDict = { en: Dict; hi: Dict };

const registry: Record<Lang, Dict> = { en: {}, hi: {} };
const LANG_KEY = "bs_lang";

export function registerDict(ns: string, dict: BiDict) {
  for (const lang of ["en", "hi"] as const) {
    const entries = dict[lang] ?? {};
    for (const [key, value] of Object.entries(entries)) {
      registry[lang][`${ns}.${key}`] = value;
    }
  }
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

// ─── External language store (hydration-safe, lint-clean) ───────────────────

const listeners = new Set<() => void>();
let currentLang: Lang = "en";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "en";
}

// Restore the persisted choice before React hydrates (browser only).
if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === "hi" || saved === "en") currentLang = saved;
    else if (navigator.language?.toLowerCase().startsWith("hi")) currentLang = "hi";
  } catch {
    /* private mode — default English */
  }
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep <html lang> in sync for screen readers / fonts.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    currentLang = l;
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
    listeners.forEach((notify) => notify());
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => {
      let s = registry[lang][key] ?? registry.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLang() {
  return useContext(I18nContext);
}

/** Diagnostic helper — exposes the merged registry for i18n audits/tests. */
export function getRegistry(): Record<Lang, Dict> {
  return registry;
}

// ─── Shared language switcher (landing, auth, app shell) ─────────────────────

export function LangToggle({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border p-0.5",
        dark ? "border-white/25 bg-white/10 backdrop-blur" : "border-slate-200 bg-white",
        className
      )}
    >
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLang(l.value)}
          aria-pressed={lang === l.value}
          title={l.label}
          className={cn(
            "min-h-7 rounded-full px-2.5 text-xs font-semibold transition-all",
            lang === l.value
              ? "bg-teal-700 text-white shadow-sm"
              : dark
                ? "text-white/75 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
          )}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}
