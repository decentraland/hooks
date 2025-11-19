type WalletState = {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
}

type WalletOptions = {
  autoConnect?: boolean
  onConnect?: (address: string) => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

type WalletResult = {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  reconnect: () => Promise<void>
}

export type { WalletState, WalletOptions, WalletResult }
