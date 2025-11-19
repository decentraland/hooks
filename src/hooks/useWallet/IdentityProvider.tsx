import React, { ReactNode } from "react"
import { IdentityContext } from "./IdentityContext"
import { useIdentity } from "./useIdentity"
import { useWalletContext } from "./useWalletContext"

interface IdentityProviderProps {
  children: ReactNode
}

export const IdentityProvider: React.FC<IdentityProviderProps> = ({
  children,
}) => {
  const { address, signMessage } = useWalletContext()
  const identityState = useIdentity(address, signMessage)

  return (
    <IdentityContext.Provider value={identityState}>
      {children}
    </IdentityContext.Provider>
  )
}
