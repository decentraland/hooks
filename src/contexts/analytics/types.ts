import type { EventProperties } from "@segment/analytics-next"

type AnalyticsProviderProps = {
  writeKey: string
  userId?: string
  traits?: Record<string, unknown>
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
