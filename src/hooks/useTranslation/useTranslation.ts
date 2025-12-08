import { useCallback, useState } from "react"
import {
  TranslationOptions,
  TranslationResult,
  TranslationState,
} from "./useTranslation.type"

/**
 * Simple interpolation function to replace placeholders in translation strings
 * @param text - The translation string with placeholders like {name}
 * @param values - The values to interpolate
 * @returns The interpolated string
 */
const interpolate = (
  text: string,
  values?: Record<string, string | number>
): string => {
  if (!values) return text

  return Object.entries(values).reduce((result, [key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g")
    return result.replace(regex, String(value))
  }, text)
}

/**
 * Hook to manage translations in a React application
 *
 * @param options - Configuration options for translations
 * @param options.locale - The initial locale to use
 * @param options.translations - An object containing all translations for all locales
 * @param options.fallbackLocale - Optional fallback locale if a translation is not found
 *
 * @returns An object with translation utilities
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
 *   const { t, locale, setLocale } = useTranslation({
 *     locale: 'en',
 *     translations
 *   })
 *
 *   return (
 *     <div>
 *       <p>{t('greeting', { name: 'John' })}</p>
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

  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const currentTranslations = state.translations[state.locale]

      if (currentTranslations && currentTranslations[key]) {
        return interpolate(currentTranslations[key], values)
      }

      if (options.fallbackLocale && state.locale !== options.fallbackLocale) {
        const fallbackTranslations = state.translations[options.fallbackLocale]
        if (fallbackTranslations && fallbackTranslations[key]) {
          console.warn(
            `Translation key "${key}" not found for locale "${state.locale}", using fallback locale "${options.fallbackLocale}"`
          )
          return interpolate(fallbackTranslations[key], values)
        }
      }

      console.warn(
        `Translation key "${key}" not found for locale "${state.locale}"`
      )
      return key
    },
    [state.locale, state.translations, options.fallbackLocale]
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
    locale: state.locale,
    setLocale,
    loading: state.loading,
    error: state.error,
  }
}

export { useTranslation }
