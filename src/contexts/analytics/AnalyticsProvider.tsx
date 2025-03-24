import React, { createContext, useEffect, useRef, useState } from "react"
import { type AnalyticsBrowser } from "@segment/analytics-next"
import { isbot } from "isbot"
import type {
  AnalyticsContextType,
  AnalyticsProviderProps,
  TrackPayload,
} from "./types"

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  writeKey,
  userId,
  traits,
  children,
}: AnalyticsProviderProps) => {
  const analyticsRef = useRef<AnalyticsBrowser | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!writeKey) {
        console.log("[Analytics] No writeKey provided")
        return
      }

      const userAgent = navigator.userAgent
      const isBot = isbot(userAgent)

      if (isBot) {
        console.log("[Analytics] Skipping load: bot detected")
        return
      }

      try {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { AnalyticsBrowser } = await import("@segment/analytics-next")
        analyticsRef.current = AnalyticsBrowser.load({ writeKey })

        if (userId) {
          analyticsRef.current.identify(userId, traits)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("[Analytics] Failed to initialize:", error)
      }
    }

    loadAnalytics()

    return () => {
      analyticsRef.current = null
      setIsInitialized(false)
    }
  }, [writeKey, userId, traits])

  const contextValue =
    analyticsRef.current && isInitialized
      ? {
          isInitialized: true as const,
          track: (event: string, payload?: TrackPayload) => {
            analyticsRef.current?.track(event, payload)
          },
          identify: (id: string, traits?: Record<string, unknown>) => {
            analyticsRef.current?.identify(id, traits)
          },
          page: (name: string, props?: Record<string, unknown>) => {
            analyticsRef.current?.page(name, props)
          },
        }
      : { isInitialized: false as const }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export { AnalyticsContext, AnalyticsProvider }
