import { useEffect } from "react"
import { useAnalytics } from "./useAnalytics"

const usePageTracking = (path: string) => {
  const { page } = useAnalytics()

  useEffect(() => {
    page(path)
  }, [page, path])
}

export { usePageTracking }
