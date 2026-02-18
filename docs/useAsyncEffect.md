# useAsyncEffect

Async wrapper for React's `useEffect`. Executes an async callback and supports returning an optional cleanup function.

## Import

```typescript
import { useAsyncEffect } from "@dcl/hooks"
```

## Signature

```typescript
function useAsyncEffect(
  callback: () => Promise<void | (() => void)>,
  dependencies?: DependencyList
): void
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | `() => Promise<void \| (() => void)>` | -- | Async function to execute. Optionally return a cleanup function. |
| `dependencies` | `DependencyList` | `undefined` | Standard React dependency array |

## Examples

### Basic async effect

```typescript
import { useAsyncEffect } from "@dcl/hooks"

useAsyncEffect(async () => {
  const data = await fetchInitialData()
  setData(data)
}, [])
```

### With cleanup

```typescript
useAsyncEffect(async () => {
  const ws = new WebSocket(url)
  await new Promise((resolve) => {
    ws.onopen = resolve
  })
  ws.onmessage = (e) => handleMessage(e.data)

  return () => ws.close() // cleanup runs on unmount or dep change
}, [url])
```

### With dependencies

```typescript
useAsyncEffect(async () => {
  if (!userId) return
  const profile = await api.getProfile(userId)
  setProfile(profile)
}, [userId])
```

## Common Patterns

- Use for fire-and-forget async operations that don't need loading/error state.
- Return a cleanup function to clean up subscriptions or connections.
- For operations that need loading/error state, use `useAsyncState` instead.

## Pitfalls

- Errors are caught, logged to `console.error`, and sent to Sentry -- they do not propagate or expose an error state.
- The cleanup function returned from the async callback runs after the promise resolves, not immediately on dep change.
- If you need to track loading or error states, use `useAsyncState` instead.
