# @dcl/hooks -- API Reference

React hooks library for Decentraland dApps. Install: `npm install @dcl/hooks`

Peer deps: `react@^18.0.0`, `decentraland-crypto-fetch@^2.0.1` (notifications only).

All exports come from `@dcl/hooks`.

---

## useAsyncState

Executes an async function, stores the result, and re-executes when dependencies change. Cancels stale requests automatically.

```typescript
function useAsyncState<T, I = null>(
  callback: () => Promise<T>,
  deps?: DependencyList,
  options?: Partial<{
    initialValue: T | I // default: null
    callWithTruthyDeps: boolean // default: false -- skip execution if any dep is falsy
  }>
): readonly [
  T | I,
  {
    version: number // increments on each execution
    loading: boolean
    error: Error | null
    time: number // execution time in ms
    loaded: boolean // true after first successful load
    reload: () => void // manually re-execute
    set: (value: ((current: T | I) => T) | T) => void // manually set value
  },
]
```

```typescript
import { useAsyncState } from "@dcl/hooks"

const [data, { loading, error, reload }] = useAsyncState(
  async () => {
    const res = await fetch("/api/items")
    return res.json()
  },
  [filter] // re-fetches when filter changes
)
```

**Gotchas**: Returns `null` by default until loaded. Use `initialValue` for a different default. The `set` callback accepts a value or an updater function.

---

## useAsyncMemo

Alias for `useAsyncState`. Same signature, same behavior. Types are re-exported as `AsyncMemoResult` and `AsyncMemoResultState`.

```typescript
import { useAsyncMemo } from "@dcl/hooks"
const [value, state] = useAsyncMemo(() => computeAsync(), [dep])
```

---

## useAsyncEffect

Async wrapper for `useEffect`. Supports optional cleanup return.

```typescript
function useAsyncEffect(
  callback: () => Promise<void | (() => void)>,
  dependencies?: DependencyList
): void
```

```typescript
import { useAsyncEffect } from "@dcl/hooks"

useAsyncEffect(async () => {
  const ws = new WebSocket(url)
  await ws.connected
  return () => ws.close() // optional cleanup
}, [url])
```

**Gotchas**: Errors are caught, logged to console, and sent to Sentry. Does not expose loading/error state -- use `useAsyncState` if you need that.

---

## useAsyncTask

Manages a single imperative async task. Returns loading state and a trigger function.

```typescript
function useAsyncTask<A extends any[]>(
  callback: (...args: A) => Promise<any>,
  deps: DependencyList
): readonly [boolean, (...args: A) => void]
//          loading   callTask
```

```typescript
import { useAsyncTask } from "@dcl/hooks"

const [isSaving, save] = useAsyncTask(async (id: string, data: FormData) => {
  await api.update(id, data)
}, [])

const handleSubmit = () => save(itemId, formData)
```

**Gotchas**: Does not return the result of the async function. Use `useAsyncState` if you need the return value. Errors are logged and sent to Sentry.

---

## useAsyncTasks

Manages multiple concurrent async tasks by ID. Prevents duplicate IDs.

```typescript
function useAsyncTasks<C extends (id: string, ...extra: any[]) => Promise<any>>(
  callback: C,
  deps: DependencyList
): readonly [string[], C]
//          activeIds  addTask
```

```typescript
import { useAsyncTasks } from "@dcl/hooks"

const [activeIds, markAsRead] = useAsyncTasks(
  async (notificationId: string) => {
    await api.markRead(notificationId)
  },
  []
)

const isProcessing = (id: string) => activeIds.includes(id)
```

**Gotchas**: If a task with the same ID is already running, `addTask` is a no-op. Tasks are removed from `activeIds` on completion or error.

---

## usePatchState

State hook that supports partial updates (like `setState` in class components).

```typescript
function usePatchState<T extends {}>(
  initialState: T
): readonly [T, (patch: Partial<T>) => void]
```

