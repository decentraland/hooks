import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthIdentity, Authenticator } from "@dcl/crypto"
import { LocalStorageUtils } from "@dcl/single-sign-on-client"
import { ethers } from "ethers"

export const useIdentity = (
  address: string | null,
  signMessage: (message: string) => Promise<string>
) => {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createWalletIdentity = useCallback(
    async (walletAddress: string): Promise<AuthIdentity> => {
      const ephemeralAccount = ethers.Wallet.createRandom()

      const payload = {
        address: ephemeralAccount.address.toString(),
        publicKey: ethers.hexlify(ephemeralAccount.publicKey),
        privateKey: ethers.hexlify(ephemeralAccount.privateKey),
      }

      const identity = await Authenticator.initializeAuthChain(
        walletAddress,
        payload,
        3600,
        (message) => signMessage(message)
      )

      return identity
    },
    [signMessage]
  )

  const createIdentity = useCallback(async () => {
    if (!address) return
    setIsLoading(true)
    try {
      const newIdentity = await createWalletIdentity(address)
      setIdentity(newIdentity)
      LocalStorageUtils.setIdentity(address, newIdentity)
    } catch (error) {
      console.error("Failed to create identity:", error)
    } finally {
      setIsLoading(false)
    }
  }, [address, createWalletIdentity])

  const clearIdentity = useCallback(() => {
    if (!address) return
    LocalStorageUtils.setIdentity(address, null)
    setIdentity(null)
  }, [address])

  const loadIdentity = useCallback((address: string) => {
    const identity = LocalStorageUtils.getIdentity(address)
    if (identity) {
      setIdentity(identity)
    }
  }, [])

  useEffect(() => {
    if (!address) return
    loadIdentity(address)
  }, [address, loadIdentity])

  return useMemo(
    () => ({
      identity,
      isLoading,
      clearIdentity,
      createIdentity,
      loadIdentity,
    }),
    [identity, isLoading, clearIdentity, loadIdentity, createIdentity]
  )
}
