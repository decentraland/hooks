import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  DownloadState,
  UseBackgroundDownloadOptions,
  UseBackgroundDownloadResult,
} from "./useBackgroundDownload.type"
import { sentry } from "../../utils/development/sentry"

type DownloadHookState = {
  state: DownloadState
  progress: number
  error: unknown
  blobUrl: string | null
}

type CachedBlob = {
  data: string
  type: string
  timestamp: number
}

const CACHE_PREFIX = "useBackgroundDownload_"
const cacheTimeouts = new Map<string, NodeJS.Timeout>()

const getCacheKey = (url: string, customKey?: string): string => {
  if (customKey) {
    return `${CACHE_PREFIX}${customKey}`
  }
  return `${CACHE_PREFIX}${btoa(url).replace(/[+/=]/g, "")}`
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] || result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

const loadFromCache = (cacheKey: string, ttl?: number): Blob | null => {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (!cached) {
      return null
    }

    const parsed: CachedBlob = JSON.parse(cached)

    if (ttl !== undefined && parsed.timestamp) {
      const age = Date.now() - parsed.timestamp
      if (age > ttl) {
        localStorage.removeItem(cacheKey)
        return null
      }
    }

    const blob = base64ToBlob(parsed.data, parsed.type)
    return blob
  } catch {
    return null
  }
}

const saveToCache = async (
  cacheKey: string,
  blob: Blob,
  ttl?: number
): Promise<void> => {
  try {
    const existingTimeout = cacheTimeouts.get(cacheKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      cacheTimeouts.delete(cacheKey)
    }

    const base64 = await blobToBase64(blob)
    const cached: CachedBlob = {
      data: base64,
      type: blob.type || "application/octet-stream",
      timestamp: Date.now(),
    }
    localStorage.setItem(cacheKey, JSON.stringify(cached))

    if (ttl !== undefined) {
      const timeout = setTimeout(() => {
        clearCacheStorage(cacheKey)
        cacheTimeouts.delete(cacheKey)
      }, ttl)
      cacheTimeouts.set(cacheKey, timeout)
    }
  } catch (error) {
    console.error("Failed to save to cache:", error)
  }
}

const clearCacheStorage = (cacheKey: string): void => {
  try {
    const existingTimeout = cacheTimeouts.get(cacheKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      cacheTimeouts.delete(cacheKey)
    }
    localStorage.removeItem(cacheKey)
  } catch (error) {
    console.error("Failed to clear cache:", error)
  }
}

/**
 * Hook for downloading files in the background with progress tracking and cache support
 *
 * @param options - Configuration options for the download
 * @param options.urls - Platform-specific URLs (mac/win)
 * @param options.getUrl - Function that returns the download URL
 * @param options.onProgress - Callback fired on download progress
 * @param options.onDone - Callback fired when download completes
 * @param options.onError - Callback fired on download error
 * @param options.cacheKey - Custom key for cache storage (defaults to URL-based key)
 * @param options.enableCache - Enable caching to localStorage (default: true)
 * @param options.cacheTTL - Cache time to live in milliseconds (optional, no expiration if not provided). Cache will be automatically deleted after TTL expires
 * @returns Object containing download state, progress, error, and control functions
 *
 * @example
 * ```ts
 * const { state, progress, start, save, clearCache } = useBackgroundDownload({
 *   urls: { mac: 'https://example.com/app.dmg', win: 'https://example.com/app.exe' },
 *   cacheKey: 'my-app-download',
 *   cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
 *   onProgress: (progress) => console.log(`Downloaded: ${progress}%`),
 *   onDone: (blob) => console.log('Download complete'),
 * })
 *
 * // Start download (will use cache if available and not expired)
 * await start()
 *
 * // Save file when finished
 * if (state === 'finished') {
 *   save('my-app.dmg')
 * }
 *
 * // Clear cache if needed
 * clearCache()
 * ```
 *
 * @framework React
 * @version 1.0.0
 */
