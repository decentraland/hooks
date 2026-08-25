import type { AnalyticsBrowser } from "@segment/analytics-next"

let current: AnalyticsBrowser | null = null

/**
 * The AnalyticsBrowser instance the mounted AnalyticsProvider loaded, for code that runs outside React
 * (state stores, imperative modules) and cannot reach the context. Null until a provider initializes
 * one, and null again once that provider unmounts or is reconfigured to a no-op (empty write key, bot
 * session). analytics-next buffers the calls made through the instance while the remote script is still
 * loading, so a caller needs no queue of its own.
 */
const getAnalytics = (): AnalyticsBrowser | null => current

/** Registers the instance a successful load produced. Not part of the package's public API. */
const registerAnalyticsInstance = (instance: AnalyticsBrowser): void => {
  current = instance
}

/**
 * Clears the registry only when the given instance is the one registered, so a provider or a load that
 * was already superseded cannot erase a newer registration when its cleanup runs late.
 * Not part of the package's public API.
 */
const unregisterAnalyticsInstance = (instance: AnalyticsBrowser): void => {
  if (current === instance) {
    current = null
  }
}

export { getAnalytics, registerAnalyticsInstance, unregisterAnalyticsInstance }
