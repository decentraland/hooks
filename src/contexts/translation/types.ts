import type { ReactNode } from "react"
import type { LanguageTranslations } from "../../hooks/useTranslation"

type TranslationProviderProps<L extends string = string> = {
  locale: L
  translations: LanguageTranslations
  fallbackLocale?: L
  children: ReactNode
}

type TranslationContextType = {
  t: (key: string, values?: Record<string, string | number>) => string
  intl: import("@formatjs/intl").IntlShape
  locale: string
  setLocale: (locale: string) => void
  error: string | null
}

export type { TranslationProviderProps, TranslationContextType }
