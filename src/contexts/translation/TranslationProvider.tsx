import { createContext, useMemo } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import type { TranslationContextType, TranslationProviderProps } from "./types"

const TranslationContext = createContext<TranslationContextType | null>(null)

const TranslationProvider = <L extends string = string>(
  props: TranslationProviderProps<L>
) => {
  const { locale, translations, fallbackLocale, children } = props

  const translationResult = useTranslation({
    locale,
    translations,
    fallbackLocale,
  })

  const contextValue = useMemo<TranslationContextType>(
    () => translationResult,
    [translationResult]
  )

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

export { TranslationContext, TranslationProvider }
