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
  // The registry is global while each provider owns its own context, so with two providers mounted at
  // once the newest load silently wins for every caller outside React. Surface it instead.
  if (current !== null && current !== instance) {
    console.warn(
      "[Analytics] Replacing the registered analytics instance: more than one AnalyticsProvider is mounted."
    )
  }
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
