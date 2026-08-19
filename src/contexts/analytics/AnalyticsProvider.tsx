import React, { createContext, useMemo, useRef, useState } from "react"
import {
  type AnalyticsBrowser,
  type AnalyticsBrowserSettings,
  type InitOptions,
} from "@segment/analytics-next"
import { isbot } from "isbot"
import { resolveApiHost, resolveCdnUrl } from "./utils"
import { useAsyncEffect } from "../../hooks/useAsyncEffect"
import type {
  AnalyticsContextType,
  AnalyticsProviderProps,
  TrackPayload,
} from "./types"

// Integration key analytics-next reserves for its own ingestion plugin
const SEGMENT_IO = "Segment.io"

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = (
  props: AnalyticsProviderProps
) => {
  const { writeKey, userId, traits, cdnUrl, apiHost, children } = props
  const analyticsRef = useRef<AnalyticsBrowser | null>(null)
  // Identifies the latest load, so an earlier one whose import resolves after it cannot take over
  const loadIdRef = useRef(0)
  const [isInitialized, setIsInitialized] = useState(false)

  useAsyncEffect(async () => {
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

    const loadId = ++loadIdRef.current

    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { AnalyticsBrowser } = await import("@segment/analytics-next")

      const settings: AnalyticsBrowserSettings = { writeKey }
      const resolvedCdnUrl = resolveCdnUrl(cdnUrl)
      if (resolvedCdnUrl) {
        settings.cdnURL = resolvedCdnUrl
      }

      const options: InitOptions = {}
      const resolvedApiHost = resolveApiHost(apiHost)
      if (resolvedApiHost) {
        options.integrations = { [SEGMENT_IO]: { apiHost: resolvedApiHost } }
      }

      const analytics = AnalyticsBrowser.load(settings, options)

      // A newer configuration won while this import was in flight. analytics-next has no teardown for
      // the superseded instance (`reset` only clears the identity, which would drop the anonymous id
      // and break attribution), so it is left unreferenced instead of overwriting the current one.
      if (loadId !== loadIdRef.current) {
        return
      }

      analyticsRef.current = analytics

      if (userId) {
        analytics.identify(userId, traits)
      }

      setIsInitialized(true)
    } catch (error) {
      console.error("[Analytics] Failed to initialize:", error)
      if (loadId === loadIdRef.current) {
        analyticsRef.current = null
      }
    }
  }, [writeKey, userId, traits, cdnUrl, apiHost])

  const contextValue = useMemo(() => {
    if (!analyticsRef.current || !isInitialized) {
      return {
        isInitialized: false,
        track: () => {},
        identify: () => {},
        page: () => {},
      }
    }

    return {
      isInitialized: true,
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
  }, [isInitialized])

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export { AnalyticsContext, AnalyticsProvider }
