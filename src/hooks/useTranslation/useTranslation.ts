import { useCallback, useMemo, useState } from "react"
import { createIntl, createIntlCache } from "@formatjs/intl"
import {
  TranslationOptions,
  TranslationResult,
  TranslationState,
} from "./useTranslation.type"

// Create a cache for @formatjs/intl to improve performance
const cache = createIntlCache()

/**
 * Hook to manage translations in a React application using @formatjs/intl
 *
 * @param options - Configuration options for translations
 * @param options.locale - The initial locale to use
 * @param options.translations - An object containing all translations for all locales
 * @param options.fallbackLocale - Optional fallback locale if a translation is not found
 *
 * @returns An object with translation utilities including the full IntlShape instance
 *
 * @example
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
 */
const useTranslation = <L extends string = string>(
  options: TranslationOptions<L>
): TranslationResult => {
  const [state, setState] = useState<TranslationState<L>>({
    locale: options.locale,
    translations: options.translations,
    loading: false,
    error: null,
  })

  // Create intl instance with current locale and translations
  const intl = useMemo(() => {
    const currentTranslations = state.translations[state.locale]

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

    // Merge with fallback locale if provided
    const messages =
      options.fallbackLocale && state.locale !== options.fallbackLocale
        ? {
            ...state.translations[options.fallbackLocale],
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
  }, [state.locale, state.translations, options.fallbackLocale])

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
    loading: state.loading,
    error: state.error,
  }
}

export { useTranslation }
