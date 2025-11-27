import { AuthIdentity } from "@dcl/crypto"

interface WalletContextType {
  address: string | null
  isLoading: boolean
  error: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  signMessage: (message: string) => Promise<string>
  checkConnection: () => Promise<string | null>
}

interface IdentityContextType {
  identity: AuthIdentity | null
  isLoading: boolean
  clearIdentity: () => void
  createIdentity: () => Promise<void>
  loadIdentity: (address: string) => void
}

interface AuthContextType extends WalletContextType, IdentityContextType {
  isAuthenticating: boolean
  isLoadingWallet: boolean
  isLoadingIdentity: boolean
  connect: () => Promise<void>
  logout: () => void
}

export type { AuthContextType, IdentityContextType, WalletContextType }
