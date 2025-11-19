import { useCallback, useEffect, useState } from "react"
import { WalletOptions, WalletResult, WalletState } from "./useWallet.type"
import { sentry } from "../../utils/development/sentry"

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: {
        method: string
        params?: unknown[]
      }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (
        event: string,
        handler: (...args: unknown[]) => void
      ) => void
      selectedAddress?: string
    }
  }
}

const getStoredAddress = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }
  try {
    return localStorage.getItem("wallet_address")
  } catch {
    return null
  }
}

const setStoredAddress = (address: string | null): void => {
  if (typeof window === "undefined") {
    return
  }
  try {
    if (address) {
      localStorage.setItem("wallet_address", address)
    } else {
      localStorage.removeItem("wallet_address")
    }
  } catch {
    // Ignore storage errors
  }
}

const isWalletAvailable = (): boolean => {
  return typeof window !== "undefined" && Boolean(window.ethereum)
}

const requestAccounts = async (): Promise<string[]> => {
  if (!isWalletAvailable()) {
    throw new Error("Wallet provider not available")
  }

  const accounts = (await window.ethereum!.request({
    method: "eth_requestAccounts",
  })) as string[]

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found")
  }

  return accounts
}

const getAccounts = async (): Promise<string[]> => {
  if (!isWalletAvailable()) {
    throw new Error("Wallet provider not available")
  }

  const accounts = (await window.ethereum!.request({
    method: "eth_accounts",
  })) as string[]

  return accounts || []
}

/**
 * Hook to manage wallet connection state and operations
 *
 * @param options - Configuration options for the wallet hook
 * @param options.autoConnect - Whether to automatically connect on mount (default: false)
 * @param options.onConnect - Callback fired when wallet connects
 * @param options.onDisconnect - Callback fired when wallet disconnects
 * @param options.onError - Callback fired when an error occurs
 * @returns Wallet connection state and operations
 *
 * @example
 * ```ts
 * const { address, isConnected, connect, disconnect } = useWallet({
 *   autoConnect: true,
 *   onConnect: (address) => console.log('Connected:', address),
 * })
 * ```
 */
const useWallet = (options: WalletOptions = {}): WalletResult => {
  const { autoConnect = false, onConnect, onDisconnect, onError } = options

  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  })

  const handleAccountsChanged = useCallback(
    (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || []
      if (accounts.length === 0) {
        setState((prev) => ({
          ...prev,
          address: null,
          isConnected: false,
        }))
        setStoredAddress(null)
        onDisconnect?.()
      } else {
        const newAddress = accounts[0]?.toLowerCase() || null
        setState((prev) => ({
          ...prev,
          address: newAddress,
          isConnected: Boolean(newAddress),
          error: null,
        }))
        setStoredAddress(newAddress)
        if (newAddress) {
          setState((prev) => {
            if (prev.address !== newAddress) {
              onConnect?.(newAddress)
            }
            return prev
          })
        }
      }
    },
    [onConnect, onDisconnect]
  )

  const connect = useCallback(async () => {
    if (!isWalletAvailable()) {
      const error = new Error("Wallet provider not available")
      setState((prev) => ({
        ...prev,
        error,
        isConnecting: false,
      }))
      onError?.(error)
      return
    }

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))

    try {
      const accounts = await requestAccounts()
      const address = accounts[0]?.toLowerCase() || null

      if (!address) {
        throw new Error("No address returned from wallet")
      }

      setState((prev) => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
      }))
      setStoredAddress(address)
      onConnect?.(address)
    } catch (error) {
      const walletError =
        error instanceof Error ? error : new Error("Unknown wallet error")
      console.error(walletError)
      sentry((sentry) => sentry.captureException(walletError))

      setState((prev) => ({
        ...prev,
        error: walletError,
        isConnecting: false,
      }))
      onError?.(walletError)
    }
  }, [onConnect, onError])

  const disconnect = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      address: null,
      isConnected: false,
      error: null,
    }))
    setStoredAddress(null)
    onDisconnect?.()
  }, [onDisconnect])

  const reconnect = useCallback(async () => {
    await disconnect()
    await connect()
  }, [connect, disconnect])

  useEffect(() => {
    if (!isWalletAvailable()) {
      return
    }

    const checkConnection = async () => {
      try {
        const accounts = await getAccounts()
        if (accounts.length > 0) {
          const address = accounts[0]?.toLowerCase() || null
          setState((prev) => ({
            ...prev,
            address,
            isConnected: Boolean(address),
          }))
          setStoredAddress(address)
        } else if (autoConnect) {
          const storedAddress = getStoredAddress()
          if (storedAddress) {
            await connect()
          }
        }
      } catch (error) {
        const walletError =
          error instanceof Error ? error : new Error("Unknown wallet error")
        console.error(walletError)
        sentry((sentry) => sentry.captureException(walletError))
        setState((prev) => ({
          ...prev,
          error: walletError,
        }))
      }
    }

    checkConnection()

    let cleanup: (() => void) | undefined

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)

      cleanup = () => {
        if (window.ethereum) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          )
        }
      }
    }

    return cleanup
  }, [autoConnect, connect, handleAccountsChanged])

  return {
    address: state.address,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connect,
    disconnect,
    reconnect,
  }
}

export { useWallet }
