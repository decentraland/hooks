# useAsyncState

Executes an async function, stores the result in component state, and re-executes automatically when dependencies change. Stale requests are cancelled to prevent race conditions.

`useAsyncMemo` is an alias for `useAsyncState` with re-exported types (`AsyncMemoResult`, `AsyncMemoResultState`, `createAsyncMemoState`).

## Import

```typescript
import { useAsyncState } from "@dcl/hooks"
// or the alias
import { useAsyncMemo } from "@dcl/hooks"
```

## Types

```typescript
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

type AsyncStateResult<T, I = null> = readonly [T | I, AsyncStateResultState<T, I>]
```

## Signature

```typescript
function useAsyncState<T, I = null>(
  callback: () => Promise<T>,
  deps?: DependencyList,
  options?: Partial<AsyncStateOptions<T, I>>
): AsyncStateResult<T, I>
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | `() => Promise<T>` | -- | Async function to execute |
| `deps` | `DependencyList` | `[]` | Dependency array -- re-executes when values change |
| `options.initialValue` | `T \| I` | `null` | Value returned before first load completes |
| `options.callWithTruthyDeps` | `boolean` | `false` | Skip execution if any dependency is falsy |

### Return Value

Returns `[value, state]` tuple:

| Field | Type | Description |
|-------|------|-------------|
| `value` | `T \| I` | Current value (initialValue until first load) |
| `state.version` | `number` | Increments on each execution |
| `state.loading` | `boolean` | True while async function is running |
| `state.error` | `Error \| null` | Last error, or null |
| `state.time` | `number` | Execution time in milliseconds |
| `state.loaded` | `boolean` | True after first successful load (version > 0) |
| `state.reload` | `() => void` | Manually trigger re-execution |
| `state.set` | `(value \| updater) => void` | Manually set the value |

## Examples

### Basic data fetching

```typescript
import { useAsyncState } from "@dcl/hooks"

function UserList() {
  const [users, { loading, error }] = useAsyncState(async () => {
    const res = await fetch("/api/users")
    return res.json()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <ul>{users?.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

### With dependencies

```typescript
const [user, { loading }] = useAsyncState(
  async () => {
    const res = await fetch(`/api/users/${userId}`)
    return res.json()
  },
  [userId] // re-fetches when userId changes
)
```

### Conditional execution with callWithTruthyDeps

```typescript
const [profile, { loading }] = useAsyncState(
  async () => {
    const res = await fetch(`/api/profile/${address}`)
    return res.json()
  },
  [address],
  { callWithTruthyDeps: true } // won't execute until address is truthy
)
```

### Manual reload and set

```typescript
const [items, { reload, set }] = useAsyncState(async () => fetchItems(), [])

// Force refresh from server
const handleRefresh = () => reload()

// Optimistic update
const handleAdd = (newItem: Item) => {
  set((current) => [...(current ?? []), newItem])
}
```

### Custom initial value

```typescript
const [count, state] = useAsyncState<number, number>(
  async () => fetchCount(),
  [],
  { initialValue: 0 } // returns 0 instead of null before load
)
```

### createAsyncStateState helper

Returns a default state object for initialization before the hook runs:

```typescript
import { createAsyncStateState } from "@dcl/hooks"

const defaultState = createAsyncStateState<User[]>()
// { version: 0, loading: false, time: 0, error: null, loaded: false, reload: noop, set: noop }
```

## Common Patterns

- Use `callWithTruthyDeps: true` when a dependency may be null/undefined initially (e.g., auth tokens).
- Use `set` with an updater function for optimistic updates that depend on current state.
- Use `reload()` to force a re-fetch (e.g., after a mutation).
- The `time` field is useful for performance monitoring.

## Pitfalls

- The callback must be a new function reference when deps don't capture all dependencies -- prefer putting everything in `deps`.
- `version: 0` and `loaded: false` both indicate no load has completed yet.
- Errors are logged to console and Sentry automatically.
