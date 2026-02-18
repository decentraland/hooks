# usePatchState

State hook that supports partial updates, similar to `this.setState()` in React class components. Merges partial updates into the current state.

## Import

```typescript
import { usePatchState } from "@dcl/hooks"
```

## Signature

```typescript
function usePatchState<T extends {}>(
  initialState: T
): readonly [T, (patch: Partial<T>) => void]
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Initial state object |

### Return Value

Returns `[state, patchState]` tuple:

| Field | Type | Description |
|-------|------|-------------|
| `state` | `T` | Current state object |
| `patchState` | `(patch: Partial<T>) => void` | Merges partial updates into state |

## Examples

### Filter state management

```typescript
import { usePatchState } from "@dcl/hooks"

type Filters = {
  search: string
  category: string
  page: number
  sortBy: string
}

function FilteredList() {
  const [filters, patchFilters] = usePatchState<Filters>({
    search: "",
    category: "all",
    page: 1,
    sortBy: "date",
  })

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => patchFilters({ search: e.target.value, page: 1 })}
      />
      <select
        value={filters.category}
        onChange={(e) => patchFilters({ category: e.target.value, page: 1 })}
      >
        <option value="all">All</option>
        <option value="art">Art</option>
      </select>
      <button onClick={() => patchFilters({ page: filters.page + 1 })}>
        Next Page
      </button>
    </div>
  )
}
```

### Form state

```typescript
const [form, patchForm] = usePatchState({
  name: "",
  email: "",
  agreed: false,
})

patchForm({ name: "John" })   // only updates name
patchForm({ agreed: true })    // only updates agreed
```

## Common Patterns

- Use when managing an object with multiple fields that are updated independently.
- Useful for filter objects, form state, or any complex state where `useState` with spread becomes verbose.

## Pitfalls

- Only performs a shallow merge (`{ ...current, ...patch }`). Nested objects are replaced, not deep-merged.
- The `patchState` function reference is stable (wrapped in `useCallback`).
