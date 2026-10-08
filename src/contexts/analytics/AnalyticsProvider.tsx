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

const KEEPALIVE_DELIVERY = {
  strategy: "standard",
  config: { keepalive: true },
} as const

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
  // `loading`: the instance exists and buffers calls, but analytics.js has not fetched its settings and
  // registered its plugins yet. `ready`: it has, and `isInitialized` reports true.
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle")

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

          // keepalive lets an event fired right before a navigation (a link click that loads the next
          // page in the same tab) finish sending after the page unloads, instead of being cancelled
          // with it. analytics-next leaves it off by default.
          const resolvedApiHost = resolveApiHost(apiHost)
          const options: InitOptions = {
            integrations: {
              [SEGMENT_IO]: {
                ...(resolvedApiHost ? { apiHost: resolvedApiHost } : {}),
                deliveryStrategy: KEEPALIVE_DELIVERY,
              },
            },
          }

          const analytics = AnalyticsBrowser.load(settings, options)

          if (userId) {
            analytics.identify(userId, traits)
          }

          // Published once everything above, which is synchronous, succeeded: a throw leaves neither
          // the ref nor the registry holding an instance this run never finished setting up.
          analyticsRef.current = analytics
          registerAnalyticsInstance(analytics)
          setStatus("loading")

          // The instance buffers calls straight away but only sends them once analytics.js has fetched
          // its settings and registered its plugins. Reporting ready before that tells a caller that an
          // event fired right before a navigation will go out, while it can still be sitting in the
          // buffer when the page unloads.
          await analytics

          if (isCurrent()) {
            setStatus("ready")
          }
        } catch (error) {
          console.error("[Analytics] Failed to initialize:", error)
          if (isCurrent()) {
            const instance = analyticsRef.current
            if (instance) {
              unregisterAnalyticsInstance(instance)
            }
            analyticsRef.current = null
            setStatus("idle")
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
      setStatus("idle")
    }
  }, [writeKey, userId, traits, cdnUrl, apiHost])

  // Calls are delegated as soon as the instance exists, so one made while it loads is buffered and sent
  // once it is ready instead of being dropped. Only `isInitialized` waits for the load. The methods keep
  // their identity from `loading` to `ready`, so an effect that depends on them does not fire twice.
  const isAvailable = status !== "idle"
  const methods = useMemo(() => {
    if (!isAvailable) {
      return { track: () => {}, identify: () => {}, page: () => {} }
    }

    return {
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
  }, [isAvailable])

  const contextValue = useMemo(
    () => ({ isInitialized: status === "ready", isAvailable, ...methods }),
    [status, isAvailable, methods]
  )

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export { AnalyticsContext, AnalyticsProvider }
