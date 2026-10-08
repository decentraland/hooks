import { useEffect, useRef } from "react"
import { useAnalytics } from "./useAnalytics"

type PageTrackingProperties = Record<string, unknown>

/**
 * Tracks a Segment `page()` event.
 *
 * Two call shapes:
 *
 * 1. `usePageTracking(path)` — fires `page(path)` whenever `path` changes.
 *    Backwards-compatible with the original signature.
 *
 * 2. `usePageTracking(name, properties)` — fires `page(name, properties)` only
 *    once analytics is available AND `name` is a non-empty string. Use this
 *    shape when the page title is resolved asynchronously (e.g. from a CMS via
 *    Helmet + RTK Query) so the event lands AFTER `document.title` updates,
 *    avoiding the SPA race that lets Segment auto-capture the previous route's
 *    title via `properties.title`.
 *
 * Both shapes wait for analytics to be AVAILABLE, not fully initialized: once
 * the instance exists a page view is buffered while Segment loads and sent when
 * it is ready, so a route the visitor leaves in-app before then still counts.
 * Before that (`page` is the no-op fallback) the call is skipped and fires when
 * analytics becomes available.
 */
function usePageTracking(path: string): void
function usePageTracking(
  name: string | undefined,
  properties?: PageTrackingProperties
): void
function usePageTracking(
  name: string | undefined,
  properties?: PageTrackingProperties
) {
  const { isAvailable: available, isInitialized, page } = useAnalytics()
  // Context values built without `isAvailable` (older providers, test doubles) fall back to readiness.
  const isAvailable = available ?? isInitialized
  const propertiesKey = properties ? JSON.stringify(properties) : ""
  const propertiesRef = useRef(properties)
  propertiesRef.current = properties

  useEffect(() => {
    if (!isAvailable || !name) return
    page(name, propertiesRef.current)
  }, [isAvailable, name, propertiesKey, page])
}

export { usePageTracking }
