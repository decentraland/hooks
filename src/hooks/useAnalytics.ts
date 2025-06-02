import { useContext } from "react"
import { AnalyticsContext } from "../contexts/analytics/AnalyticsProvider"
import type { AnalyticsContextType } from "../contexts/analytics/types"

const useAnalytics = (): AnalyticsContextType => {
  const analyticsContext = useContext(AnalyticsContext)
  if (!analyticsContext) {
    throw new Error("useAnalytics must be used within AnalyticsProvider")
  }

  if (!analyticsContext.isInitialized) {
    return {
      isInitialized: false,
      track: () => {},
      identify: () => {},
      page: () => {},
    }
  }

  return {
    isInitialized: true,
    track: analyticsContext.track,
    identify: analyticsContext.identify,
    page: analyticsContext.page,
  }
}

export { useAnalytics }
