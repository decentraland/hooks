import React, {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { IdentityProvider } from "./IdentityProvider"
import { useIdentityContext } from "./useIdentityContext"
import { useWalletContext } from "./useWalletContext"
import { WalletProvider } from "./WalletProvider"
import type { AuthContextType } from "./types"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const AuthContextCombiner: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const walletContext = useWalletContext()
  const identityContext = useIdentityContext()
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  const checkConnection = useCallback(async () => {
    setIsAuthenticating(true)
    try {
      const address = await walletContext.checkConnection()
      if (address) {
        identityContext.loadIdentity(address)
      }
    } catch (error) {
      console.error("Failed to check connection:", error)
    } finally {
      setIsAuthenticating(false)
    }
  }, [walletContext.checkConnection, identityContext.loadIdentity])

  const connect = useCallback(async () => {
    setIsAuthenticating(true)
    try {
      await walletContext.connectWallet()
      await identityContext.createIdentity()
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsAuthenticating(false)
    }
  }, [walletContext.connectWallet, identityContext.createIdentity])

  const logout = useCallback(() => {
    identityContext.clearIdentity()
    walletContext.disconnectWallet()
  }, [identityContext.clearIdentity, walletContext.disconnectWallet])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const combinedContext: AuthContextType = useMemo(() => {
    return {
      ...walletContext,
      ...identityContext,
      isLoadingWallet: walletContext.isLoading,
      isLoadingIdentity: identityContext.isLoading,
      isAuthenticating,
      connect,
      logout,
    }
  }, [
    walletContext.address,
    walletContext.isLoading,
    walletContext.error,
    walletContext.connectWallet,
    walletContext.disconnectWallet,
    walletContext.signMessage,
    identityContext.identity,
    identityContext.isLoading,
    identityContext.clearIdentity,
    identityContext.createIdentity,
    connect,
    logout,
    isAuthenticating,
  ])

  return (
    <AuthContext.Provider value={combinedContext}>
      {children}
    </AuthContext.Provider>
  )
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <WalletProvider>
      <IdentityProvider>
        <AuthContextCombiner>{children}</AuthContextCombiner>
      </IdentityProvider>
    </WalletProvider>
  )
}

export { AuthContext, AuthProvider }
