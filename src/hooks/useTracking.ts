import { useCallback, useEffect, useMemo, useState } from "react"
import { isbot } from "isbot"

declare global {
  interface Window {
    analytics?: SegmentAnalytics.AnalyticsJS
    ethereum?: {
      providers?: Array<{
        isBraveWallet?: boolean
        isMetaMask?: boolean
        isCoinbaseWallet?: boolean
        isTrust?: boolean
        isFrame?: boolean
        isDapper?: boolean
        isCucumber?: boolean
        isToshi?: boolean
        isGoWallet?: boolean
        isAlphaWallet?: boolean
        isStatus?: boolean
      }>
      isMetaMask?: boolean
      isDapper?: boolean
      isCucumber?: boolean
      isTrust?: boolean
      isToshi?: boolean
      isGoWallet?: boolean
      isAlphaWallet?: boolean
      isStatus?: boolean
      isBraveWallet?: boolean
      isCoinbaseWallet?: boolean
      isFrame?: boolean
    }
    solana?: {
      isPhantom?: boolean
    }
  }
}

type TrackingOptions = {
  skipBotDetection?: boolean
  skipWalletDetection?: boolean
  disableWalletMiddleware?: boolean
}

type TrackingContext = {
  wallet?: string
  wallets?: string[]
  [key: string]: unknown
}

type TrackingHook = {
  track: (
    event: string,
    data?: Record<string, unknown>,
    callback?: () => void
  ) => void
  identify: (userId: string, traits?: Record<string, unknown>) => void
  page: (name?: string, properties?: Record<string, unknown>) => void
  getAnonymousId: () => string | undefined
  isReady: boolean
}

const getEvmWallets = (): string[] => {
  if (typeof window === "undefined") return []

  const ethereum = window.ethereum
  if (!ethereum) return []

  const providers = ethereum.providers ?? [ethereum]
  const names = new Set<string>()

  for (const provider of providers.filter(Boolean)) {
    if (provider.isBraveWallet) names.add("brave")
    else if (provider.isMetaMask) names.add("metamask")
    if (provider.isCoinbaseWallet) names.add("coinbase")
    if (provider.isTrust) names.add("trust")
    if (provider.isFrame) names.add("frame")
    if (provider.isDapper) names.add("dapper")
    if (provider.isCucumber) names.add("cucumber")
    if (provider.isToshi) names.add("toshi")
    if (provider.isGoWallet) names.add("goWallet")
    if (provider.isAlphaWallet) names.add("alphaWallet")
    if (provider.isStatus) names.add("status")
  }

  return Array.from(names)
}

const getSolanaWallets = (): string[] => {
  if (typeof window === "undefined") return []

  const wallets: string[] = []

  if (window.solana?.isPhantom) wallets.push("phantom")

  return wallets
}

const getAllWallets = (): string[] => {
  const evmWallets = getEvmWallets()
  const solanaWallets = getSolanaWallets()

  return [...evmWallets, ...solanaWallets]
}

const getWalletType = (): string => {
  if (typeof window === "undefined") return "server"

  const wallets = getAllWallets()

  if (wallets.length === 0) return "none"
  if (wallets.length === 1) return wallets[0]

  return wallets.join(",")
}

type SegmentPayload = {
  type: "track" | "identify" | "page"
  obj: {
    properties?: Record<string, unknown>
    traits?: Record<string, unknown>
    context?: Record<string, unknown>
  }
}

type MiddlewareFunction = ({
  payload,
  next,
}: {
  payload: SegmentPayload
  next: (payload: SegmentPayload) => void
}) => void

// Middleware function to enrich events with wallet information
const createWalletEnrichmentMiddleware = (): MiddlewareFunction => {
  return ({
    payload,
    next,
  }: {
    payload: SegmentPayload
    next: (payload: SegmentPayload) => void
  }) => {
    // Get current wallet information
    const wallets = getAllWallets()
    const walletType = getWalletType()

    // Create wallet context
    const walletContext = {
      wallet: walletType,
      wallets: wallets,
      walletCount: wallets.length,
    }

    // Enrich the context for all event types
    payload.obj.context = {
      ...payload.obj.context,
      ...walletContext,
    }

    // Continue with the enriched payload
    next(payload)
  }
}

// Extended analytics interface for middleware support
type AnalyticsWithMiddleware = SegmentAnalytics.AnalyticsJS & {
  addSourceMiddleware?: (middleware: MiddlewareFunction) => void
  _walletMiddlewareRegistered?: boolean
}

