# useInfiniteScroll

Triggers a callback when the user scrolls near the bottom of the page. Includes debouncing to prevent multiple rapid calls.

## Import

```typescript
import { useInfiniteScroll } from "@dcl/hooks"
```

## Types

```typescript
type UseInfiniteScrollOptions = {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number   // default: 500
  debounceMs?: number  // default: 500
}
```

## Signature

```typescript
function useInfiniteScroll(options: UseInfiniteScrollOptions): void
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.onLoadMore` | `() => void` | -- | Callback triggered when user scrolls near bottom |
| `options.hasMore` | `boolean` | -- | Whether more data is available to load |
| `options.isLoading` | `boolean` | -- | Whether data is currently loading (prevents re-trigger) |
| `options.threshold` | `number` | `500` | Distance from bottom in pixels to trigger |
| `options.debounceMs` | `number` | `500` | Minimum time in ms between triggers |

## Examples

### Basic infinite scroll

```typescript
import { useInfiniteScroll } from "@dcl/hooks"
import { useState } from "react"

function InfiniteList() {
  const [items, setItems] = useState<Item[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadMore = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const newItems = await fetchItems(items.length)
      setItems((prev) => [...prev, ...newItems])
      setHasMore(newItems.length > 0)
    } catch (error) {
      console.error("Failed to load more:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading,
    threshold: 500,
    debounceMs: 500,
  })

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      {isLoading && <div>Loading more...</div>}
      {!hasMore && <div>No more items</div>}
    </div>
  )
}
```

### With useAsyncState

```typescript
import { useAsyncState, useInfiniteScroll } from "@dcl/hooks"

function ItemList() {
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<Item[]>([])

  const [result, { loading }] = useAsyncState(
    async () => fetchItems(page),
    [page]
  )

  useEffect(() => {
    if (result) {
      setAllItems((prev) => [...prev, ...result.items])
    }
  }, [result])

  useInfiniteScroll({
    onLoadMore: () => setPage((p) => p + 1),
    hasMore: result?.hasMore ?? true,
    isLoading: loading,
  })

  return <div>{allItems.map((item) => <ItemCard key={item.id} item={item} />)}</div>
}
```

## Common Patterns

- Combine with `useAsyncState` or local state for managing the fetched data.
- The `isLoading` flag prevents multiple concurrent load requests.

## Pitfalls

- Listens on `window` scroll only. Does **not** support custom scroll containers.
- Triggers automatically on mount after a 500ms delay if the page is already near the bottom.
- The `onLoadMore` reference is captured via `useRef` -- it always calls the latest version.
