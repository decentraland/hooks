import type { EventProperties, InitOptions } from "@segment/analytics-next"

type SegmentIoOptions = Exclude<
  NonNullable<NonNullable<InitOptions["integrations"]>["Segment.io"]>,
  boolean
>

/** How analytics-next's Segment.io integration sends events: standard (one request per event) or batching. */
type AnalyticsDeliveryStrategy = NonNullable<
  SegmentIoOptions["deliveryStrategy"]
>

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
  /**
   * How events are delivered. Defaults to standard delivery with `keepalive`, so an event fired right before a
   * same-tab navigation still goes out. Browsers cap all in-flight keepalive requests of a page at 64KB, so an app
   * that sends large or very frequent events can pass its own strategy, e.g. `{ strategy: "batching" }`.
   *
   * Read when analytics loads: changing it afterwards does not reload analytics.
   */
  deliveryStrategy?: AnalyticsDeliveryStrategy
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
  type AnalyticsDeliveryStrategy,
  type AnalyticsProviderProps,
  type TrackPayload,
  type AnalyticsContextType,
}
