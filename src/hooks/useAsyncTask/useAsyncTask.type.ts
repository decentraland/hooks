// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncTaskState<A extends any[] = []> = {
  loading: boolean
  args: A | null
}

export { AsyncTaskState }
