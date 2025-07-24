type AsyncStateState<T, I = null> = {
  version: number
  loading: boolean
  value: T | I
  time: number
  error: Error | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncStateOptions<T = any, I = null> = {
  initialValue: T | I
  callWithTruthyDeps: boolean
}

type AsyncStateResultState<T, I = null> = {
  version: number
  time: number
  error: Error | null
  loading: boolean
  loaded: boolean
  reload: () => void
  set: (value: ((current: T | I) => T) | T) => void
}

type AsyncStateResult<T, I = null> = readonly [
  T | I,
  AsyncStateResultState<T, I>,
]

export {
  AsyncStateState,
  AsyncStateOptions,
  AsyncStateResult,
  AsyncStateResultState,
}