```typescript
import { usePatchState } from "@dcl/hooks"

const [filters, patchFilters] = usePatchState({
  search: "",
  category: "all",
  page: 1,
})

patchFilters({ page: 2 }) // only updates page, keeps search and category
```

---

## useInfiniteScroll

Triggers a callback when the user scrolls near the bottom of the page.

```typescript
function useInfiniteScroll(options: {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number // px from bottom, default: 500
  debounceMs?: number // min ms between triggers, default: 500
}): void
```

```typescript
import { useInfiniteScroll } from "@dcl/hooks"

useInfiniteScroll({
  onLoadMore: handleLoadMore,
  hasMore,
  isLoading,
  threshold: 500,
})
```

**Gotchas**: Listens on `window` scroll. Does not support custom scroll containers. Automatically triggers on mount after 500ms if already near bottom.

---

## useAdvancedUserAgentData

Detects browser, OS, CPU architecture, and device type using UAParser and Client Hints API.

```typescript
function useAdvancedUserAgentData(): [
  boolean,
  AdvancedNavigatorUAData | undefined,
]
//                                    loading  data

type AdvancedNavigatorUAData = {
  browser: { name: string; version: string }
  engine: { name: string; version: string }
  os: { name: string; version: string }
  cpu: { architecture: string }
  mobile: boolean
  tablet: boolean
}
```

```typescript
import { useAdvancedUserAgentData } from "@dcl/hooks"

const [isLoading, uaData] = useAdvancedUserAgentData()
if (!isLoading && uaData) {
  console.log(uaData.browser.name, uaData.os.name, uaData.mobile)
}
```

---

## AnalyticsProvider

Context provider for Segment analytics. Wrap your app with this to enable `useAnalytics` and `usePageTracking`. Skips initialization for bots.

```typescript
<AnalyticsProvider
  writeKey="SEGMENT_WRITE_KEY"  // required
  userId="user-123"             // optional
  traits={{ name: "John" }}     // optional
>
  {children}
</AnalyticsProvider>
```

---

## useAnalytics

Access analytics tracking functions. Must be inside `AnalyticsProvider`.

```typescript
function useAnalytics(): {
  isInitialized: boolean
  track: (event: string, payload?: EventProperties) => void
  identify: (userId: string, traits?: Record<string, unknown>) => void
  page: (name: string, props?: Record<string, unknown>) => void
}
```

```typescript
import { useAnalytics } from "@dcl/hooks"

const analytics = useAnalytics()
analytics.track("Button Clicked", { buttonId: "submit" })
```

**Gotchas**: Throws if used outside `AnalyticsProvider`. Returns no-op functions when `isInitialized` is false (before Segment loads).

---

## usePageTracking

Tracks page views when the path changes. Must be inside `AnalyticsProvider`.

```typescript
function usePageTracking(path: string): void
```

```typescript
import { usePageTracking } from "@dcl/hooks"
import { useLocation } from "react-router-dom"

const location = useLocation()
usePageTracking(location.pathname)
```

---

## TranslationProvider

Context provider for i18n. Wrap your app to use `useTranslation` without options.

```typescript
<TranslationProvider
  locale="en"                    // required
  translations={translationsObj} // required -- Record<string, Translations>
  fallbackLocale="en"            // optional
>
  {children}
</TranslationProvider>
```

---

## useTranslation

i18n hook powered by `@formatjs/intl`. Works standalone (with options) or via `TranslationProvider`.

```typescript
function useTranslation<L extends string = string>(
  options?: Partial<{
    locale: L
    translations: LanguageTranslations // Record<string, Translations>
    fallbackLocale: L
  }>
): {
  t: (key: string, values?: Record<string, string | number>) => string
  intl: IntlShape
  locale: string
  setLocale: (locale: string) => void
  error: string | null
}

// Translations can be nested -- they are flattened to dot notation
type Translations = { [key: string]: string | Translations }
type LanguageTranslations = Record<string, Translations>
```

