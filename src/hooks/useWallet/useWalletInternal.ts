import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ethers } from "ethers"

export const useWalletInternal = () => {
  const [address, setAddress] = useState<string | null>(null)
  const provider = useRef<ethers.BrowserProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const connectWallet = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available")
      }

      const wallet = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[]

      setAddress(wallet[0])
      provider.current = new ethers.BrowserProvider(window.ethereum)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAddress(null)
    provider.current = null
    setError(null)
    setIsLoading(false)
  }, [])

  const handleAccountsChanged = useCallback(
    (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || []
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== address) {
        disconnectWallet()
        setTimeout(() => connectWallet(), 100)
      }
    },
    [address, disconnectWallet, connectWallet]
  )

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true)
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available")
      }

      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[]

      if (accounts.length > 0) {
        setAddress(accounts[0])
        provider.current = new ethers.BrowserProvider(window.ethereum)
        return accounts[0]
      }
    } catch (err) {
      console.error("Failed to check wallet connection:", err)
      setError("Failed to check wallet connection")
      return null
    } finally {
      setIsLoading(false)
    }
    return null
  }, [])

  useEffect(() => {
    if (!window.ethereum) return

    window.ethereum.on("accountsChanged", handleAccountsChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [handleAccountsChanged])

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!address || !provider.current) {
        throw new Error("Wallet not connected")
      }

      const signer = await provider.current.getSigner()
      return signer.signMessage(message)
    },
    [address]
  )

  return useMemo(
    () => ({
      address,
      isLoading,
      error,
      connectWallet,
      disconnectWallet,
      signMessage,
      checkConnection,
    }),
    [
      address,
      isLoading,
      error,
      connectWallet,
      disconnectWallet,
      signMessage,
      checkConnection,
    ]
  )
}
