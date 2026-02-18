# useAsyncTasks

Manages multiple concurrent async tasks identified by unique string IDs. Prevents duplicate task execution for the same ID.

## Import

```typescript
import { useAsyncTasks } from "@dcl/hooks"
```

## Types

```typescript
type AsyncTaskIdentity = (id: string, ...extra: any[]) => Promise<any>
```

## Signature

```typescript
function useAsyncTasks<C extends AsyncTaskIdentity>(
  callback: C,
  deps: DependencyList
): readonly [string[], C]
//          activeIds  addTask
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `C` | Async function receiving `(id, ...extraArgs)` |
| `deps` | `DependencyList` | Dependency array for the callback |

### Return Value

Returns `[activeIds, addTask]` tuple:

| Field | Type | Description |
|-------|------|-------------|
| `activeIds` | `string[]` | Array of currently running task IDs |
| `addTask` | `C` | Function to start a new task by ID |

## Examples

### Marking items as read

```typescript
import { useAsyncTasks } from "@dcl/hooks"

function NotificationList({ notifications }: Props) {
  const [processingIds, markAsRead] = useAsyncTasks(
    async (notificationId: string) => {
      await api.markNotificationAsRead(notificationId)
    },
    []
  )

  return (
    <ul>
      {notifications.map((n) => (
        <li key={n.id}>
          {n.title}
          <button
            onClick={() => markAsRead(n.id)}
            disabled={processingIds.includes(n.id)}
          >
            {processingIds.includes(n.id) ? "Processing..." : "Mark Read"}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

### With extra arguments

```typescript
const [activeIds, updateItem] = useAsyncTasks(
  async (id: string, status: string) => {
    await api.updateStatus(id, status)
  },
  []
)

updateItem("item-1", "approved")
updateItem("item-2", "rejected")
```

### Checking if a specific task is running

```typescript
const isProcessing = (id: string) => activeIds.includes(id)
```

## Common Patterns

- Use for list operations where multiple items can be processed simultaneously (e.g., marking notifications as read, deleting items).
- Use `activeIds.includes(id)` to show per-item loading indicators.

## Pitfalls

- If `addTask` is called with an ID that is already in `activeIds`, the call is silently ignored (no duplicate tasks).
- Tasks are removed from `activeIds` on both success and error.
- Errors are logged to console and Sentry but not exposed per-task.
