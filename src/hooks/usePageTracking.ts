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
 *    after analytics is initialized AND `name` is a non-empty string. Use this
 *    shape when the page title is resolved asynchronously (e.g. from a CMS via
 *    Helmet + RTK Query) so the event lands AFTER `document.title` updates,
 *    avoiding the SPA race that lets Segment auto-capture the previous route's
 *    title via `properties.title`.
 *
 * The hook is initialization-aware in both shapes: when `useAnalytics().page`
 * is the no-op fallback (Segment not loaded yet), the call is skipped to avoid
 * wasted work.
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
  const { isInitialized, page } = useAnalytics()
  const propertiesKey = properties ? JSON.stringify(properties) : ""
  const propertiesRef = useRef(properties)
  propertiesRef.current = properties

  useEffect(() => {
    if (!isInitialized || !name) return
    page(name, propertiesRef.current)
  }, [isInitialized, name, propertiesKey, page])
}

export { usePageTracking }
