import { useEffect, useState } from "react"
import { useAnalytics } from "./useAnalytics"

const usePageTracking = (pathname?: string) => {
  const { page } = useAnalytics()
  const [currentPathname, setCurrentPathname] = useState(
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "")
  )

  useEffect(() => {
    if (pathname !== undefined) {
      setCurrentPathname(pathname)
      return
    }

    const updatePathname = () => {
      setCurrentPathname(window.location.pathname)
    }

    updatePathname()

    window.addEventListener("popstate", updatePathname)

    return () => {
      window.removeEventListener("popstate", updatePathname)
    }
  }, [pathname])

  useEffect(() => {
    page(currentPathname)
  }, [currentPathname, page])
}

export { usePageTracking }
