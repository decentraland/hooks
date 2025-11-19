import { createContext } from "react"
import { IdentityContextType } from "./types"

export const IdentityContext = createContext<IdentityContextType | undefined>(
  undefined
)
