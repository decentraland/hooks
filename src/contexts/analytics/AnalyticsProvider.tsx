import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  type AnalyticsBrowser,
  type AnalyticsBrowserSettings,
  type InitOptions,
} from "@segment/analytics-next"
import { isbot } from "isbot"
import {
  registerAnalyticsInstance,
  unregisterAnalyticsInstance,
} from "./registry"
import { resolveApiHost, resolveCdnUrl } from "./utils"
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
  // Identifies the run that owns the instance. Advanced synchronously on every run AND on every
  // cleanup, so a load still awaiting its import when the provider is reconfigured or unmounted sees a
  // stale generation and abandons instead of taking over.
  const generationRef = useRef(0)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const generation = ++generationRef.current
    const isCurrent = () => generation === generationRef.current

    if (!writeKey) {
      console.log("[Analytics] No writeKey provided")
    } else if (isbot(navigator.userAgent)) {
      console.log("[Analytics] Skipping load: bot detected")
    } else {
      void (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { AnalyticsBrowser } = await import("@segment/analytics-next")

          // A newer configuration won, or the provider unmounted, while this import was in flight.
          // analytics-next has no teardown for an instance, so this run creates none at all rather
          // than loading one it would have to leave unreferenced.
          if (!isCurrent()) {
            return
          }

          const settings: AnalyticsBrowserSettings = { writeKey }
          const resolvedCdnUrl = resolveCdnUrl(cdnUrl)
          if (resolvedCdnUrl) {
            settings.cdnURL = resolvedCdnUrl
          }

          const options: InitOptions = {}
          const resolvedApiHost = resolveApiHost(apiHost)
          if (resolvedApiHost) {
            options.integrations = {
              [SEGMENT_IO]: { apiHost: resolvedApiHost },
            }
          }

          const analytics = AnalyticsBrowser.load(settings, options)

          if (userId) {
            analytics.identify(userId, traits)
          }

          // Published last: everything above is synchronous, so a throw leaves neither the ref nor
          // the registry holding an instance this run never finished setting up.
          analyticsRef.current = analytics
          registerAnalyticsInstance(analytics)
          setIsInitialized(true)
        } catch (error) {
          console.error("[Analytics] Failed to initialize:", error)
          if (isCurrent()) {
            analyticsRef.current = null
          }
        }
      })()
    }

    return () => {
      generationRef.current++
      const instance = analyticsRef.current
      if (instance) {
        unregisterAnalyticsInstance(instance)
        analyticsRef.current = null
      }
      setIsInitialized(false)
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
