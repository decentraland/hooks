import { useContext } from "react"
import { AnalyticsContext } from "../contexts/analytics/AnalyticsProvider"

const useAnalytics = () => {
  const analyticsContext = useContext(AnalyticsContext)
  if (!analyticsContext) {
    throw new Error("useAnalytics must be used within AnalyticsProvider")
  }

  // Return no-op functions if analytics is not initialized
  if (!analyticsContext.isInitialized) {
    return {
      track: () => {},
      identify: () => {},
      page: () => {},
      isInitialized: false,
    }
  }

  return {
    track: analyticsContext.track,
    identify: analyticsContext.identify,
    page: analyticsContext.page,
    isInitialized: true,
  }
}

export { useAnalytics }
