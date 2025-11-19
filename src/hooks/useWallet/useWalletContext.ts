import { useContext } from "react"
import { WalletContextType } from "./types"
import { WalletContext } from "./WalletContext"

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider")
  }
  return context
}