```typescript
import { useTranslation } from "@dcl/hooks"

const { t, setLocale } = useTranslation({
  locale: "en",
  translations: {
    en: {
      greeting: "Hello, {name}!",
      items: "{count, plural, one {# item} other {# items}}",
    },
    es: {
      greeting: "Hola, {name}!",
      items: "{count, plural, one {# elemento} other {# elementos}}",
    },
  },
})

t("greeting", { name: "John" }) // "Hello, John!"
t("items", { count: 5 }) // "5 items"
```

**Gotchas**: Supports ICU message syntax (plurals, select, nested). Nested translation keys are flattened with dots: `{ a: { b: "x" } }` becomes `t("a.b")`. When using `TranslationProvider`, call `useTranslation()` with no arguments.

---

## useNotifications

Manages Decentraland notification polling, modal state, and onboarding.

```typescript
function useNotifications(options: {
  identity?: unknown // AuthIdentity from decentraland-crypto-fetch
  isNotificationsEnabled: boolean
  notificationsUrl: string // e.g. "https://notifications.decentraland.org"
  availableNotificationTypes?: string[]
  queryIntervalMs?: number // default: 60000
  initialActiveTab?: string // default: "newest"
  onError?: (error: Error) => void
  renderProfile?: (address: string) => ReactNode
}): {
  notifications: NotificationItem[]
  isLoading: boolean
  isModalOpen: boolean
  modalActiveTab: string
  isNotificationsOnboarding: boolean
  handleOnBegin: () => void
  handleNotificationsOpen: () => void
  handleOnChangeModalTab: (tab: string) => void
  handleRenderProfile: (address: string) => ReactNode
}

type NotificationItem = {
  id: string
  type: string
  read: boolean
  [key: string]: unknown
}
```

```typescript
import { useNotifications } from "@dcl/hooks"

const {
  notifications,
  isLoading,
  isModalOpen,
  handleNotificationsOpen,
  handleOnBegin,
} = useNotifications({
  identity,
  isNotificationsEnabled: !!identity,
  notificationsUrl: "https://notifications.decentraland.org",
})
```

**Gotchas**: Requires `decentraland-crypto-fetch` peer dep. Automatically marks notifications as read when modal closes. Onboarding state is persisted in localStorage under `dcl_notifications_onboarding`.

---

## createNotificationsClient

Factory for the Decentraland notifications API client. Used internally by `useNotifications`, but can be used standalone.

```typescript
function createNotificationsClient(
  identity: unknown, // AuthIdentity
  options: { url: string; limit?: number } // limit default: 50
): {
  getNotifications: () => Promise<NotificationItem[]>
  markNotificationsAsRead: (ids: string[]) => Promise<void>
}
```

---

## Utility Functions

### Storage Helpers

Typed localStorage wrappers with JSON serialization. Silently fail on errors.

```typescript
function getStorageItem<T>(key: string, fallback: T): T
function setStorageItem<T>(key: string, value: T): void
function removeStorageItem(key: string): void
```

```typescript
import { getStorageItem, setStorageItem } from "@dcl/hooks"

const prefs = getStorageItem<UserPrefs>("prefs", defaultPrefs)
setStorageItem("prefs", { ...prefs, theme: "dark" })
```

### Notification Helpers

```typescript
function checkIsOnboarding(): boolean // checks/initializes onboarding state in localStorage
function setOnboardingDone(): void // marks onboarding as complete
```

### State Factories

```typescript
function createAsyncStateState<T, I = null>(): AsyncStateResultState<T, I>
function createAsyncMemoState<T, I = null>(): AsyncStateResultState<T, I> // alias
```

Returns a default state object `{ version: 0, loading: false, time: 0, error: null, loaded: false, reload: noop, set: noop }`. Useful for initializing state before the hook runs.
