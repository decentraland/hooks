import { useAsyncState } from "./useAsyncState"
export const useAsyncMemo = useAsyncState
export type {
  AsyncStateResult as AsyncMemoResult,
  AsyncStateResultState as AsyncMemoResultState,
} from "./useAsyncState"
export { createAsyncStateState as createAsyncMemoState } from "./useAsyncState"
