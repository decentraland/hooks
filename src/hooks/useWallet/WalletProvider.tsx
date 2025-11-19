import React, { ReactNode } from "react"
import { useWalletInternal } from "./useWalletInternal"
import { WalletContext } from "./WalletContext"

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const walletState = useWalletInternal()

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  )
}
