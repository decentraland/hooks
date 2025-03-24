import { useEffect } from "react"
import { useLocation } from "react-router"
import { useAnalytics } from "./useAnalytics"

export function usePageTracking() {
  const location = useLocation()
  const { page } = useAnalytics()

  useEffect(() => {
    page(location.pathname)
  }, [location, page])
}
