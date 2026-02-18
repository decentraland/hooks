# useAsyncTask

Manages a single imperative async task. Returns a loading state and a function to trigger execution with arguments.

## Import

```typescript
import { useAsyncTask } from "@dcl/hooks"
```

## Signature

```typescript
function useAsyncTask<A extends any[]>(
  callback: (...args: A) => Promise<any>,
  deps: DependencyList
): readonly [boolean, (...args: A) => void]
//          loading   callTask
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `(...args: A) => Promise<any>` | Async function to execute when triggered |
| `deps` | `DependencyList` | Dependency array for the callback |

### Return Value

Returns `[loading, callTask]` tuple:

| Field | Type | Description |
|-------|------|-------------|
| `loading` | `boolean` | True while the task is executing |
| `callTask` | `(...args: A) => void` | Function to trigger the async task |

## Examples

### Basic form submission

```typescript
import { useAsyncTask } from "@dcl/hooks"

function SubmitForm() {
  const [isSaving, save] = useAsyncTask(async (data: FormData) => {
    await api.submitForm(data)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    save(new FormData(e.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  )
}
```

### With typed arguments

```typescript
const [isDeleting, deleteItem] = useAsyncTask(
  async (id: string, reason: string) => {
    await api.delete(id, { reason })
  },
  []
)

deleteItem("item-123", "No longer needed")
```

### Preventing double-submit

```typescript
const [isSubmitting, submit] = useAsyncTask(async () => {
  await api.process()
}, [])

// loading state prevents re-trigger while running
<button onClick={() => submit()} disabled={isSubmitting}>Submit</button>
```

## Common Patterns

- Use for user-triggered actions (submit, delete, toggle) where you need loading state.
- The loading state automatically prevents visual double-submit when used with `disabled`.

## Pitfalls

- Does **not** return the result of the async function. If you need the return value, use `useAsyncState` with manual `reload`.
- Errors are logged to console and Sentry but not exposed as state.
- If the component unmounts during execution, state updates are safely cancelled.
