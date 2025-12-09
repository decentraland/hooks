import { createContext } from "react"
import type { TranslationContextType } from "./types"

const TranslationContext = createContext<TranslationContextType | null>(null)

export { TranslationContext }
