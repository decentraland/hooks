import type { EventProperties } from "@segment/analytics-next"

type AnalyticsProviderProps = {
  writeKey: string
  userId?: string
  traits?: Record<string, unknown>
  /**
   * Origin analytics.js fetches its settings and its remote plugins from. Defaults to Segment's cdn, which ad
   * blockers drop, so apps can point it at a first party proxy instead. Example: `https://analytics.example.org`.
   *
   * Named after this library's camelCase convention (`writeKey`, `apiHost`); the provider maps it to the
   * `cdnURL` setting analytics-next actually takes.
   */
  cdnUrl?: string
  /**
   * Host events are delivered to, without a protocol (`host/basePath`). Defaults to Segment's ingestion endpoint,
   * which ad blockers drop too. Example: `analytics.example.org/v1`.
   *
   * The provider maps it to the `apiHost` setting of analytics-next's own `Segment.io` integration.
   */
  apiHost?: string
  children: React.ReactNode
}

type TrackPayload = EventProperties

type AnalyticsContextType = {
  isInitialized: boolean
  track: (event: string, payload?: TrackPayload) => void
  identify: (userId: string, traits?: Record<string, unknown>) => void
  page: (name: string, props?: Record<string, unknown>) => void
}

export {
  type AnalyticsProviderProps,
  type TrackPayload,
  type AnalyticsContextType,
}
