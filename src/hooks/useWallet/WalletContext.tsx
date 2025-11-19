import { createContext } from "react"
import { WalletContextType } from "./types"

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
)
