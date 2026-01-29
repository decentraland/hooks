import type { IntlShape } from "@formatjs/intl"

interface Translations {
  [key: string]: string | Translations
}

type LanguageTranslations = Record<string, Translations>

type TranslationState<L extends string = string> = {
  locale: L
  translations: LanguageTranslations
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
  error: string | null
}

export type {
  LanguageTranslations,
  TranslationOptions,
  TranslationResult,
  TranslationState,
  Translations,
}
