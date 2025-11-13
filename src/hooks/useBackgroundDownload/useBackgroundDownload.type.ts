type DownloadState = "idle" | "downloading" | "finished" | "error" | "aborted"

type PlatformUrls = {
  mac: string
  win: string
}

type UseBackgroundDownloadOptions = {
  urls?: PlatformUrls
  getUrl?: () => string
  onProgress?: (progress: number, loaded: number, total: number) => void
  onDone?: (blob: Blob) => void
  onError?: (error: unknown) => void
  cacheKey?: string
  enableCache?: boolean
  cacheTTL?: number
}

type UseBackgroundDownloadResult = {
  state: DownloadState
  progress: number
  error: unknown
  start: () => Promise<void>
  abort: () => void
  save: (filename: string) => void
  clearCache: () => void
}

export {
  DownloadState,
  PlatformUrls,
  UseBackgroundDownloadOptions,
  UseBackgroundDownloadResult,
}
