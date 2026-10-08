import { useContext } from "react"
import { AnalyticsContext } from "../contexts/analytics/AnalyticsProvider"
import type { AnalyticsContextType } from "../contexts/analytics/types"

const useAnalytics = (): AnalyticsContextType => {
  const analyticsContext = useContext(AnalyticsContext)
  if (!analyticsContext) {
    throw new Error("useAnalytics must be used within AnalyticsProvider")
  }

  // The provider already hands out no-op methods while there is no instance, and buffering ones while
  // it loads: passing them through keeps a call made during the load from being dropped here.
  return {
    isInitialized: analyticsContext.isInitialized,
    track: analyticsContext.track,
    identify: analyticsContext.identify,
    page: analyticsContext.page,
  }
}

export { useAnalytics }