const useBackgroundDownload = ({
  urls,
  getUrl,
  onProgress,
  onDone,
  onError,
  cacheKey,
  enableCache = true,
  cacheTTL,
}: UseBackgroundDownloadOptions): UseBackgroundDownloadResult => {
  const controllerRef = useRef<AbortController | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const cacheKeyRef = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const platformUrl = useMemo(() => {
    if (getUrl) {
      return getUrl()
    }

    if (!urls) {
      throw new Error("Missing URLs or getUrl()")
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const isMac = userAgent.includes("mac") || userAgent.includes("os x")

    return isMac ? urls.mac : urls.win
  }, [urls, getUrl])

  const storageCacheKey = useMemo(() => {
    if (!enableCache) {
      return null
    }
    return getCacheKey(platformUrl, cacheKey)
  }, [platformUrl, cacheKey, enableCache])

  const [hookState, setHookState] = useState<DownloadHookState>(() => {
    const initialPlatformUrl =
      getUrl?.() ||
      (urls
        ? navigator.userAgent.toLowerCase().includes("mac") ||
          navigator.userAgent.toLowerCase().includes("os x")
          ? urls.mac
          : urls.win
        : null)

    if (enableCache && initialPlatformUrl) {
      const initialCacheKey = getCacheKey(initialPlatformUrl, cacheKey)
      const cachedBlob = loadFromCache(initialCacheKey, cacheTTL)
      if (cachedBlob) {
        blobRef.current = cachedBlob
        const url = URL.createObjectURL(cachedBlob)
        cacheKeyRef.current = initialCacheKey

        if (cacheTTL !== undefined) {
          try {
            const cached = localStorage.getItem(initialCacheKey)
            if (cached) {
              const parsed: CachedBlob = JSON.parse(cached)
              const age = Date.now() - parsed.timestamp
              const remainingTTL = cacheTTL - age

              if (remainingTTL > 0) {
                const timeout = setTimeout(() => {
                  clearCacheStorage(initialCacheKey)
                }, remainingTTL)
                cacheTimeouts.set(initialCacheKey, timeout)
                timeoutRef.current = timeout
              }
            }
          } catch {
            // Ignore errors when setting up timeout
          }
        }

        return {
          state: "finished",
          progress: 100,
          error: null,
          blobUrl: url,
        }
      }
    }

    return {
      state: "idle",
      progress: 0,
      error: null,
      blobUrl: null,
    }
  })

  useEffect(() => {
    if (storageCacheKey) {
      cacheKeyRef.current = storageCacheKey
    }
  }, [storageCacheKey])

  const start = useCallback(async () => {
    setHookState((prev) => ({
      ...prev,
      state: "downloading",
      progress: 0,
      error: null,
    }))

    controllerRef.current?.abort()
    controllerRef.current = new AbortController()

    try {
      const response = await fetch(platformUrl, {
        signal: controllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const total = Number(response.headers.get("content-length") || 0)
      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let loaded = 0

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        if (value) {
          chunks.push(value)
          loaded += value.length

          if (total > 0) {
            const progressPercent = (loaded / total) * 100

            setHookState((prev) => ({
              ...prev,
              progress: progressPercent,
            }))

            onProgress?.(progressPercent, loaded, total)
          }
        }
      }

      const blob = new Blob(chunks as BlobPart[])
      blobRef.current = blob

      if (enableCache && storageCacheKey) {
        await saveToCache(storageCacheKey, blob, cacheTTL)
        const timeout = cacheTimeouts.get(storageCacheKey)
        if (timeout) {
          timeoutRef.current = timeout
        }
      }

      const url = URL.createObjectURL(blob)

      setHookState((prev) => ({
        ...prev,
        state: "finished",
        progress: 100,
        blobUrl: url,
      }))

      onDone?.(blob)
    } catch (err) {
      const error = err as Error & { name?: string }

      if (error.name === "AbortError") {
        setHookState((prev) => ({
          ...prev,
          state: "aborted",
        }))
      } else {
        console.error(err)
        sentry((sentryInstance) => sentryInstance.captureException(err))

        setHookState((prev) => ({
          ...prev,
          state: "error",
          error: err,
        }))

        onError?.(err)
      }
    }
  }, [platformUrl, onProgress, onDone, onError, enableCache, storageCacheKey])

  const save = useCallback(
    (filename: string) => {
      if (!blobRef.current || !hookState.blobUrl) {
        return
      }

      const anchor = document.createElement("a")
      anchor.href = hookState.blobUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(hookState.blobUrl)

      setHookState((prev) => ({
        ...prev,
        blobUrl: null,
      }))
    },
    [hookState.blobUrl]
  )

  const abort = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const clearCache = useCallback(() => {
    if (cacheKeyRef.current) {
      clearCacheStorage(cacheKeyRef.current)
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (hookState.blobUrl) {
      URL.revokeObjectURL(hookState.blobUrl)
    }

    blobRef.current = null

    setHookState({
      state: "idle",
      progress: 0,
      error: null,
      blobUrl: null,
    })
  }, [hookState.blobUrl])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    state: hookState.state,
    progress: hookState.progress,
    error: hookState.error,
    start,
    abort,
    save,
    clearCache,
  }
}

export { useBackgroundDownload }
