// Types
export type { AsyncStateResult, AsyncStateResultState } from "./useAsyncState"
export type { AsyncMemoResult, AsyncMemoResultState } from "./useAsyncMemo"
export type {
  ImageOptimizedFormats,
  ImageOptimized,
  ImageSetOptions,
} from "./useContentfulAssetOptimizer"
export type {
  ContentfulAssetResponse,
  ContentfulEntryResponse,
} from "./useGetContentful"

// Hooks
export { useAdvancedUserAgentData } from "./useAdvancedUserAgentData"
export { useAsyncState, createAsyncStateState } from "./useAsyncState"
export { useAsyncTask } from "./useAsyncTask"
export { useAsyncTasks } from "./useAsyncTasks"
export { usePatchState } from "./usePatchState"
export { useAsyncEffect } from "./useAsyncEffect"
export { useAsyncMemo, createAsyncMemoState } from "./useAsyncMemo"
export { useGetContentful } from "./useGetContentful"
export {
  optimize,
  optimizeVideo,
  useImageOptimization,
  useVideoOptimization,
  isWebpSupported,
} from "./useContentfulAssetOptimizer"
