import { useCallback, useContext, useMemo, useState } from "react"
import { createIntl, createIntlCache } from "@formatjs/intl"
import {
  TranslationOptions,
  TranslationResult,
  TranslationState,
  Translations,
} from "./useTranslation.type"
import { TranslationContext } from "../../contexts/translation/TranslationContext"

// Create a cache for @formatjs/intl to improve performance
const cache = createIntlCache()

type FlatTranslations = Record<string, string>

const flattenTranslations = (
  translations: Translations,
  parentKey = "",
  result: FlatTranslations = {}
): FlatTranslations => {
  Object.entries(translations).forEach(([key, value]) => {
    const translationKey = parentKey ? `${parentKey}.${key}` : key

    if (typeof value === "string") {
      result[translationKey] = value
      return
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenTranslations(value as Translations, translationKey, result)
      return
    }

    console.error(
      `Invalid translation value for key "${translationKey}". Expected string or nested object.`
    )
  })

  return result
}

/**
 * Hook to manage translations in a React application using @formatjs/intl
 *
 * Can be used in two ways:
 * 1. With options (standalone mode): Provides translations directly
 * 2. Without options (context mode): Uses TranslationProvider context
 *
 * @param options - Optional configuration options for translations. If not provided, will use TranslationProvider context.
 * @param options.locale - The initial locale to use (required in standalone mode)
 * @param options.translations - An object containing all translations for all locales (required in standalone mode)
 * @param options.fallbackLocale - Optional fallback locale if a translation is not found
 *
 * @returns An object with translation utilities including the full IntlShape instance
 *
 * @example
 * Standalone mode:
 * ```tsx
 * const translations = {
 *   en: {
 *     "greeting": "Hello, {name}!",
 *     "welcome": "Welcome to our app"
 *   },
 *   es: {
 *     "greeting": "Hola, {name}!",
 *     "welcome": "Bienvenido a nuestra aplicación"
 *   }
 * }
 *
 * function MyComponent() {
 *   const { t, intl, locale, setLocale } = useTranslation({
 *     locale: 'en',
 *     translations
 *   })
 *
 *   return (
 *     <div>
 *       <p>{t('greeting', { name: 'John' })}</p>
 *       <p>{intl.formatNumber(1000)}</p>
 *       <p>{intl.formatDate(new Date())}</p>
 *       <button onClick={() => setLocale('es')}>Switch to Spanish</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Context mode:
 * ```tsx
 * function App() {
 *   return (
 *     <TranslationProvider
 *       locale="en"
 *       translations={{
 *         en: { greeting: "Hello!" },
 *         es: { greeting: "Hola!" }
 *       }}
 *     >
 *       <MyComponent />
 *     </TranslationProvider>
 *   )
 * }
 *
 * function MyComponent() {
 *   const { t, locale, setLocale } = useTranslation()
 *
 *   return (
 *     <div>
 *       <p>{t('greeting')}</p>
 *       <button onClick={() => setLocale('es')}>Switch to Spanish</button>
 *     </div>
 *   )
 * }
 * ```
 */
const useTranslation = <L extends string = string>(
  options?: Partial<TranslationOptions<L>>
): TranslationResult => {
  const context = useContext(TranslationContext)

  if (!options && !context) {
    throw new Error(
      "useTranslation must be used with either options or within a TranslationProvider"
    )
  }

  if (!options && context) {
    return context
  }

  if (options && !options.locale) {
    throw new Error("locale is required when using useTranslation with options")
  }

  if (options && !options.translations) {
    throw new Error(
      "translations is required when using useTranslation with options"
    )
  }

  const validatedOptions = options as TranslationOptions<L>
  const [state, setState] = useState<TranslationState<L>>({
    locale: validatedOptions.locale,
    translations: validatedOptions.translations,
    error: null,
  })

  const flattenedTranslations = useMemo(() => {
    const locales: Record<string, FlatTranslations> = {}

    Object.entries(state.translations).forEach(([locale, translations]) => {
      locales[locale] = flattenTranslations(translations)
    })

    return locales
  }, [state.translations])

  // Create intl instance with current locale and translations
  const intl = useMemo(() => {
    const currentTranslations = flattenedTranslations[state.locale]
    const fallbackTranslations =
      validatedOptions.fallbackLocale &&
      flattenedTranslations[validatedOptions.fallbackLocale]

    if (!currentTranslations && fallbackTranslations) {
      console.error(
        `No translations found for locale "${state.locale}". Using fallback locale "${validatedOptions.fallbackLocale}".`
      )
      return createIntl(
        {
          locale: state.locale,
          messages: fallbackTranslations,
        },
        cache
      )
    }

    if (!currentTranslations) {
      console.error(
        `No translations found for locale "${state.locale}". Using empty translations.`
      )
      return createIntl(
        {
          locale: state.locale,
          messages: {},
        },
        cache
      )
    }

    const shouldMergeFallback =
      validatedOptions.fallbackLocale &&
      state.locale !== validatedOptions.fallbackLocale &&
      fallbackTranslations

    const messages = shouldMergeFallback
      ? {
          ...fallbackTranslations,
          ...currentTranslations,
        }
      : currentTranslations

    return createIntl(
      {
        locale: state.locale,
        messages,
      },
      cache
    )
  }, [state.locale, flattenedTranslations, validatedOptions.fallbackLocale])

  // Simplified t() function using intl.formatMessage
  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      return intl.formatMessage({ id: key }, values)
    },
    [intl]
  )

  const setLocale = useCallback(
    (newLocale: string) => {
      if (!state.translations[newLocale]) {
        console.error(
          `Locale "${newLocale}" not found in translations. Available locales: ${Object.keys(state.translations).join(", ")}`
        )
        setState((current) => ({
          ...current,
          error: `Locale "${newLocale}" not found`,
        }))
        return
      }

      setState((current) => ({
        ...current,
        locale: newLocale as L,
        error: null,
      }))
    },
    [state.translations]
  )

  return {
    t,
    intl,
    locale: state.locale,
    setLocale,
    error: state.error,
  }
}

export { useTranslation }
