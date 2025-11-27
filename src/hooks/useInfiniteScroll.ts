import { useEffect, useRef } from "react"

interface UseInfiniteScrollOptions {
  /** Callback to trigger when user scrolls near the end */
  onLoadMore: () => void
  /** Whether more data is available to load */
  hasMore: boolean
  /** Whether data is currently loading */
  isLoading: boolean
  /** Distance from bottom (in pixels) to trigger load. Default: 500 */
  threshold?: number
  /** Minimum time (in milliseconds) between triggers to prevent multiple calls. Default: 500 */
  debounceMs?: number
}

/**
 * Hook to implement infinite scroll functionality
 * Triggers onLoadMore callback when user scrolls near the bottom of the page
 * @param options - Configuration options for infinite scroll
 * @param options.onLoadMore - Callback to trigger when user scrolls near the end
 * @param options.hasMore - Whether more data is available to load
 * @param options.isLoading - Whether data is currently loading
 * @param options.threshold - Distance from bottom (in pixels) to trigger load. Default: 500
 * @param options.debounceMs - Minimum time (in milliseconds) between triggers to prevent multiple calls. Default: 500
 */
const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 500,
  debounceMs = 500,
}: UseInfiniteScrollOptions) => {
  const onLoadMoreRef = useRef(onLoadMore)
  const lastTriggerRef = useRef(0)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now()
      if (now - lastTriggerRef.current < debounceMs) {
        return
      }

      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      if (distanceFromBottom < threshold && hasMore && !isLoading) {
        lastTriggerRef.current = now
        onLoadMoreRef.current()
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    const timeoutId = setTimeout(handleScroll, 500)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timeoutId)
    }
  }, [hasMore, isLoading, threshold, debounceMs])
}

export { useInfiniteScroll }
export type { UseInfiniteScrollOptions }
