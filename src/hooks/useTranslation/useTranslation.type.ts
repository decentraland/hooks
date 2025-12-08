import type { IntlShape } from "react-intl"

type Translations = Record<string, string>

type LanguageTranslations = Record<string, Translations>

type TranslationState<L extends string = string> = {
  locale: L
  translations: LanguageTranslations
  loading: boolean
  error: string | null
}

type TranslationOptions<L extends string = string> = {
  locale: L
  translations: LanguageTranslations
  fallbackLocale?: L
}

type TranslationResult = {
  t: (key: string, values?: Record<string, string | number>) => string
  intl: IntlShape
  locale: string
  setLocale: (locale: string) => void
  loading: boolean
  error: string | null
}

export type {
  Translations,
  LanguageTranslations,
  TranslationState,
  TranslationOptions,
  TranslationResult,
}
