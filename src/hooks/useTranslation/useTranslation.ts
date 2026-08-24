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

// `translations` is read from the props on every render, so the hook only owns
// the active locale and the last error. `propLocale` is the `locale` prop the
// active one was derived from, which is how a prop change is told apart from a
// `setLocale` call.
type HookState<L extends string> = Omit<TranslationState<L>, "translations"> & {
  propLocale: L
}

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
 * @param options.locale - The locale to use (required in standalone mode). Changing it switches the active language, so a consumer can drive the language from the outside. A language set through `setLocale` is kept while this prop stays the same, so passing a literal keeps `setLocale` in charge
 * @param options.translations - An object containing all translations for all locales (required in standalone mode). It is read on every render, so a locale added after mount becomes available to `setLocale`. Keep it in state or memoize it: a new object on every render re-flattens every locale and rebuilds the `intl` instance
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
  const { translations, fallbackLocale } = validatedOptions
  const [state, setState] = useState<HookState<L>>({
    locale: validatedOptions.locale,
    propLocale: validatedOptions.locale,
    error: null,
  })

  // `translations` and `locale` stay props instead of being copied into state.
  // Snapshotting them on the first render leaves a consumer that loads a locale
  // on demand with no way to hand it over: the language would be stuck on
  // whatever was available when the provider mounted.
  //
  // The prop is adjusted during render rather than in an effect so the new
  // language is on screen in the same paint. An effect would render once with
  // the previous locale first.
  if (state.propLocale !== validatedOptions.locale) {
    setState({
      locale: validatedOptions.locale,
      propLocale: validatedOptions.locale,
      error: null,
    })
  }

  const flattenedTranslations = useMemo(() => {
    const locales: Record<string, FlatTranslations> = {}

    Object.entries(translations).forEach(([locale, localeTranslations]) => {
      locales[locale] = flattenTranslations(localeTranslations)
    })

    return locales
  }, [translations])

  // Create intl instance with current locale and translations
  const intl = useMemo(() => {
    const currentTranslations = flattenedTranslations[state.locale]
    const fallbackTranslations =
      fallbackLocale && flattenedTranslations[fallbackLocale]

    if (!currentTranslations && fallbackTranslations) {
      console.error(
        `No translations found for locale "${state.locale}". Using fallback locale "${fallbackLocale}".`
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
      fallbackLocale && state.locale !== fallbackLocale && fallbackTranslations

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
  }, [state.locale, flattenedTranslations, fallbackLocale])

  // Simplified t() function using intl.formatMessage
  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      return intl.formatMessage({ id: key }, values)
    },
    [intl]
  )

  const setLocale = useCallback(
    (newLocale: string) => {
      if (!translations[newLocale]) {
        console.error(
          `Locale "${newLocale}" not found in translations. Available locales: ${Object.keys(translations).join(", ")}`
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
    [translations]
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
