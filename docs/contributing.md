# Contributing to @dcl/hooks

Internal patterns and conventions for developing this library. Intended for both human contributors and LLMs assisting with development.

## Project Structure

```
src/
├── index.ts                    # Main entry -- re-exports everything
├── hooks/
│   ├── index.ts                # Barrel export for all hooks + types
│   ├── useSimpleHook.ts        # Simple hooks: single file
│   └── useComplexHook/         # Complex hooks: directory
│       ├── index.ts            # Re-exports from implementation
│       ├── useComplexHook.ts   # Implementation
│       └── useComplexHook.type.ts  # Type definitions
├── contexts/
│   ├── index.ts
│   ├── analytics/
│   │   ├── AnalyticsProvider.tsx
│   │   └── types.ts
│   └── translation/
│       ├── TranslationContext.ts
│       ├── TranslationProvider.tsx
│       └── types.ts
├── clients/
│   ├── index.ts
│   └── notifications/
│       ├── createNotificationsClient.ts
│       └── index.ts
└── utils/
    ├── index.ts
    ├── storage.ts
    └── development/
        └── sentry.ts
test/
├── setup.ts
├── __mocks__/
│   ├── sentry.ts
│   └── decentraland-crypto-fetch.ts
└── hooks/
    └── [hook-name].test.ts
```

## File Layout Conventions

### Simple hooks (single file)

Use when the hook has few or no custom types:

```
src/hooks/usePatchState.ts
```

Types are defined inline in the same file.

### Complex hooks (directory)

Use when the hook has multiple types or supporting code:

```
src/hooks/useAsyncState/
├── index.ts                 # Re-exports
├── useAsyncState.ts         # Implementation
└── useAsyncState.type.ts    # Types only
```

The `index.ts` re-exports both the hook and types:

```typescript
export { useAsyncState, createAsyncStateState } from "./useAsyncState"
export type { AsyncStateResult, AsyncStateResultState } from "./useAsyncState"
```

## File Layout Order (within a hook file)

1. Imports
2. Types and interfaces (or import from `.type.ts`)
3. Hook implementation
4. Exports

## Type Naming Conventions

| Suffix     | Purpose                | Example                                              |
| ---------- | ---------------------- | ---------------------------------------------------- |
| `*State`   | Internal state shape   | `AsyncStateState<T, I>`, `NotificationsState`        |
| `*Options` | Hook parameters/config | `AsyncStateOptions<T, I>`, `UseNotificationsOptions` |
| `*Result`  | Hook return type       | `AsyncStateResult<T, I>`, `UseNotificationsResult`   |
| `*Props`   | Component props        | `AnalyticsProviderProps`, `TranslationProviderProps` |

- Use generics for data types: `<T>` for data, `<I>` for initial value type.
- Use `PascalCase` for types, `camelCase` for variables/functions, `UPPER_CASE` for constants.

## Export Chain

Every public export must flow through the barrel files:

```
src/hooks/useMyHook.ts
  → src/hooks/index.ts        (re-export hook + types)
  → src/index.ts              (re-exports from ./hooks)
```

When adding a new hook:

1. Export the hook from its file.
2. Add re-export to `src/hooks/index.ts` (both the hook and its public types).
3. `src/index.ts` already re-exports everything from `./hooks`.

## Error Handling Pattern

All async hooks follow the same pattern:

```typescript
import { sentry } from "../../utils/development/sentry"

// In the catch block:
.catch((err) => {
  console.error(err)
  sentry((sentry) => sentry.captureException(err))

  if (cancelled) return

  setState((current) => ({
    ...current,
    error: err,
    loading: false,
  }))
})
```

- Always log to `console.error`.
- Always report to Sentry via the `sentry()` utility.
- Check `cancelled` flag before updating state.
- Normalize unknown errors to `Error` when exposing to consumers.

## Async Cancellation Pattern

All async hooks guard against state updates after unmount or dependency change:

```typescript
useEffect(() => {
  let cancelled = false

  doAsyncWork().then((result) => {
    if (cancelled) return
    setState(result)
  })

  return () => {
    cancelled = true
  }
}, [deps])
```

## Testing Patterns

### Location and naming

- Tests live in `test/hooks/`
- File name matches hook: `[hook-name].test.ts` or `.test.tsx`

### Structure

```typescript
import { act, renderHook } from "@testing-library/react/pure"
import { useMyHook } from "../../src/hooks/useMyHook"

describe("useMyHook", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when initialized", () => {
    it("should return default state when no args provided", () => {
      const { result } = renderHook(() => useMyHook())
      expect(result.current).toEqual(expectedValue)
    })
  })

  describe("when action is performed", () => {
    it("should update state when action is called", () => {
      const { result } = renderHook(() => useMyHook())

      act(() => {
        result.current.doAction()
      })

      expect(result.current.value).toBe(expected)
    })
  })
})
```

### Key testing patterns used in this codebase

- **`renderHook`** from `@testing-library/react/pure` for hook testing.
- **`act()`** to wrap state changes.
- **`jest.fn()`** for callback mocks, verified with `toHaveBeenCalledWith`.
- **`jest.useFakeTimers()`** for timer-based hooks (e.g., `useCounterTimer`, `useNotifications`).
- **`jest.spyOn(console, "error")`** to verify error logging.
- **Deferred promises** for controlled async resolution in tests.
- **Test loading, success, and error states** for every async hook.
- **Test cleanup/unmount** to verify cancellation guards.

### Test naming

Follow: `"should [expected behavior] when [condition]"`.

### Coverage thresholds

- Statements: 90%
- Branches: 85%
- Functions: 90%
- Lines: 90%

## Adding a New Hook -- Checklist

1. **Create the file(s)**:

   - Simple hook: `src/hooks/useMyHook.ts`
   - Complex hook: `src/hooks/useMyHook/` directory with `index.ts`, `useMyHook.ts`, `useMyHook.type.ts`

2. **Implement the hook** following the file layout order (imports, types, implementation, exports).

3. **Add JSDoc** with `@param` and `@returns` for the public hook function.

4. **Export from barrel**:

   - Add to `src/hooks/index.ts` (both hook and public types)
   - `src/index.ts` re-exports automatically

5. **Write tests** in `test/hooks/useMyHook.test.ts`:

   - Test initial state, state updates, error handling, cleanup
   - Follow the `describe`/`it` naming convention
   - Meet coverage thresholds

6. **Add documentation**:
   - Add entry to `docs/[hookName].md`
   - Add to the hooks table in `README.md`
   - Add section to `AGENTS.md`

## Code Style

- **Formatter**: Prettier (no semicolons, double quotes, 2-space indent, trailing commas in ES5 positions)
- **Linter**: ESLint with `@dcl/eslint-config/ui`
- **TypeScript**: Strict mode (`strict: true`, `noImplicitAny`, `strictNullChecks`, `noUnusedParameters`, `noUnusedLocals`)

## Build

- ESM only (`"type": "module"` in package.json)
- Output to `esm/` via `tsc -p tsconfig.esm.json`
- Target: ESNext