// Function to register the wallet middleware
const registerWalletMiddleware = () => {
  if (typeof window === "undefined" || !window.analytics) return

  const analytics = window.analytics as AnalyticsWithMiddleware

  // Check if middleware is already registered to avoid duplicates
  if (analytics._walletMiddlewareRegistered) return

  // Register the middleware using the correct Segment method
  if (typeof analytics.addSourceMiddleware === "function") {
    analytics.addSourceMiddleware(createWalletEnrichmentMiddleware())
  } else {
    console.warn("Segment middleware not supported in this version")
    return
  }

  // Mark as registered
  analytics._walletMiddlewareRegistered = true
}

const useTracking = (options: TrackingOptions = {}): TrackingHook => {
  const {
    skipBotDetection = false,
    skipWalletDetection = false,
    disableWalletMiddleware = false,
  } = options

  const [walletContext, setWalletContext] = useState<{
    wallet: string
    wallets: string[]
  }>(() => ({
    wallet: skipWalletDetection ? "none" : getWalletType(),
    wallets: skipWalletDetection ? [] : getAllWallets(),
  }))

  const updateWalletContext = useCallback(() => {
    if (!skipWalletDetection) {
      const newWallet = getWalletType()
      const newWallets = getAllWallets()
      setWalletContext((prev) => {
        if (
          prev.wallet !== newWallet ||
          prev.wallets.join(",") !== newWallets.join(",")
        ) {
          return { wallet: newWallet, wallets: newWallets }
        }
        return prev
      })
    }
  }, [skipWalletDetection])

  useEffect(() => {
    if (skipWalletDetection) return

    const handleEthereumEvent = () => updateWalletContext()

    // Listen for wallet injection events
    window.addEventListener("ethereum#initialized", handleEthereumEvent)

    // Check for wallet changes periodically (some wallets inject asynchronously)
    const interval = setInterval(updateWalletContext, 1000)

    // Clean up after 10 seconds (most wallets should be loaded by then)
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      window.removeEventListener("ethereum#initialized", handleEthereumEvent)
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [skipWalletDetection, updateWalletContext])

  // Register wallet middleware by default (unless explicitly disabled)
  useEffect(() => {
    if (
      !disableWalletMiddleware &&
      typeof window !== "undefined" &&
      window.analytics
    ) {
      registerWalletMiddleware()
    }
  }, [disableWalletMiddleware])

  // Note: Wallet middleware registration is global and will affect ALL Segment events
  // once enabled. Use disableWalletMiddleware: true to prevent registration.

  const context = useMemo((): TrackingContext => {
    const ctx: TrackingContext = {}

    if (!skipWalletDetection) {
      ctx.wallet = walletContext.wallet
      ctx.wallets = walletContext.wallets
    }

    // Add page context information
    if (typeof window !== "undefined") {
      ctx.location = window.location.href
      ctx.locale = navigator.language
      ctx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    return ctx
  }, [skipWalletDetection, walletContext])

  const isReady = useMemo(() => {
    if (typeof window === "undefined") return false
    if (!skipBotDetection && isbot(navigator.userAgent)) return false
    return !!window.analytics
  }, [skipBotDetection])

  const track = useCallback(
    (
      event: string,
      data: Record<string, unknown> = {},
      callback?: () => void
    ) => {
      if (!isReady) {
        console.warn(`Analytics not ready. Event "${event}" not sent.`, {
          hasAnalytics: !!window.analytics,
          isBot: !skipBotDetection && isbot(navigator.userAgent),
          event,
          data,
        })
        if (callback) Promise.resolve().then(callback)
        return
      }

      const payload = { ...context, ...data }
      window.analytics!.track(event, payload, callback)
    },
    [isReady, context, skipBotDetection]
  )

  const identify = useCallback(
    (userId: string, traits: Record<string, unknown> = {}) => {
      if (!isReady) return

      const payload = { ...context, ...traits }
      window.analytics!.identify(userId, payload)
    },
    [isReady, context]
  )

  const page = useCallback(
    (name?: string, properties: Record<string, unknown> = {}) => {
      if (!isReady) return

      const payload = { ...context, ...properties }
      window.analytics!.page(name, payload)
    },
    [isReady, context]
  )

  const getAnonymousId = useCallback(() => {
    if (!isReady) return undefined
    return window.analytics!.user().anonymousId()
  }, [isReady])

  return {
    track,
    identify,
    page,
    getAnonymousId,
    isReady,
  }
}

export type { TrackingOptions, TrackingContext, TrackingHook }
export { useTracking }
